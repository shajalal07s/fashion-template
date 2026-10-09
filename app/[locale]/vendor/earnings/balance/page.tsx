"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, RefreshCw, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { balanceHistory, buildVendorTransactions, downloadCsv, earningsByMonth } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorBalanceHistoryPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const [mode, setMode] = useState<"daily" | "monthly">("daily");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const txns = useMemo(() => buildVendorTransactions(orders, payouts), [orders, payouts]);
  const daily = useMemo(() => balanceHistory(txns), [txns]);
  const monthly = useMemo(() => earningsByMonth(orders), [orders]);

  const chart = mode === "daily"
    ? daily.slice(0, 8).reverse().map((b) => ({ x: b.date.slice(5), y: b.closing }))
    : monthly.map((m) => ({ x: m.period.slice(5), y: m.earnings }));

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eBalanceHist")}
        subtitle={t("eSubtitle")}
        highlightLabel={t("eClosing")}
        highlightValue={money(daily[0]?.closing ?? 0)}
        highlightIcon={Scale}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("balance-history.csv", ["date", "opening", "credits", "debits", "payouts", "refunds", "closing"],
              daily.map((b) => [b.date, b.opening, b.credits, b.debits, b.payouts, b.refunds, b.closing]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <EarnTabs />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("eBalanceHist")}</CardTitle>
          <Select value={mode} onValueChange={(v) => setMode((v as typeof mode) ?? "daily")}>
            <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("ePeriod")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("eDaily")}</SelectItem>
              <SelectItem value="monthly">{t("eMonthly")}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chart.length > 0 ? chart : [{ x: "—", y: 0 }]} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("eBalanceHist")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("tDate")}</TableHead>
                <TableHead className="text-right">{t("eOpening")}</TableHead>
                <TableHead className="text-right">{t("eCredits")}</TableHead>
                <TableHead className="text-right">{t("eDebits")}</TableHead>
                <TableHead className="text-right">{t("ePayouts")}</TableHead>
                <TableHead className="text-right">{t("refunds")}</TableHead>
                <TableHead className="text-right">{t("eClosing")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((b) => (
                <TableRow key={b.date}>
                  <TableCell className="text-xs whitespace-nowrap">{dateOf(b.date)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{money(b.opening)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-green-700">+{money(b.credits)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-destructive">{b.debits > 0 ? `−${money(b.debits)}` : money(0)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{b.payouts > 0 ? `−${money(b.payouts)}` : money(0)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{b.refunds > 0 ? `−${money(b.refunds)}` : money(0)}</TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">{money(b.closing)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
