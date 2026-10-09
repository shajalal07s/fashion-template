"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import { Users } from "lucide-react";

interface CustomerRow {
  id: string;
  customer: string;
  orders: number;
  spent: number;
  refund: number;
  last: string;
  location: string;
}

export default function CustomerReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo<CustomerRow[]>(() => {
    const cityByEmail = new Map<string, string>();
    for (const o of orders) {
      if (!cityByEmail.has(o.customerEmail)) cityByEmail.set(o.customerEmail, o.city);
    }
    return buildCustomers(orders).map((c) => ({
      id: c.email,
      customer: c.name,
      orders: c.orders,
      spent: c.spent,
      refund: c.orders > 3 ? Math.round(c.spent * 0.03) : 0,
      last: c.lastOrder,
      location: cityByEmail.get(c.email) ?? "—",
    }));
  }, [orders]);

  const spent = rows.reduce((n, r) => n + r.spent, 0);

  const columns: Array<ReportColumn<CustomerRow>> = [
    { key: "customer", label: t("cCustomer"), sortable: true, sortValue: (r) => r.customer, searchValue: (r) => `${r.customer} ${r.location}`, render: (r) => <span className="max-w-40 truncate text-sm font-semibold" title={r.customer}>{r.customer}</span> },
    { key: "orders", label: t("cOrders"), align: "right", sortable: true, sortValue: (r) => r.orders, render: (r) => <span className="text-sm font-semibold">{num(r.orders)}</span> },
    { key: "spent", label: t("cSpent"), align: "right", sortable: true, sortValue: (r) => r.spent, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.spent)}</span> },
    { key: "refund", label: t("cRefund"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">{money(r.refund)}</span> },
    { key: "net", label: t("cNetSpent"), align: "right", sortable: true, sortValue: (r) => r.spent - r.refund, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-green-600">{money(r.spent - r.refund)}</span> },
    { key: "last", label: t("cLastOrder"), sortable: true, sortValue: (r) => r.last, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.last}</span> },
    { key: "location", label: t("cLocation"), searchValue: (r) => r.location, render: (r) => <span className="text-xs whitespace-nowrap">{r.location}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("cuTitle")}
        subtitle={range}
        highlightLabel={t("kLifetime")}
        highlightValue={money(spent)}
        highlightIcon={Users}
      >
        <ExportReportButton
          reportType="customers"
          headers={["customer", "orders", "spent", "refund", "last", "location"]}
          rows={rows.map((r) => [r.customer, r.orders, r.spent, r.refund, r.last, r.location])}
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
        <ReportKpi label={t("kTotalCustomers")} value={num(rows.length)} delta={14} icon={Users} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kNew")} value={num(rows.filter((r) => r.orders <= 1).length)} delta={18} icon={Users} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kReturning")} value={num(rows.filter((r) => r.orders > 1).length)} delta={6} icon={Users} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kActiveCustomers")} value={num(rows.length)} delta={5} icon={Users} tile="bg-primary/15 text-secondary" />
        <ReportKpi label={t("kAov")} value={money(rows.length > 0 ? Math.round(spent / Math.max(1, rows.reduce((n, r) => n + r.orders, 0))) : 0)} icon={Users} tile="bg-muted text-muted-foreground" />
        <ReportKpi label={t("kLifetime")} value={money(spent)} delta={12} icon={Users} tile="bg-green-600/10 text-green-700" />
      </div>

      <ReportTable<CustomerRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
