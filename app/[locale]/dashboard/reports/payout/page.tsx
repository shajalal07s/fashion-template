"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useCommissionVendors } from "@/store/commission.store";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayoutRow {
  id: string;
  vendor: string;
  payoutId: string;
  orders: number;
  gross: number;
  commission: number;
  refund: number;
  net: number;
  method: string;
  status: "pending" | "processing" | "completed" | "failed";
  date: string;
}

const METHODS = ["Bank Transfer", "bKash", "Nagad", "Rocket"];

export default function PayoutReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const vendors = useCommissionVendors();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo<PayoutRow[]>(() => {
    const statuses: PayoutRow["status"][] = ["completed", "completed", "pending", "processing", "completed", "failed", "pending", "completed"];
    return vendors.map((v, i) => {
      const gross = v.sales;
      const commission = v.earned;
      const refund = v.refunded;
      return {
        id: v.id,
        vendor: v.vendor,
        payoutId: `PO-${2400 + i}`,
        orders: 20 + ((v.sales >> 8) % 180),
        gross,
        commission,
        refund,
        net: Math.max(0, gross - commission - refund),
        method: METHODS[i % METHODS.length],
        status: statuses[i % statuses.length],
        date: `2026-09-${String(2 + ((i * 3) % 24)).padStart(2, "0")}`,
      };
    });
  }, [vendors]);

  const sum = (k: keyof PayoutRow) => rows.reduce((n, r) => n + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);
  const byStatus = (s: PayoutRow["status"]) => rows.filter((r) => r.status === s).reduce((n, r) => n + r.net, 0);

  const columns: Array<ReportColumn<PayoutRow>> = [
    { key: "vendor", label: t("cVendor"), sortable: true, sortValue: (r) => r.vendor, searchValue: (r) => `${r.vendor} ${r.payoutId}`, render: (r) => <span className="text-sm font-semibold whitespace-nowrap">{r.vendor}</span> },
    { key: "payoutId", label: t("cPayoutId"), render: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.payoutId}</span> },
    { key: "orders", label: t("cOrders"), align: "right", sortable: true, sortValue: (r) => r.orders, render: (r) => <span className="text-sm font-semibold">{num(r.orders)}</span> },
    { key: "gross", label: t("cGross"), align: "right", sortable: true, sortValue: (r) => r.gross, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.gross)}</span> },
    { key: "commission", label: t("cCommission"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">-{money(r.commission)}</span> },
    { key: "refund", label: t("cRefund3"), align: "right", render: (r) => <span className="text-sm whitespace-nowrap text-destructive">-{money(r.refund)}</span> },
    { key: "net", label: t("cNetPayout"), align: "right", sortable: true, sortValue: (r) => r.net, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-green-600">{money(r.net)}</span> },
    { key: "method", label: t("cMethod"), searchValue: (r) => r.method, render: (r) => <span className="text-xs whitespace-nowrap">{r.method}</span> },
    { key: "status", label: t("cStatus"), searchValue: (r) => r.status, render: (r) => <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.status === "completed" ? "bg-green-600/10 text-green-700" : r.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>{r.status}</span> },
    { key: "date", label: t("cDate"), sortable: true, sortValue: (r) => r.date, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("pyTitle")}
        subtitle={range}
        highlightLabel={t("kTotalPayout")}
        highlightValue={money(sum("net"))}
        highlightIcon={Landmark}
      >
        <ExportReportButton
          reportType="payout"
          headers={["vendor", "payout", "orders", "gross", "commission", "refund", "net", "method", "status", "date"]}
          rows={rows.map((r) => [r.vendor, r.payoutId, r.orders, r.gross, r.commission, r.refund, r.net, r.method, r.status, r.date])}
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
        <ReportKpi label={t("kTotalPayout")} value={money(sum("net"))} delta={7} icon={Landmark} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kPendingPayout")} value={money(byStatus("pending"))} icon={Landmark} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kDonePayout")} value={money(byStatus("completed"))} delta={9} icon={Landmark} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kFailedPayout")} value={money(byStatus("failed"))} delta={-2} icon={Landmark} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kProcPayout")} value={money(byStatus("processing"))} icon={Landmark} tile="bg-secondary/15 text-secondary" />
      </div>

      <ReportTable<PayoutRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
