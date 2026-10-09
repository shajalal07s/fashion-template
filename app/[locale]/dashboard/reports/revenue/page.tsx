"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS, countryStats } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Banknote, Landmark, Receipt, Undo2 } from "lucide-react";

interface LocRow {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export default function RevenueReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const sales = useMemo(() => orders.reduce((n, o) => n + o.total, 0), [orders]);
  const productRev = Math.round(sales * 0.88);
  const shipRev = useMemo(() => orders.reduce((n, o) => n + o.shipping, 0), [orders]);
  const tax = Math.round(sales * 0.075);
  const refundDed = Math.round(sales * 0.03);
  const comDed = Math.round(sales * 0.1);
  const payoutDed = Math.round(sales * 0.79);
  const net = productRev + shipRev - refundDed;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) map.set(item.category, (map.get(item.category) ?? 0) + item.price * item.quantity);
    }
    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
  }, [orders]);

  const byVendor = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) map.set(item.category, (map.get(item.category) ?? 0) + item.price * item.quantity);
    }
    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
  }, [orders]);

  const geo = useMemo(() => {
    const c = countryStats();
    const rows: LocRow[] = [
      { id: "bangladesh", name: "Bangladesh", sales: c.sales, revenue: c.revenue },
      { id: "dhaka-div", name: "Dhaka Division", sales: Math.round(c.sales * 0.42), revenue: Math.round(c.revenue * 0.42) },
      { id: "ctg-div", name: "Chattogram Division", sales: Math.round(c.sales * 0.21), revenue: Math.round(c.revenue * 0.21) },
      { id: "dhaka", name: "Dhaka", sales: Math.round(c.sales * 0.24), revenue: Math.round(c.revenue * 0.24) },
    ];
    return rows;
  }, []);

  const trend = useMemo(
    () => [
      { x: "Apr", y: Math.round(productRev / 6) }, { x: "May", y: Math.round(productRev / 5) },
      { x: "Jun", y: Math.round(productRev / 5) }, { x: "Jul", y: Math.round(productRev / 4) },
      { x: "Aug", y: Math.round(productRev / 3) }, { x: "Sep", y: Math.round(productRev / 3) },
    ],
    [productRev]
  );

  const locColumns: Array<ReportColumn<LocRow>> = [
    { key: "name", label: t("cCountry"), sortable: true, sortValue: (r) => r.name, searchValue: (r) => r.name, render: (r) => <span className="text-sm font-semibold">{r.name}</span> },
    { key: "sales", label: t("cSales"), align: "right", sortable: true, sortValue: (r) => r.sales, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.sales)}</span> },
    { key: "revenue", label: t("kRevenue"), align: "right", sortable: true, sortValue: (r) => r.revenue, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.revenue)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("rTitle")}
        subtitle={range}
        highlightLabel={t("kRevenue")}
        highlightValue={money(productRev + shipRev)}
        highlightIcon={Banknote}
      >
        <ExportReportButton
          reportType="revenue"
          headers={["location", "sales", "revenue"]}
          rows={geo.map((g) => [g.name, g.sales, g.revenue])}
          filtersLabel={range}
        />
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_FILTERS.map((d) => (
          <Button key={d} variant={range === d ? "default" : "outline"} size="sm" className={range === d ? "h-8 text-xs" : "h-8 bg-card text-xs"} onClick={() => setRange(d)}>
            {d}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ReportKpi label={t("kRevenue")} value={money(productRev + shipRev)} delta={11} icon={Banknote} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kNetRevenue")} value={money(net)} delta={9} icon={Banknote} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kProductRev")} value={money(productRev)} delta={10} icon={Banknote} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kShipRev")} value={money(shipRev)} delta={4} icon={Banknote} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kTaxCollected")} value={money(tax)} delta={5} icon={Receipt} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kRefundDed")} value={money(refundDed)} delta={-3} icon={Undo2} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kComDed")} value={money(comDed)} delta={6} icon={Receipt} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kPayoutDed")} value={money(payoutDed)} delta={7} icon={Landmark} tile="bg-primary/15 text-secondary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartRevCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={byCategory} unitLabel={t("kRevenue")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartRevVendor")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={byVendor} unitLabel={t("kRevenue")} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3">
          <ReportTable<LocRow>
            rows={geo}
            columns={locColumns}
            searchPlaceholder={t("searchPlaceholder")}
            emptyTitle={t("emptyTitle")}
            emptyDescription={t("emptyDescription")}
          />
        </div>
      </div>
    </div>
  );
}
