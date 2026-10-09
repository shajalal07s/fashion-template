"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { vendorSalesTrend } from "@/features/vendor/vendor";
import { useVendorProducts } from "@/store/vendor.store";
import { demoVendorCustomers } from "@/features/vendor/vendor";
import { BarChart3 } from "lucide-react";

export default function VendorAnalyticsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const products = useVendorProducts();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const trend = useMemo(() => vendorSalesTrend(), []);

  const funnel = useMemo(() => {
    const views = products.reduce((n, p) => n + p.views, 0);
    const carts = products.reduce((n, p) => n + p.carts, 0);
    const ord = products.reduce((n, p) => n + p.sold, 0);
    const sales = products.reduce((n, p) => n + p.sold * p.price, 0);
    return { views, carts, ord, sales, conv: views > 0 ? Math.round((ord / views) * 1000) / 10 : 0 };
  }, [products]);

  const categorySlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + p.sold * p.price);
    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
  }, [products]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_analytics")}
        title={t("aTitle")}
        subtitle={t("aSubtitle")}
        highlightLabel={t("convRate")}
        highlightValue={`${funnel.conv}%`}
        highlightIcon={BarChart3}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("salesPerf")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("prodPerf")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={categorySlices} unitLabel={t("revenue")} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("prodPerf")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {[
            [t("mViews"), num(funnel.views)],
            [t("mCarts"), num(funnel.carts)],
            [t("mOrders"), num(funnel.ord)],
            [t("mSales"), money(funnel.sales)],
            [t("mConversion"), `${funnel.conv}%`],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0">
              <span className="text-muted-foreground">{l as string}</span>
              <span className="font-bold">{v as string}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("custChart")} · {num(demoVendorCustomers.length)}</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart
            data={[
              { x: "Apr", y: 2 }, { x: "May", y: 3 }, { x: "Jun", y: 2 },
              { x: "Jul", y: 4 }, { x: "Aug", y: 5 }, { x: "Sep", y: 6 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
