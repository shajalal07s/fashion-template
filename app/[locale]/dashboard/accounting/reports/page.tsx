"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  HandCoins,
  Landmark,
  Printer,
  ReceiptText,
  Scale,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { cn } from "@/lib/utils";
import { accountingSummary } from "@/features/admin/accounting";
import { useAccounts, useAccInvoices, useExpenses } from "@/store/accounting.store";

function Kpi({
  label,
  value,
  icon: Icon,
  tile,
  hint,
  up,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tile: string;
  hint: string;
  up?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("flex size-10 shrink-0 items-center justify-center", tile)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          <span className="font-heading truncate text-lg font-bold text-foreground">{value}</span>
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-bold",
              up === undefined ? "text-muted-foreground" : up ? "text-green-600" : "text-destructive"
            )}
          >
            {up === undefined ? null : up ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {hint}
          </span>
        </span>
      </CardContent>
    </Card>
  );
}

function ReportRow({
  icon: Icon,
  label,
  value,
  tile,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tile: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center", tile)}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold whitespace-nowrap text-foreground">{value}</span>
    </div>
  );
}

function ReportTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="font-heading text-base font-bold text-secondary">{value}</span>
    </div>
  );
}

export default function AccountingReportsPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const accounts = useAccounts();
  const expenses = useExpenses();
  const invoices = useAccInvoices();
  const [period, setPeriod] = useState("30");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => accountingSummary(accounts, expenses), [accounts, expenses]);
  const assets = useMemo(
    () => accounts.filter((a) => a.type === "asset").reduce((n, a) => n + a.balance, 0),
    [accounts]
  );
  const equity = Math.max(0, assets - summary.payable);
  const vatCollected = useMemo(() => invoices.reduce((n, i) => n + i.tax, 0), [invoices]);
  const vatPayable = accounts.find((a) => a.code === "2100")?.balance ?? 0;
  const periodLabel = period === "30" ? t("last30") : period === "90" ? t("last90") : t("thisYear");

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("reportsTitle")}
        subtitle={t("reportsSubtitle")}
        highlightLabel={t("plNet")}
        highlightValue={money(summary.profit)}
        highlightIcon={TrendingUp}
      >
        <Select value={period} onValueChange={(v) => setPeriod(v ?? "30")}>
          <SelectTrigger
            size="sm"
            className="h-8 w-36 border-white/25 bg-white/10 text-xs font-semibold text-white backdrop-blur [&_svg]:text-white/70"
            aria-label={t("reportPeriod")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">{t("last30")}</SelectItem>
            <SelectItem value="90">{t("last90")}</SelectItem>
            <SelectItem value="365">{t("thisYear")}</SelectItem>
          </SelectContent>
        </Select>
        <button type="button" onClick={() => printInvoiceDoc()} className={heroPillClassName}>
          <Printer className="size-3.5" aria-hidden="true" />
          {t("printReport")}
        </button>
      </AccountingHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={t("plRevenue")}
          value={money(summary.income)}
          icon={ArrowUpRight}
          tile="bg-green-600/10 text-green-700"
         
          hint={periodLabel}
          up
        />
        <Kpi
          label={t("plCogs")}
          value={money(summary.expenses)}
          icon={ReceiptText}
          tile="bg-destructive/10 text-destructive"
         
          hint={periodLabel}
          up={false}
        />
        <Kpi
          label={t("taxCollected")}
          value={money(vatCollected)}
          icon={HandCoins}
          tile="bg-secondary/15 text-secondary"
         
          hint={periodLabel}
        />
        <Kpi
          label={t("kpiReceivable")}
          value={money(summary.receivable)}
          icon={Wallet}
          tile="bg-primary/15 text-secondary"
         
          hint={periodLabel}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <span className="flex size-8 items-center justify-center bg-green-600/10 text-green-700">
                <Wallet className="size-4" aria-hidden="true" />
              </span>
              {t("plTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pt-0 pb-0">
            <ReportRow icon={ArrowUpRight} label={t("plRevenue")} value={money(summary.income)} tile="bg-green-600/10 text-green-700" />
            <ReportRow icon={ArrowDownRight} label={t("plCogs")} value={money(summary.expenses)} tile="bg-destructive/10 text-destructive" />
            <ReportRow icon={TrendingUp} label={t("plGross")} value={money(summary.income - summary.expenses)} tile="bg-secondary/15 text-secondary" />
          </CardContent>
          <div className="px-0 pt-2 pb-0">
            <ReportTotal label={t("plNet")} value={money(summary.profit)} />
          </div>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <span className="flex size-8 items-center justify-center bg-secondary/15 text-secondary">
                <Scale className="size-4" aria-hidden="true" />
              </span>
              {t("bsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pt-0 pb-0">
            <ReportRow icon={Landmark} label={t("bsAssets")} value={money(assets)} tile="bg-primary/15 text-secondary" />
            <ReportRow icon={ArrowDownRight} label={t("bsLiabilities")} value={money(summary.payable)} tile="bg-destructive/10 text-destructive" />
            <ReportRow icon={Scale} label={t("bsEquity")} value={money(equity)} tile="bg-secondary/15 text-secondary" />
          </CardContent>
          <div className="px-0 pt-2 pb-0">
            <ReportTotal label={`${t("bsAssets")} - ${t("bsLiabilities")}`} value={money(equity)} />
          </div>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-1">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <span className="flex size-8 items-center justify-center bg-primary/15 text-secondary">
                <FileText className="size-4" aria-hidden="true" />
              </span>
              {t("taxReportTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pt-0 pb-0">
            <ReportRow icon={HandCoins} label={t("taxCollected")} value={money(vatCollected)} tile="bg-secondary/15 text-secondary" />
            <ReportRow icon={ReceiptText} label={t("taxPayable")} value={money(vatPayable)} tile="bg-primary/20 text-[#8a5a00]" />
            <ReportRow icon={Wallet} label={t("kpiReceivable")} value={money(summary.receivable)} tile="bg-green-600/10 text-green-700" />
          </CardContent>
          <div className="px-0 pt-2 pb-0">
            <ReportTotal label={t("taxPayable")} value={money(vatPayable)} />
          </div>
        </Card>
      </div>

      <div id="invoice-print" className="hidden">
        <div className="flex flex-col gap-2 bg-white p-2 text-sm">
          <p className="text-center font-heading text-xl font-bold text-foreground">Fashion Store — {t("reportsTitle")}</p>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span>{t("plRevenue")}</span>
            <span className="font-semibold">{money(summary.income)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("plCogs")}</span>
            <span>{money(summary.expenses)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
            <span>{t("plNet")}</span>
            <span>{money(summary.profit)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("bsAssets")}</span>
            <span>{money(assets)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("bsLiabilities")}</span>
            <span>{money(summary.payable)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("taxCollected")}</span>
            <span>{money(vatCollected)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
