"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Boxes,
  HandCoins,
  Landmark,
  Receipt,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { ReportKpi } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { useCommissionTxs } from "@/store/commission.store";
import { useRefundRequests } from "@/store/returns.store";

const BASE_TREND = [
  { x: "Apr", y: 2450000 }, { x: "May", y: 3120000 }, { x: "Jun", y: 2980000 },
  { x: "Jul", y: 3620000 }, { x: "Aug", y: 4280000 }, { x: "Sep", y: 3880000 },
];

export default function ReportsOverviewPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const txs = useCommissionTxs();
  const refunds = useRefundRequests();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const sales = useMemo(() => orders.reduce((n, o) => n + o.total, 0), [orders]);
  const revenue = Math.round(sales * 0.9);
  const itemsSold = useMemo(() => orders.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0), [orders]);
  const customers = useMemo(() => new Set(orders.map((o) => o.customerEmail)).size, [orders]);
  const commission = useMemo(() => txs.reduce((n, x) => n + x.commission, 0), [txs]);
  const payout = Math.round(commission * 8.8);
  const tax = Math.round(sales * 0.075);
  const refundAmt = useMemo(() => refunds.filter((r) => r.status === "completed").reduce((n, r) => n + r.final, 0), [refunds]);

  const trend = useMemo(() => {
    if (range === "Today") return BASE_TREND.slice(-1).map((p, i) => ({ x: `${i + 1}PM`, y: Math.round(p.y / 30) }));
    if (range === "Last 7 Days" || range === "Yesterday") return BASE_TREND.slice(-1).map((p) => ({ x: "W1", y: Math.round(p.y / 4) }));
    if (range === "Last 90 Days" || range === "This Year") return BASE_TREND;
    if (range === "This Month" || range === "Last Month") return BASE_TREND.slice(-2);
    return BASE_TREND.slice(-2);
  }, [range]);

  const orderSlices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
    return [...counts.entries()].map(([s, value]) => ({ id: cap(s), label: s, value }));
  }, [orders]);

  const kpis: Array<{ label: string; value: string; delta: number; icon: LucideIcon; tile: string }> = [
    { label: t("kpiSales"), value: money(sales), delta: 12, icon: ShoppingCart, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiRevenue"), value: money(revenue), delta: 10, icon: Banknote, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiOrders"), value: num(orders.length), delta: 8, icon: Receipt, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiProducts"), value: num(itemsSold), delta: 6, icon: Boxes, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiVendors"), value: num(24), delta: 4, icon: Store, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiCustomers"), value: num(customers), delta: 14, icon: Users, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiCommission"), value: money(commission), delta: 9, icon: BadgeDollarSign, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiPayout"), value: money(payout), delta: 7, icon: Landmark, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiTax"), value: money(tax), delta: 5, icon: Receipt, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiRefund"), value: money(refundAmt), delta: -3, icon: HandCoins, tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiInventory"), value: money(Math.round(sales * 1.4)), delta: 2, icon: Wallet, tile: "bg-muted text-muted-foreground" },
  ];

  const links: Array<[string, string]> = [
    ["/dashboard/reports/sales", ts("repSales")],
    ["/dashboard/reports/revenue", ts("repRevenue")],
    ["/dashboard/reports/orders", ts("repOrders")],
    ["/dashboard/reports/geography", ts("repGeo")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiRevenue")}
        highlightValue={money(revenue)}
        highlightIcon={Banknote}
      >
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={heroPillClassName}>{label}</Link>
        ))}
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_FILTERS.map((d) => (
          <Button
            key={d}
            variant={range === d ? "default" : "outline"}
            size="sm"
            className={range === d ? "h-8 text-xs" : "h-8 bg-card text-xs"}
            onClick={() => setRange(d)}
          >
            {d}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <ReportKpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartTrend")} · {range}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("oTitle")}</CardTitle>
            <Link href="/dashboard/reports/orders">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={orderSlices} unitLabel={t("kpiOrders")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
