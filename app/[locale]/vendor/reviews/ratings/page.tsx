"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { REVIEW_POLICY, averageRating, enrichReviews, productRatings, ratingDistribution } from "@/features/vendor/reviews";
import { useVendorProducts, useVendorReviews } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";

export default function VendorRatingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const raw = useVendorReviews();
  const products = useVendorProducts();
  const [range, setRange] = useState("30D");

  const num = (v: number) => format.number(v);

  const reviews = useMemo(() => enrichReviews(raw, products), [raw, products]);
  const avg = useMemo(() => averageRating(reviews), [reviews]);
  const dist = useMemo(() => ratingDistribution(reviews), [reviews]);
  const table = useMemo(() => productRatings(reviews), [reviews]);
  const low = useMemo(
    () => table.filter((p) => p.avg < 4 && p.avg >= REVIEW_POLICY.lowRatingThreshold || p.avg < REVIEW_POLICY.lowRatingThreshold).sort((a, b) => a.avg - b.avg).slice(0, 3),
    [table]
  );

  const trend = useMemo(() => {
    const pts = [...reviews].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ x: r.date.slice(5), y: r.rating }));
    if (range === "7D") return pts.slice(-2);
    return pts.length > 0 ? pts : [{ x: "—", y: 0 }];
  }, [reviews, range]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")} title={t("rwRatings")} subtitle={`${t("rwAvg")}: ${avg} / 5 · ${num(reviews.length)}`}
        highlightLabel={t("rwAvg")} highlightValue={`${avg} / 5`} highlightIcon={Star}
      />

      <ReviewTabs />
      <p className="text-xs text-muted-foreground">{t("rwDrill")}</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("rwAvg")} value={`${avg} / 5`} href="/vendor/reviews/ratings" accent />
        <EarnStatCard label={t("rwTotalRatings")} value={num(reviews.length)} href="/vendor/reviews/products" />
        {dist.slice(0, 2).map((d) => (
          <Link
            key={d.stars}
            href="/vendor/reviews/products"
            className="block border border-border bg-card p-3 text-left transition-colors hover:border-secondary"
            aria-label={`Filter ${d.stars} star`}
          >
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{d.stars} ★ %</p>
            <p className="font-heading text-xl font-bold">{d.pct}%</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
            <RevenueChart data={trend} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
            <AlertTriangle className="size-4 text-secondary" aria-hidden="true" />
            <CardTitle className="font-heading text-base font-bold">{t("rwLowRated")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {low.length > 0 ? low.map((p) => (
              <Link
                key={p.name}
                href={p.productId ? `/vendor/products/${p.productId}` : "/vendor/reviews/products"}
                className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{num(p.count)} {t("rwTotal")} · {p.lastDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <StarsRow value={p.avg} />
                  <span className="text-sm font-bold text-destructive">{p.avg}</span>
                </span>
              </Link>
            )) : <p className="py-4 text-center text-sm text-muted-foreground">{t("emptyDescription")}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("rwRatings")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("rwProduct")}</TableHead>
                <TableHead className="text-right">{t("rwTotal")}</TableHead>
                <TableHead className="text-right">{t("rwAvg")}</TableHead>
                <TableHead className="text-right">5★</TableHead>
                <TableHead className="text-right">4★</TableHead>
                <TableHead className="text-right">3★</TableHead>
                <TableHead className="text-right">2★</TableHead>
                <TableHead className="text-right">1★</TableHead>
                <TableHead>{t("rwPositivePct")}</TableHead>
                <TableHead>{t("rwLastReview")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>
                    {p.productId ? (
                      <Link href={`/vendor/products/${p.productId}`} className="font-semibold hover:text-secondary hover:underline">{p.name}</Link>
                    ) : <span className="font-semibold">{p.name}</span>}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <Link href="/vendor/reviews/products" className="hover:text-secondary hover:underline">{num(p.count)}</Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/vendor/reviews/products" className="flex items-center justify-end gap-1.5 hover:text-secondary">
                      <StarsRow value={p.avg} />
                      <span className="font-bold">{p.avg}</span>
                    </Link>
                  </TableCell>
                  {p.dist.map((c, i) => (
                    <TableCell key={i} className="text-right text-xs">
                      <Link href="/vendor/reviews/products" className="hover:text-secondary hover:underline">{num(c)}</Link>
                    </TableCell>
                  ))}
                  <TableCell className="font-bold text-green-700">{p.positive}%</TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.lastDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
