"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS } from "@/features/admin/reports";
import { useCommissionTxs } from "@/store/commission.store";
import type { CommissionTx } from "@/features/admin/commission";
import { BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommissionReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const txs = useCommissionTxs();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const total = txs.reduce((n, x) => n + x.commission, 0);
  const paid = txs.filter((x) => x.status === "paid").reduce((n, x) => n + x.commission, 0);
  const pending = txs.filter((x) => x.status === "pending" || x.status === "approved").reduce((n, x) => n + x.commission, 0);
  const refunded = txs.filter((x) => x.status === "refunded" || x.status === "reversed").reduce((n, x) => n + x.commission, 0);

  const columns: Array<ReportColumn<CommissionTx>> = [
    { key: "vendor", label: t("cVendor"), sortable: true, sortValue: (r) => r.vendor, searchValue: (r) => `${r.vendor} ${r.id} ${r.orderId}`, render: (r) => <span className="text-sm font-semibold whitespace-nowrap">{r.vendor}</span> },
    { key: "order", label: t("cOrder"), render: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.orderId}</span> },
    { key: "product", label: t("cProduct"), searchValue: (r) => r.product, render: (r) => <span className="max-w-40 truncate text-sm" title={r.product}>{r.product}</span> },
    { key: "sale", label: t("cSale"), align: "right", sortable: true, sortValue: (r) => r.commissionable, render: (r) => <span className="text-sm whitespace-nowrap">{money(r.commissionable)}</span> },
    { key: "rate", label: t("cRate"), align: "right", render: (r) => <span className="text-sm font-bold">{r.rate}%</span> },
    { key: "amount", label: t("cComAmount"), align: "right", sortable: true, sortValue: (r) => r.commission, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.commission)}</span> },
    { key: "status", label: t("cStatus"), searchValue: (r) => r.status, render: (r) => <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.status === "paid" ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>{r.status}</span> },
    { key: "date", label: t("cDate"), sortable: true, sortValue: (r) => r.date, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("cmTitle")}
        subtitle={range}
        highlightLabel={t("kTotalCom")}
        highlightValue={money(total)}
        highlightIcon={BadgeDollarSign}
      >
        <ExportReportButton
          reportType="commission"
          headers={["vendor", "order", "product", "sale", "rate", "commission", "status", "date"]}
          rows={txs.map((x) => [x.vendor, x.orderId, x.product, x.commissionable, x.rate, x.commission, x.status, x.date])}
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
        <ReportKpi label={t("kTotalCom")} value={money(total)} delta={9} icon={BadgeDollarSign} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kPaidCom")} value={money(paid)} delta={11} icon={BadgeDollarSign} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kPendingCom")} value={money(pending)} icon={BadgeDollarSign} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kRefundedCom")} value={money(refunded)} delta={-5} icon={BadgeDollarSign} tile="bg-destructive/10 text-destructive" />
        <ReportKpi label={t("kAvgCom")} value={money(txs.length > 0 ? Math.round(total / txs.length) : 0)} icon={BadgeDollarSign} tile="bg-muted text-muted-foreground" />
      </div>

      <ReportTable<CommissionTx>
        rows={txs}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
