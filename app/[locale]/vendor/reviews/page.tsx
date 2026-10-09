"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Download, MessageSquare, RefreshCw, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import {
  averageRating,
  enrichReviews,
  productRatings,
  ratingDistribution,
  reviewResponseSchema,
} from "@/features/vendor/reviews";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorProducts, useVendorReviews, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

export default function VendorReviewsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const raw = useVendorReviews();
  const products = useVendorProducts();
  const store = useVendorStore();

  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const reviews = useMemo(() => enrichReviews(raw, products), [raw, products]);
  const avg = useMemo(() => averageRating(reviews), [reviews]);
  const dist = useMemo(() => ratingDistribution(reviews), [reviews]);
  const topProducts = useMemo(() => productRatings(reviews).slice(0, 4), [reviews]);
  const recent = useMemo(() => [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4), [reviews]);

  const [ready, setReady] = useState(false);
  const [range, setRange] = useState("30D");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  const trend = useMemo(() => {
    const pts = [...reviews]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r, i) => ({ x: r.date.slice(5), y: i + 1 }));
    if (range === "7D") return pts.slice(-2);
    return pts.length > 0 ? pts : [{ x: "—", y: 0 }];
  }, [reviews, range]);

  const pending = reviews.filter((r) => r.status === "pending").length;
  const unanswered = reviews.filter((r) => !r.replied).length;

  const submitReply = () => {
    if (!replyId) return;
    const parsed = reviewResponseSchema.safeParse({ response: replyText.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid response");
      return;
    }
    store.replyReview(replyId, replyText.trim());
    store.notifyVendor(`Response published for review ${replyId}.`, "review");
    setReplyId(null);
    setReplyText("");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")}
        title={t("rvTitle")}
        subtitle={t("rvSubtitle", { count: reviews.length })}
        highlightLabel={t("rwAvg")}
        highlightValue={`${avg} / 5`}
        highlightIcon={Star}
      >
        <Link href="/vendor/reviews/products" className={heroPillClassName}>
          <MessageSquare className="size-3.5" aria-hidden="true" />
          {t("rwProducts")}
        </Link>
        <button
          type="button"
          onClick={() => {
            downloadCsv("reviews.csv", ["id", "customer", "product", "rating", "status", "date"],
              reviews.map((r) => [r.id, r.customer, r.product, r.rating, r.status, r.date]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <ReviewTabs />

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <EarnStatCard label={t("rwTotal")} value={num(reviews.length)} href="/vendor/reviews/products" accent />
          <EarnStatCard label={t("rwAvg")} value={`${avg} / 5`} href="/vendor/reviews/ratings" accent />
          <EarnStatCard label={t("rwPending")} value={num(pending)} href="/vendor/reviews/products" />
          <EarnStatCard label={t("rwUnanswered")} value={num(unanswered)} href="/vendor/reviews/products" />
          <EarnStatCard label="5 ★" value={num(dist[0]?.count ?? 0)} sub={`${dist[0]?.pct ?? 0}%`} href="/vendor/reviews/products" />
          <EarnStatCard label="4 ★" value={num(dist[1]?.count ?? 0)} sub={`${dist[1]?.pct ?? 0}%`} href="/vendor/reviews/products" />
          <EarnStatCard label="3 ★" value={num(dist[2]?.count ?? 0)} sub={`${dist[2]?.pct ?? 0}%`} href="/vendor/reviews/products" />
          <EarnStatCard label="2 ★" value={num(dist[3]?.count ?? 0)} sub={`${dist[3]?.pct ?? 0}%`} href="/vendor/reviews/products" />
          <EarnStatCard label="1 ★" value={num(dist[4]?.count ?? 0)} sub={`${dist[4]?.pct ?? 0}%`} href="/vendor/reviews/products" />
          <EarnStatCard label={t("rwPublished")} value={num(reviews.filter((r) => r.status === "published").length)} href="/vendor/reviews/ratings" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("rwDist")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {dist.map((d) => (
              <Link
                key={d.stars}
                href="/vendor/reviews/products"
                className="flex items-center gap-3 transition-colors hover:bg-muted/50"
                aria-label={`Filter ${d.stars} star reviews`}
              >
                <span className="w-8 shrink-0 text-sm font-bold">{d.stars} ★</span>
                <span className="h-2.5 flex-1 bg-muted" role="progressbar" aria-valuenow={d.pct} aria-valuemin={0} aria-valuemax={100}>
                  <span className="block h-full bg-secondary" style={{ width: `${d.pct}%` }} />
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{num(d.count)} · {d.pct}%</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("rwTrend")} · {range}</CardTitle>
            <Select value={range} onValueChange={(v) => setRange(v ?? "30D")}>
              <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label={t("eDateRange")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {["7D", "30D", "90D", "6M", "1Y"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {!ready ? <Skeleton className="h-[260px] w-full" /> : <RevenueChart data={trend} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("rwTopProducts")}</CardTitle>
            <Link href="/vendor/reviews/ratings" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {topProducts.map((p) => (
              <Link
                key={p.name}
                href={p.productId ? `/vendor/products/${p.productId}` : "/vendor/reviews/ratings"}
                className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{num(p.count)} {t("rwTotal")} · {p.positive}% +</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <StarsRow value={p.avg} />
                  <span className="text-sm font-bold">{p.avg}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("rwRecent")}</CardTitle>
            <Link href="/vendor/reviews/products" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {recent.length > 0 ? recent.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5 border border-border p-2.5">
                <CustomerAvatar name={r.customer} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="truncate font-bold">{r.customer}</span>
                    <StarsRow value={r.rating} />
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{r.product} · {dateOf(r.date)} · {r.status}{r.replied ? ` · ${t("rwResponded")}` : ""}</p>
                  <p className="line-clamp-2 text-sm">{r.text}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link href={`/vendor/reviews/${r.id}`}>
                    <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${r.id}`}><Star className="size-4" aria-hidden="true" /></Button>
                  </Link>
                  {!r.replied ? (
                    <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => { setReplyId(r.id); setReplyText(""); }}>
                      {t("rwRespond")}
                    </Button>
                  ) : null}
                </div>
              </div>
            )) : <EmptyState icon={Star} title={t("emptyTitle")} description={t("emptyReviews")} />}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!replyId} onOpenChange={(o: boolean) => !o && setReplyId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("rwRespond")} · <span className="font-mono">{replyId}</span></DialogTitle>
          </DialogHeader>
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={t("rwWriteResponse")} rows={4} className="bg-card" maxLength={500} />
          <p className="text-right text-[11px] text-muted-foreground">{replyText.length}/500</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyId(null)}>{t("cancel")}</Button>
            <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>{t("rwSubmitResponse")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
