"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Receipt } from "lucide-react";

interface TaxRow {
  id: string;
  order: string;
  customer: string;
  vendor: string;
  location: string;
  taxable: number;
  rate: number;
  amount: number;
  refundTax: number;
}

export default function TaxReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const rows = useMemo<TaxRow[]>(() => {
    const vendors = ["Ayesha Boutique", "Karim Wholesale", "Nusrat Fashion", "TH Lifestyle", "Dhaka Boutique"];
    return orders.slice(0, 60).map((o, i) => {
      const rate = i % 5 === 0 ? 0 : 7.5;
      const amount = Math.round(o.total * (rate / 100));
      return {
        id: o.id, order: o.id, customer: o.customerName,
        vendor: vendors[i % vendors.length], location: o.city,
        taxable: o.total, rate, amount,
        refundTax: o.status === "cancelled" ? amount : 0,
      };
    });
  }, [orders]);

  const total = rows.reduce((n, r) => n + r.amount, 0);
  const refunded = rows.reduce((n, r) => n + r.refundTax, 0);

  const columns: Array<ReportColumn<TaxRow>> = [
    { key: "order", label: t("cOrder"), sortable: true, sortValue: (r) => r.order, searchValue: (r) => `${r.order} ${r.customer}`, render: (r) => <span className="font-mono text-xs font-bold whitespace-nowrap">{r.order}</span> },
    { key: "customer", label: t("cCustomer"), sortable: true, sortValue: (r) => r.customer, searchValue: (r) => r.customer, render: (r) => <span className="max-w-32 truncate text-sm font-semibold" title={r.customer}>{r.customer}</span> },
    { key: "vendor", label: t("cVendor"), searchValue: (r) => r.vendor, render: (r) => <span className="text-xs whitespace-nowrap">{r.vendor}</span> },
    { key: "location", label: t("cLocation"), searchValue: (r) => r.location, render: (r) => <span className="text-xs whitespace-nowrap">{r.location}</span> },
    { key: "taxable", label: t("cTaxable"), align: "right", sortable: true, sortValue: (r) => r.taxable, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.taxable)}</span> },
    { key: "rate", label: t("cTaxRate"), align: "right", render: (r) => <span className="text-sm font-bold">{r.rate}%</span> },
    { key: "amount", label: t("cTaxAmount"), align: "right", sortable: true, sortValue: (r) => r.amount, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.amount)}</span> },
    { key: "refundTax", label: t("cTaxRefund"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">{money(r.refundTax)}</span> },
    { key: "net", label: t("cNetTax"), align: "right", sortable: true, sortValue: (r) => r.amount - r.refundTax, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-green-600">{money(r.amount - r.refundTax)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("tTitle")}
        subtitle={range}
        highlightLabel={t("kTotalTax")}
        highlightValue={money(total)}
        highlightIcon={Receipt}
      >
        <ExportReportButton
          reportType="tax"
          headers={["order", "customer", "vendor", "location", "taxable", "rate", "tax", "refund_tax", "net"]}
          rows={rows.map((r) => [r.order, r.customer, r.vendor, r.location, r.taxable, r.rate, r.amount, r.refundTax, r.amount - r.refundTax])}
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ReportKpi label={t("kTotalTax")} value={money(total)} delta={5} icon={Receipt} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kProductTax")} value={money(Math.round(total * 0.85))} icon={Receipt} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kShipTax")} value={money(Math.round(total * 0.15))} icon={Receipt} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kRefundedTax")} value={money(refunded)} delta={-4} icon={Receipt} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kNetTax")} value={money(total - refunded)} delta={6} icon={Receipt} tile="bg-green-600/10 text-green-700" />
      </div>

      <ReportTable<TaxRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
