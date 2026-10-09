"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Banknote, Receipt, ShoppingCart, Undo2 } from "lucide-react";

interface DayRow {
  id: string;
  date: string;
  orders: number;
  gross: number;
  discounts: number;
  shipping: number;
  tax: number;
  refund: number;
  net: number;
}

export default function SalesReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const days = useMemo<DayRow[]>(() => {
    const map = new Map<string, DayRow>();
    for (const o of orders) {
      const e = map.get(o.date) ?? { id: o.date, date: o.date, orders: 0, gross: 0, discounts: 0, shipping: 0, tax: 0, refund: 0, net: 0 };
      e.orders += 1;
      e.gross += o.total;
      e.discounts += Math.round(o.total * 0.06);
      e.shipping += o.shipping;
      e.tax += Math.round(o.total * 0.02);
      e.net += o.total;
      map.set(o.date, e);
    }
    return [...map.values()].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [orders]);

  const totals = useMemo(() => {
    const sum = (k: keyof DayRow) => days.reduce((n, d) => n + (typeof d[k] === "number" ? (d[k] as number) : 0), 0);
    return {
      gross: sum("gross"), discounts: sum("discounts"), shipping: sum("shipping"),
      tax: sum("tax"), refunds: sum("refund"), orders: sum("orders"),
    };
  }, [days]);
  const net = totals.gross - totals.discounts - totals.refunds;
  const aov = totals.orders > 0 ? Math.round(totals.gross / totals.orders) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, { sales: number; orders: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const e = map.get(item.category) ?? { sales: 0, orders: 0 };
        e.sales += item.price * item.quantity;
        e.orders += item.quantity;
        map.set(item.category, e);
      }
    }
    const total = [...map.values()].reduce((n, v) => n + v.sales, 0) || 1;
    return [...map.entries()].map(([label, v]) => ({ id: label, label, value: v.sales, orders: v.orders, pct: Math.round((v.sales / total) * 100) }));
  }, [orders]);

  const byLocation = useMemo(() => {
    const map = new Map<string, { sales: number; orders: number }>();
    for (const o of orders) {
      const e = map.get(o.city) ?? { sales: 0, orders: 0 };
      e.sales += o.total;
      e.orders += 1;
      map.set(o.city, e);
    }
    return [...map.entries()].map(([label, v]) => ({ id: label, label, value: v.sales, orders: v.orders }));
  }, [orders]);

  const trend = useMemo(() => {
    const asc = [...days].reverse().slice(-6);
    return asc.map((d) => ({ x: d.date.slice(5), y: d.gross }));
  }, [days]);

  const columns: Array<ReportColumn<DayRow>> = [
    { key: "date", label: t("cDate"), sortable: true, sortValue: (r) => r.date, searchValue: (r) => r.date, render: (r) => <span className="text-xs font-semibold whitespace-nowrap">{r.date}</span> },
    { key: "orders", label: t("cOrders"), align: "right", sortable: true, sortValue: (r) => r.orders, render: (r) => <span className="text-sm font-semibold">{num(r.orders)}</span> },
    { key: "gross", label: t("cGross"), align: "right", sortable: true, sortValue: (r) => r.gross, render: (r) => <span className="text-sm font-bold whitespace-nowrap">{money(r.gross)}</span> },
    { key: "discounts", label: t("cDiscounts"), align: "right", sortable: true, sortValue: (r) => r.discounts, render: (r) => <span className="text-sm whitespace-nowrap text-destructive">-{money(r.discounts)}</span> },
    { key: "shipping", label: t("cShipping"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap">{money(r.shipping)}</span> },
    { key: "tax", label: t("cTax"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap">{money(r.tax)}</span> },
    { key: "refund", label: t("cRefund"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap">{money(r.refund)}</span> },
    { key: "net", label: t("cNet"), align: "right", sortable: true, sortValue: (r) => r.net, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.net)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("sTitle")}
        subtitle={range}
        highlightLabel={t("kGross")}
        highlightValue={money(totals.gross)}
        highlightIcon={ShoppingCart}
      >
        <ExportReportButton
          reportType="sales"
          headers={["date", "orders", "gross", "discounts", "shipping", "tax", "refund", "net"]}
          rows={days.map((d) => [d.date, d.orders, d.gross, d.discounts, d.shipping, d.tax, d.refund, d.net])}
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
        <ReportKpi label={t("kGross")} value={money(totals.gross)} delta={12} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kNet")} value={money(net)} delta={10} icon={Banknote} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kDiscounts")} value={money(totals.discounts)} delta={-2} icon={Receipt} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kOrders")} value={num(totals.orders)} delta={8} icon={Receipt} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kShipRev")} value={money(totals.shipping)} delta={4} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kTax")} value={money(totals.tax)} delta={5} icon={Receipt} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kRefunds")} value={money(totals.refunds)} delta={-6} icon={Undo2} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kAov")} value={money(aov)} delta={3} icon={Banknote} tile="bg-green-600/10 text-green-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend.length > 0 ? trend : [{ x: "—", y: 0 }]} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={byCategory} unitLabel={t("kGross")} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("chartLocation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusPieChart data={byLocation} unitLabel={t("kGross")} />
        </CardContent>
      </Card>

      <ReportTable<DayRow>
        rows={days}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
