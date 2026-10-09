"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Boxes } from "lucide-react";

interface ProductRow {
  id: string;
  product: string;
  sku: string;
  vendor: string;
  category: string;
  orders: number;
  qty: number;
  revenue: number;
  refund: number;
}

export default function ProductReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo<ProductRow[]>(() => {
    const map = new Map<string, ProductRow>();
    for (const o of orders) {
      for (const item of o.items) {
        const e = map.get(item.name) ?? {
          id: item.name, product: item.name, sku: item.name.slice(0, 8).toUpperCase(),
          vendor: item.category, category: item.category, orders: 0, qty: 0, revenue: 0, refund: 0,
        };
        e.orders += 1;
        e.qty += item.quantity;
        e.revenue += item.price * item.quantity;
        e.refund += o.status === "cancelled" ? item.price * item.quantity : 0;
        map.set(item.name, e);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const sold = rows.reduce((n, r) => n + r.qty, 0);
  const sales = rows.reduce((n, r) => n + r.revenue, 0);

  const columns: Array<ReportColumn<ProductRow>> = [
    { key: "product", label: t("cProduct"), sortable: true, sortValue: (r) => r.product, searchValue: (r) => `${r.product} ${r.sku} ${r.vendor}`, render: (r) => <span className="max-w-44 truncate text-sm font-semibold" title={r.product}>{r.product}</span> },
    { key: "sku", label: t("cSku"), render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.sku}</span> },
    { key: "vendor", label: t("cVendor"), sortable: true, sortValue: (r) => r.vendor, searchValue: (r) => r.vendor, render: (r) => <span className="text-xs whitespace-nowrap">{r.vendor}</span> },
    { key: "category", label: t("cCategory"), searchValue: (r) => r.category, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.category}</span> },
    { key: "orders", label: t("cOrders"), align: "right", sortable: true, sortValue: (r) => r.orders, render: (r) => <span className="text-sm font-semibold">{num(r.orders)}</span> },
    { key: "qty", label: t("cQty"), align: "right", sortable: true, sortValue: (r) => r.qty, render: (r) => <span className="text-sm">{num(r.qty)}</span> },
    { key: "revenue", label: t("cRevenue"), align: "right", sortable: true, sortValue: (r) => r.revenue, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.revenue)}</span> },
    { key: "refund", label: t("cRefund2"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">{money(r.refund)}</span> },
    { key: "net", label: t("cNet"), align: "right", sortable: true, sortValue: (r) => r.revenue - r.refund, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-green-600">{money(r.revenue - r.refund)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("pTitle")}
        subtitle={range}
        highlightLabel={t("kProductSales")}
        highlightValue={money(sales)}
        highlightIcon={Boxes}
      >
        <ExportReportButton
          reportType="products"
          headers={["product", "sku", "vendor", "orders", "qty", "revenue", "refund"]}
          rows={rows.map((r) => [r.product, r.sku, r.vendor, r.orders, r.qty, r.revenue, r.refund])}
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ReportKpi label={t("kSold")} value={num(sold)} delta={8} icon={Boxes} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kProductSales")} value={money(sales)} delta={10} icon={Boxes} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kAvgRev")} value={money(rows.length > 0 ? Math.round(sales / rows.length) : 0)} icon={Boxes} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kTop")} value={num(rows.slice(0, 5).reduce((n, r) => n + r.qty, 0))} icon={Boxes} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kLow")} value={num(rows.slice(-5).reduce((n, r) => n + r.qty, 0))} icon={Boxes} tile="bg-muted text-muted-foreground" />
        <ReportKpi label={t("kReturnedProducts")} value={money(rows.reduce((n, r) => n + r.refund, 0))} delta={-4} icon={Boxes} tile="bg-destructive/10 text-destructive" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("chartCategory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusPieChart
            data={[...rows.reduce((m, r) => m.set(r.category, (m.get(r.category) ?? 0) + r.revenue), new Map<string, number>()).entries()].map(([label, value]) => ({ id: label, label, value }))}
            unitLabel={t("kProductSales")}
          />
        </CardContent>
      </Card>

      <ReportTable<ProductRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
