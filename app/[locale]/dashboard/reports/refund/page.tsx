"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useRefundRequests } from "@/store/returns.store";
import type { RefundRequest } from "@/features/admin/returns";
import { HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RefundReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const refunds = useRefundRequests();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const amount = refunds.reduce((n, r) => n + r.final, 0);
  const byStatus = (s: string) => refunds.filter((r) => r.status === s);

  const columns: Array<ReportColumn<RefundRequest>> = [
    { key: "id", label: t("cRefundId"), sortable: true, sortValue: (r) => r.id, searchValue: (r) => `${r.id} ${r.orderId} ${r.customer}`, render: (r) => <span className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</span> },
    { key: "order", label: t("cOrder"), render: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.orderId}</span> },
    { key: "customer", label: t("cCustomer"), sortable: true, sortValue: (r) => r.customer, searchValue: (r) => r.customer, render: (r) => <span className="max-w-32 truncate text-sm font-semibold" title={r.customer}>{r.customer}</span> },
    { key: "vendor", label: t("cVendor"), searchValue: (r) => r.vendor, render: (r) => <span className="text-xs whitespace-nowrap">{r.vendor}</span> },
    { key: "product", label: t("cProduct"), searchValue: (r) => r.returnId, render: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.returnId}</span> },
    { key: "original", label: t("cOriginal"), align: "right", sortable: true, sortValue: (r) => r.requested, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.requested)}</span> },
    { key: "amount", label: t("cRefundAmt"), align: "right", sortable: true, sortValue: (r) => r.final, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.final)}</span> },
    { key: "reason", label: t("cReason"), render: (r) => <span className="max-w-36 truncate text-xs text-muted-foreground" title={r.note || r.method}>{r.note || r.method}</span> },
    { key: "method", label: t("cMethod"), searchValue: (r) => r.method, render: (r) => <span className="text-xs whitespace-nowrap">{r.method}</span> },
    { key: "status", label: t("cStatus"), searchValue: (r) => r.status, render: (r) => <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.status === "completed" ? "bg-green-600/10 text-green-700" : r.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>{r.status}</span> },
    { key: "date", label: t("cDate"), sortable: true, sortValue: (r) => r.date, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</span> },
  ];

  const rate = useMemo(() => {
    const done = byStatus("completed").length;
    return refunds.length > 0 ? Math.round((done / refunds.length) * 1000) / 10 : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refunds]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("fTitle")}
        subtitle={range}
        highlightLabel={t("kRefundAmount")}
        highlightValue={money(amount)}
        highlightIcon={HandCoins}
      >
        <ExportReportButton
          reportType="refund"
          headers={["refund", "order", "customer", "vendor", "original", "amount", "method", "status", "date"]}
          rows={refunds.map((r) => [r.id, r.orderId, r.customer, r.vendor, r.requested, r.final, r.method, r.status, r.date])}
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
        <ReportKpi label={t("kTotalRefunds")} value={num(refunds.length)} icon={HandCoins} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kRefundAmount")} value={money(amount)} delta={-3} icon={HandCoins} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kPendingRefunds")} value={num(byStatus("pending").length + byStatus("review").length)} icon={HandCoins} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kDoneRefunds")} value={num(byStatus("completed").length)} delta={8} icon={HandCoins} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kFailedRefunds")} value={num(byStatus("failed").length)} delta={-1} icon={HandCoins} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kRefundRate")} value={`${rate}%`} icon={HandCoins} tile="bg-muted text-muted-foreground" />
      </div>

      <ReportTable<RefundRequest>
        rows={refunds}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
