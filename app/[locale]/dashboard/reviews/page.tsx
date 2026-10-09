"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowRight,
  Flag,
  Hourglass,
  Star,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { Stars } from "@/components/admin/reviews/shared";
import {
  averageRating,
  ratingDistribution,
  reviewsTrend,
} from "@/features/admin/reviews";
import { useProductReviews, useVendorReviews } from "@/store/reviews.store";

function Mini({ label, value, tile, sub }: { label: string; value: string; tile: string; sub?: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Star className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
          {sub ? <span className="truncate text-[11px] text-muted-foreground">{sub}</span> : null}
        </span>
      </CardContent>
    </Card>
  );
}

export default function ReviewsOverviewPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const products = useProductReviews();
  const vendors = useVendorReviews();
  const num = (v: number) => format.number(v);

  const all = useMemo(() => [...products, ...vendors], [products, vendors]);
  const dist = useMemo(() => ratingDistribution(all), [all]);
  const avg = useMemo(() => averageRating(all), [all]);
  const trend = useMemo(() => reviewsTrend(), []);
  const byStatus = (s: string) => all.filter((r) => r.status === s).length;

  const kpis = [
    { label: t("kpiTotal"), value: num(all.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiAvg"), value: `${avg} / 5`, tile: "bg-primary/20 text-[#8a5a00]", sub: `${num(all.reduce((n, r) => n + r.rating, 0))} stars` },
    { label: t("kpi5"), value: num(dist[0].count), tile: "bg-green-600/10 text-green-700", sub: `${dist[0].pct}%` },
    { label: t("kpi4"), value: num(dist[1].count), tile: "bg-green-600/10 text-green-700", sub: `${dist[1].pct}%` },
    { label: t("kpi3"), value: num(dist[2].count), tile: "bg-primary/15 text-secondary", sub: `${dist[2].pct}%` },
    { label: t("kpi2"), value: num(dist[3].count), tile: "bg-destructive/10 text-destructive", sub: `${dist[3].pct}%` },
    { label: t("kpi1"), value: num(dist[4].count), tile: "bg-destructive/10 text-destructive", sub: `${dist[4].pct}%` },
    { label: t("kpiPending"), value: num(byStatus("pending")), tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiReported"), value: num(byStatus("reported")), tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiPublished"), value: num(byStatus("published")), tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiRejected"), value: num(byStatus("rejected")), tile: "bg-muted text-muted-foreground" },
  ];

  const topProducts = useMemo(() => {
    const map = new Map<string, { vendor: string; ratings: number[] }>();
    for (const r of products) {
      const e = map.get(r.product) ?? { vendor: r.vendor, ratings: [] };
      e.ratings.push(r.rating);
      map.set(r.product, e);
    }
    return [...map.entries()]
      .map(([product, v]) => ({ product, vendor: v.vendor, avg: averageRating(v.ratings.map((rating) => ({ rating }))), count: v.ratings.length }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 5);
  }, [products]);

  const lowProducts = useMemo(() => [...topProducts].sort((a, b) => a.avg - b.avg).slice(0, 4), [topProducts]);

  const topVendors = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const r of vendors) {
      const arr = map.get(r.store) ?? [];
      arr.push(r.rating);
      map.set(r.store, arr);
    }
    return [...map.entries()]
      .map(([store, ratings]) => ({ store, avg: averageRating(ratings.map((rating) => ({ rating }))), count: ratings.length }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [vendors]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiAvg")}
        highlightValue={`${avg} / 5`}
        highlightIcon={Star}
      >
        <Link href="/dashboard/reviews/products" className={heroPillClassName}>{ts("revProducts")}</Link>
        <Link href="/dashboard/reviews/pending" className={heroPillClassName}>{ts("revPending")}</Link>
        <Link href="/dashboard/reviews/moderation" className={heroPillClassName}>{ts("revModeration")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Mini key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("distribution")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {dist.map((d) => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="flex w-10 items-center gap-1 text-sm font-bold">
                  {d.stars} <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                </span>
                <div className="h-2.5 flex-1 bg-muted">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-16 text-right text-xs font-semibold text-muted-foreground">
                  {num(d.count)} · {d.pct}%
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <ThumbsUp className="size-4 text-green-600" aria-hidden="true" />
                {t("kpiPublished")}: {num(byStatus("published"))}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Hourglass className="size-4 text-[#8a5a00]" aria-hidden="true" />
                {t("kpiPending")}: {num(byStatus("pending"))}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Flag className="size-4 text-destructive" aria-hidden="true" />
                {t("kpiReported")}: {num(byStatus("reported"))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("topProducts")}</CardTitle>
            <Link href="/dashboard/reviews/products">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {topProducts.map((p) => (
              <div key={p.product} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.product}</span>
                  <span className="block text-xs text-muted-foreground">{p.vendor} · {num(p.count)}</span>
                </span>
                <Stars value={Math.round(p.avg)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="flex items-center gap-1.5 font-heading text-base font-bold">
              <XCircle className="size-4 text-destructive" aria-hidden="true" />
              {t("lowProducts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {lowProducts.map((p) => (
              <div key={p.product} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.product}</span>
                  <span className="block text-xs text-muted-foreground">{p.vendor} · {num(p.count)}</span>
                </span>
                <Stars value={Math.round(p.avg)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("topVendors")}</CardTitle>
            <Link href="/dashboard/reviews/vendors">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {topVendors.map((v) => (
              <div key={v.store} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{v.store}</span>
                  <span className="block text-xs text-muted-foreground">{num(v.count)} reviews</span>
                </span>
                <Stars value={Math.round(v.avg)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("avgTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={[{ x: "Apr", y: 4.1 }, { x: "May", y: 4.3 }, { x: "Jun", y: 4.0 }, { x: "Jul", y: 4.4 }, { x: "Aug", y: 4.2 }, { x: "Sep", y: 4.3 }]} />
        </CardContent>
      </Card>
    </div>
  );
}
