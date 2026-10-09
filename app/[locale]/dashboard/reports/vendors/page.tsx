"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { useCommissionVendors } from "@/store/commission.store";
import { Store } from "lucide-react";

interface VendorRow {
  id: string;
  vendor: string;
  orders: number;
  sales: number;
  commission: number;
  payout: number;
  refund: number;
  products: number;
}

export default function VendorReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const vendors = useCommissionVendors();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo<VendorRow[]>(() => {
    const orderCount = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) orderCount.set(item.category, (orderCount.get(item.category) ?? 0) + 1);
    }
    return vendors.map((v) => {
      const payout = Math.round(v.earned * 8.8);
      return {
        id: v.id, vendor: v.vendor,
        orders: orderCount.get(v.store) ?? v.paid % 97,
        sales: v.sales, commission: v.earned, payout,
        refund: v.refunded, products: 12 + (v.sales % 60),
      };
    });
  }, [vendors, orders]);

  const sales = rows.reduce((n, r) => n + r.sales, 0);
  const commission = rows.reduce((n, r) => n + r.commission, 0);
  const payout = rows.reduce((n, r) => n + r.payout, 0);

  const columns: Array<ReportColumn<VendorRow>> = [
    { key: "vendor", label: t("cVendor"), sortable: true, sortValue: (r) => r.vendor, searchValue: (r) => r.vendor, render: (r) => <span className="text-sm font-semibold whitespace-nowrap">{r.vendor}</span> },
    { key: "orders", label: t("cOrders"), align: "right", sortable: true, sortValue: (r) => r.orders, render: (r) => <span className="text-sm font-semibold">{num(r.orders)}</span> },
    { key: "sales", label: t("cSales"), align: "right", sortable: true, sortValue: (r) => r.sales, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.sales)}</span> },
    { key: "commission", label: t("cCommission"), align: "right", sortable: true, sortValue: (r) => r.commission, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.commission)}</span> },
    { key: "payout", label: t("cPayout"), align: "right", sortable: true, sortValue: (r) => r.payout, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-green-600">{money(r.payout)}</span> },
    { key: "refund", label: t("cRefund"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">{money(r.refund)}</span> },
    { key: "net", label: t("cNetRevenue"), align: "right", sortable: true, sortValue: (r) => r.sales - r.refund, render: (r) => <span className="text-sm font-bold whitespace-nowrap">{money(r.sales - r.refund)}</span> },
    { key: "products", label: t("cProducts"), align: "right", render: (r) => <span className="text-sm">{num(r.products)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("vTitle")}
        subtitle={range}
        highlightLabel={t("kVendorSales")}
        highlightValue={money(sales)}
        highlightIcon={Store}
      >
        <ExportReportButton
          reportType="vendors"
          headers={["vendor", "orders", "sales", "commission", "payout", "refund"]}
          rows={rows.map((r) => [r.vendor, r.orders, r.sales, r.commission, r.payout, r.refund])}
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
        <ReportKpi label={t("kTotalVendors")} value={num(rows.length)} icon={Store} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kActiveVendors")} value={num(rows.length)} delta={4} icon={Store} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kVendorSales")} value={money(sales)} delta={9} icon={Store} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kVendorCom")} value={money(commission)} delta={7} icon={Store} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kVendorPayout")} value={money(payout)} delta={6} icon={Store} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kAvgVendor")} value={money(rows.length > 0 ? Math.round(sales / rows.length) : 0)} icon={Store} tile="bg-muted text-muted-foreground" />
      </div>

      <ReportTable<VendorRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
