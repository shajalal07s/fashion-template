"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { MapPin } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { ExportReportButton, GeoBreadcrumb, ReportKpi } from "@/components/admin/reports/shared";
import {
  aovOf,
  districtCustomers,
  districtStats,
  districtTopProducts,
  districtTopVendors,
  districtTrend,
  getDivision,
  slugify,
} from "@/features/admin/reports";
import { Boxes, HandCoins, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";

export function DistrictReport({
  country,
  division,
  district,
}: {
  country: string;
  division: string;
  district: string;
}) {
  const t = useTranslations("Dashboard.reports");
  const format = useFormatter();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const [range, setRange] = useState("30");

  const div = getDivision(division);
  const match = div?.districts.find((d) => slugify(d) === district) ?? null;
  const stat = useMemo(() => {
    const divName = div?.name ?? division;
    if (!match) {
      const fallback = district
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
      return districtStats(fallback, divName);
    }
    return districtStats(match, divName);
  }, [district, division, div, match]);

  const trend = useMemo(() => districtTrend(stat.slug), [stat.slug]);
  const topProducts = useMemo(() => districtTopProducts(stat.slug), [stat.slug]);
  const topVendors = useMemo(() => districtTopVendors(stat.slug), [stat.slug]);
  const customers = useMemo(() => districtCustomers(stat.slug), [stat.slug]);

  const orderSlices = useMemo(
    () => [
      { id: "Completed", label: t("dDelivered"), value: Math.round(stat.orders * 0.82) },
      { id: "Shipped", label: t("dProcessing"), value: Math.round(stat.orders * 0.09) },
      { id: "Failed", label: t("dCancelled"), value: Math.round(stat.orders * 0.05) },
      { id: "Missed", label: t("dReturned"), value: Math.round(stat.orders * 0.04) },
    ],
    [stat.orders, t]
  );

  const filteredTrend = range === "7" ? trend.slice(-2) : range === "90" ? trend : range === "12" ? trend : trend.slice(-2);

  if (!div || !match) {
    return (
      <div className="flex flex-col gap-6">
        <GeoBreadcrumb
          trail={[
            { label: t("title"), href: "/dashboard/reports" },
            { label: t("gTitle"), href: "/dashboard/reports/geography" },
          ]}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={MapPin} title={t("emptyTitle")} description={t("emptyDistrict")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GeoBreadcrumb
        trail={[
          { label: t("title"), href: "/dashboard/reports" },
          { label: t("gTitle"), href: "/dashboard/reports/geography" },
          { label: "Bangladesh", href: "/dashboard/reports/geography/bangladesh" },
          { label: div.name, href: `/dashboard/reports/geography/bangladesh/${div.slug}` },
          { label: stat.name },
        ]}
      />

      <AccountingHero
        eyebrow={`${div.name}, Bangladesh`}
        title={stat.name}
        subtitle={`${t("tOrders")}: ${num(stat.orders)} · ${t("tRevenue")}: ${money(stat.revenue)}`}
        highlightLabel={t("tSales")}
        highlightValue={money(stat.sales)}
        highlightIcon={MapPin}
      >
        <Link href={`/dashboard/reports/geography/${country}/${division}`} className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("backTo")} {div.name}
        </Link>
        <ExportReportButton
          reportType={`district-${stat.slug}`}
          headers={["district", "orders", "sales", "revenue", "customers", "vendors", "refunds", "tax"]}
          rows={[[stat.name, stat.orders, stat.sales, stat.revenue, stat.customers, stat.vendors, stat.refunds, stat.tax]]}
        />
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ReportKpi label={t("dOrders")} value={num(stat.orders)} delta={8} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("tSales")} value={money(stat.sales)} delta={10} icon={ShoppingCart} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("tRevenue")} value={money(stat.revenue)} delta={9} icon={Wallet} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("tCustomers")} value={num(stat.customers)} delta={12} icon={Users} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("tVendors")} value={num(stat.vendors)} icon={Users} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("tProducts2")} value={num(stat.products)} delta={4} icon={Boxes} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("tRefunds")} value={money(stat.refunds)} delta={-3} icon={HandCoins} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("tTax2")} value={money(stat.tax)} delta={5} icon={Receipt} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("tAov")} value={money(aovOf(stat))} icon={Wallet} tile="bg-muted text-muted-foreground" />
        <ReportKpi label={t("dNew")} value={num(Math.round(stat.customers * 0.22))} delta={15} icon={Users} tile="bg-green-600/10 text-green-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartTrend")}</CardTitle>
            <div className="flex items-center gap-1">
              {[
                ["7", "7D"],
                ["30", "30D"],
                ["90", "90D"],
                ["12", "12M"],
              ].map(([v, l]) => (
                <Button key={v} variant={range === v ? "default" : "outline"} size="sm" className={range === v ? "h-7 text-xs" : "h-7 bg-card text-xs"} onClick={() => setRange(v)}>
                  {l}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={filteredTrend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={orderSlices} unitLabel={t("dOrders")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {topProducts.slice(0, 5).map((p) => (
              <div key={p.product} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.product}</span>
                  <span className="block text-xs text-muted-foreground">{p.vendor} · {num(p.orders)} {t("tOrders")}</span>
                </span>
                <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(p.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("tVendors")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {topVendors.slice(0, 5).map((v) => (
              <div key={v.vendor} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{v.vendor}</span>
                  <span className="block text-xs text-muted-foreground">{num(v.orders)} {t("tOrders")} · {t("tRevenue")} {money(v.revenue)}</span>
                </span>
                <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(v.payout)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dCustomers")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {customers.slice(0, 4).map((c) => (
              <div key={c.customer} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.customer}</span>
                  <span className="block text-xs text-muted-foreground">{num(c.orders)} {t("tOrders")} · {c.last}</span>
                </span>
                <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(c.spent)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dNetTax")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            <TaxRow label={t("dTaxable")} value={money(stat.sales)} />
            <TaxRow label={t("dTaxCollected")} value={money(stat.tax)} />
            <TaxRow label={t("dTaxRefunded")} value={money(Math.round(stat.tax * 0.06))} />
            <TaxRow label={t("dNetTax")} value={money(Math.round(stat.tax * 0.94))} bold />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dRefundAmt")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            <TaxRow label={t("dRefundReq")} value={num(Math.round(stat.orders * 0.04))} />
            <TaxRow label={t("dApproved")} value={num(Math.round(stat.orders * 0.03))} />
            <TaxRow label={t("dRejected")} value={num(Math.round(stat.orders * 0.01))} />
            <TaxRow label={t("dRefundRate")} value={`${Math.round(((stat.refunds / Math.max(1, stat.sales)) * 100) * 10) / 10}%`} bold />
            <TaxRow label={t("dMainReason")} value="Damaged Product" />
            <TaxRow label={t("dAvgTime")} value="2.4 days" />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dValue")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            <TaxRow label={t("dProducts")} value={num(stat.products)} />
            <TaxRow label={t("dStock")} value={num(stat.products * 3)} />
            <TaxRow label={t("dLow")} value={num(Math.round(stat.products * 0.08))} />
            <TaxRow label={t("dOut")} value={num(Math.round(stat.products * 0.02))} />
            <TaxRow label={t("dValue")} value={money(stat.products * 1200)} bold />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaxRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-secondary" : "font-semibold"}>{value}</span>
    </div>
  );
}
