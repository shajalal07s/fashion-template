"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Eye, Flag, Search, Star, ThumbsUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Stars } from "@/components/admin/reviews/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { useVendorProducts, useVendorReviews, useVendorStore } from "@/store/vendor.store";
import { toast } from "sonner";

export default function VendorProductReviewsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const reviews = useVendorReviews();
  const products = useVendorProducts();
  const store = useVendorStore();
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [viewId, setViewId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [helpful, setHelpful] = useState<Set<string>>(new Set());

  const productNames = useMemo(() => [...new Set(reviews.map((r) => r.product))], [reviews]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (ratingFilter === "all" || r.rating === Number(ratingFilter)) &&
        (productFilter === "all" || r.product === productFilter) &&
        (!q || r.customer.toLowerCase().includes(q) || r.text.toLowerCase().includes(q))
    );
  }, [reviews, query, ratingFilter, productFilter]);

  const imageOf = (product: string) =>
    products.find((p) => p.name === product)?.image ?? "/images/women/women-1.jpg";

  const handleReply = () => {
    if (!replyId || !replyText.trim()) return;
    store.replyReview(replyId, replyText.trim());
    setReplyId(null);
    setReplyText("");
    toast.success(t("toastReply"));
  };

  const viewed = viewId ? (reviews.find((r) => r.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={t("rvTitle")}
        subtitle={t("rvSubtitle", { count: reviews.length })}
        highlightLabel={t("tRating")}
        highlightValue={`${reviews.length > 0 ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0} / 5`}
        highlightIcon={Star}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("tRating")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ★</SelectItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <SelectItem key={s} value={String(s)}>{s} ★</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={(v) => setProductFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-52 bg-card" aria-label={t("tProduct2")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {productNames.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tProduct2")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead className="text-center">{t("tRating")}</TableHead>
                  <TableHead>{t("tReview")}</TableHead>
                  <TableHead>{t("tDate")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageOf(r.product)} alt={r.product} className="size-9 shrink-0 object-cover" loading="lazy" />
                        <p className="max-w-36 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <p className="max-w-24 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Stars value={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-52 truncate text-xs text-muted-foreground" title={r.text}>
                      “{r.text}”
                      {r.replied && r.reply ? <span className="block truncate text-secondary">↳ {r.reply}</span> : null}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(r.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("view")} ${r.customer}`} title={t("view")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {!r.replied ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setReplyId(r.id); setReplyText(""); }}>
                            {t("reply")}
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setHelpful((prev) => new Set(prev).add(r.id));
                            toast.success(`${t("helpfulCount")} +1`);
                          }}
                          aria-label={`${t("markHelpful")} ${r.customer}`}
                          title={t("markHelpful")}
                          disabled={helpful.has(r.id)}
                        >
                          <ThumbsUp className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => toast.success(t("report"))} aria-label={`${t("report")} ${r.customer}`} title={t("report")}>
                          <Flag className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Star} title={t("emptyTitle")} description={t("emptyReviews")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewed.product}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <CustomerAvatar name={viewed.customer} size="sm" />
                <p className="text-sm font-bold">{viewed.customer}</p>
                <span className="ml-auto">
                  <Stars value={viewed.rating} />
                </span>
              </div>
              <p className="border border-border bg-card p-3 text-sm">“{viewed.text}”</p>
              <div className="flex justify-end gap-2">
                <Link href={`/vendor/products/${products.find((p) => p.name === viewed.product)?.id ?? ""}`}>
                  <Button variant="outline" size="sm" className="bg-card">{t("view")}</Button>
                </Link>
                {!viewed.replied ? (
                  <Button size="sm" onClick={() => { setViewId(null); setReplyId(viewed.id); setReplyText(""); }}>
                    {t("reply")}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyId} onOpenChange={(open) => !open && setReplyId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("reply")}</DialogTitle>
          </DialogHeader>
          <Field label={t("reply")}>
            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={t("replyPh")} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleReply}>{t("saveReply")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
