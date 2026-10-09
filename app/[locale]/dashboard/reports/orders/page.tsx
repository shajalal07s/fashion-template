"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import type { AdminOrder } from "@/features/admin/analytics";
import { Receipt } from "lucide-react";

export default function OrderReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const by = (s: string) => orders.filter((o) => o.status === s).length;

  const columns: Array<ReportColumn<AdminOrder>> = [
    { key: "id", label: t("cOrder"), sortable: true, sortValue: (r) => r.id, searchValue: (r) => `${r.id} ${r.customerName}`, render: (r) => <span className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</span> },
    { key: "date", label: t("cDate"), sortable: true, sortValue: (r) => r.date, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</span> },
    { key: "customer", label: t("cCustomer"), sortable: true, sortValue: (r) => r.customerName, searchValue: (r) => r.customerName, render: (r) => <span className="max-w-32 truncate text-sm font-semibold" title={r.customerName}>{r.customerName}</span> },
    { key: "products", label: t("cProducts"), align: "center", render: (r) => <span className="text-sm font-semibold">{r.items.reduce((n, i) => n + i.quantity, 0)}</span> },
    { key: "amount", label: t("cAmount"), align: "right", sortable: true, sortValue: (r) => r.total, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.total)}</span> },
    { key: "payment", label: t("cPayment"), render: (r) => <span className="text-xs whitespace-nowrap uppercase">{r.payment}</span> },
    { key: "shipping", label: t("cShipping"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap">{money(r.shipping)}</span> },
    { key: "location", label: t("cLocation"), searchValue: (r) => r.city, render: (r) => <span className="text-xs whitespace-nowrap">{r.city}</span> },
    { key: "status", label: t("cStatus"), searchValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
  ];

  const kpis = useMemo(() => {
    const defs: Array<[string, number]> = [
      [t("kTotalOrders"), orders.length],
      [t("kCompleted"), by("delivered")],
      [t("kPending"), by("pending")],
      [t("kProcessing"), by("processing")],
      [t("kShipped"), by("shipped")],
      [t("kDelivered"), by("delivered")],
      [t("kCancelled"), by("cancelled")],
      [t("kReturned"), 0],
    ];
    return defs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("oTitle")}
        subtitle={range}
        highlightLabel={t("kTotalOrders")}
        highlightValue={num(orders.length)}
        highlightIcon={Receipt}
      >
        <ExportReportButton
          reportType="orders"
          headers={["order", "date", "customer", "amount", "payment", "city", "status"]}
          rows={orders.map((o) => [o.id, o.date, o.customerName, o.total, o.payment, o.city, o.status])}
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
        {kpis.map(([label, value]) => (
          <ReportKpi key={label} label={label} value={num(value)} icon={Receipt} tile="bg-secondary/15 text-secondary" />
        ))}
      </div>

      <ReportTable<AdminOrder>
        rows={orders}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
