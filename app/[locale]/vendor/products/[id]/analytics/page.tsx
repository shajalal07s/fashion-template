"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { useVendorProducts } from "@/store/vendor.store";

const RANGES = ["Today", "7 Days", "30 Days", "90 Days", "1 Year"] as const;

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className="font-heading truncate text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ProductAnalyticsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const products = useVendorProducts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [range, setRange] = useState<(typeof RANGES)[number]>("30 Days");
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const base = useMemo(() => {
    if (!product) return [];
    const monthly = product.revenue / 6;
    return [
      { x: "Apr", y: Math.round(monthly * 0.8) },
      { x: "May", y: Math.round(monthly) },
      { x: "Jun", y: Math.round(monthly * 0.9) },
      { x: "Jul", y: Math.round(monthly * 1.1) },
      { x: "Aug", y: Math.round(monthly * 1.3) },
      { x: "Sep", y: Math.round(monthly * 1.2) },
    ];
  }, [product]);

  const data = range === "Today" ? base.slice(-1) : range === "7 Days" ? base.slice(-2) : range === "90 Days" || range === "1 Year" ? base : base.slice(-3);

  if (!product) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_products")}
          title={t("anTitle")}
          subtitle={id}
          highlightLabel={t("mViews2")}
          highlightValue="0"
          highlightIcon={BarChart3}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyProducts")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversion = product.views > 0 ? Math.round((product.sold / product.views) * 1000) / 10 : 0;
  const visitors = Math.round(product.views * 0.72);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={`${t("anTitle")} · ${product.name}`}
        subtitle={t("anSubtitle")}
        highlightLabel={t("mRevenue")}
        highlightValue={money(product.revenue)}
        highlightIcon={BarChart3}
      >
        <Link href={`/vendor/products/${product.id}`} className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("view")}
        </Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Mini label={t("mViews2")} value={num(product.views)} />
        <Mini label={t("mVisitors")} value={num(visitors)} />
        <Mini label={t("mCarts")} value={num(product.carts)} />
        <Mini label={t("mOrders")} value={num(product.sold)} />
        <Mini label={t("mConv")} value={`${conversion}%`} />
        <Mini label={t("mRevenue")} value={money(product.revenue)} />
        <Mini label={t("mUnits")} value={num(product.sold)} />
        <Mini label={t("mRefunds")} value={money(0)} />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("anTitle")} · {range}</CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map((r) => (
              <Button key={r} variant={range === r ? "default" : "outline"} size="sm" className={range === r ? "h-7 text-xs" : "h-7 bg-card text-xs"} onClick={() => setRange(r)}>
                {r}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("mRevenue")}</p>
            <RevenueChart data={data} />
          </div>
          <div>
            <p className="pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("mViews2")}</p>
            <RevenueChart data={data.map((d) => ({ x: d.x, y: Math.round(d.y / 40) }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
