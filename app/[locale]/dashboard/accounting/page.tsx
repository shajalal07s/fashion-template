"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  FileText,
  Landmark,
  NotebookPen,
  Percent,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
  WalletCards,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashflowChart } from "@/components/admin/charts/CashflowChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import {
  accountingSummary,
  expenseByCategory,
  journalTotals,
  monthlyCashflow,
} from "@/features/admin/accounting";
import { useAccounts, useExpenses, useJournalEntries } from "@/store/accounting.store";

export default function AccountingOverviewPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const accounts = useAccounts();
  const expenses = useExpenses();
  const journal = useJournalEntries();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => accountingSummary(accounts, expenses), [accounts, expenses]);
  const cashflow = useMemo(() => monthlyCashflow(), []);
  const expenseSlices = useMemo(() => expenseByCategory(expenses), [expenses]);
  const recent = useMemo(() => journal.slice(0, 5), [journal]);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  const kpis = [
    { label: t("kpiIncome"), value: money(summary.income), delta: 12.4, icon: TrendingUp, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiExpenses"), value: money(summary.expenses), delta: -3.1, icon: TrendingDown, tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiProfit"), value: money(summary.profit), delta: 18.2, icon: Wallet, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiCash"), value: money(summary.cash), delta: 6.8, icon: Banknote, tile: "bg-primary/15 text-secondary" },
  ];

  const quickLinks = [
    { href: "/dashboard/accounting/accounts", label: ts("accAccounts"), icon: WalletCards },
    { href: "/dashboard/accounting/journal", label: ts("accJournal"), icon: NotebookPen },
    { href: "/dashboard/accounting/expenses", label: ts("accExpenses"), icon: ReceiptText },
    { href: "/dashboard/accounting/invoices", label: ts("accInvoices"), icon: FileText },
    { href: "/dashboard/accounting/bank-cash", label: ts("accBank"), icon: Landmark },
    { href: "/dashboard/accounting/tax-settings", label: ts("accTax"), icon: Percent },
    { href: "/dashboard/accounting/reports", label: ts("accReports"), icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-6 pt-3 md:pt-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiProfit")}
        highlightValue={money(summary.profit)}
        highlightIcon={Wallet}
      >
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href}>
            <span className={heroPillClassName}>
              <q.icon className="size-3.5" aria-hidden="true" />
              {q.label}
            </span>
          </Link>
        ))}
      </AccountingHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const positive = k.delta >= 0;
          return (
            <Card key={k.label} className="overflow-hidden border-border bg-card py-0">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {k.label}
                  </p>
                  <p className="font-heading truncate text-2xl font-bold text-foreground">
                    {k.value}
                  </p>
                  <span
                    className={`flex w-fit items-center gap-1 px-2 py-0.5 text-xs font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}
                  >
                    {positive ? (
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="size-3.5" aria-hidden="true" />
                    )}
                    {positive ? "+" : ""}
                    {k.delta}%
                  </span>
                </div>
                <span className={`flex size-11 shrink-0 items-center justify-center ${k.tile}`}>
                  <k.icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border bg-card xl:col-span-3">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartCashflow")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("chartCashflowSub")}</p>
          </CardHeader>
          <CardContent>
            <CashflowChart
              data={cashflow}
              incomeLabel={t("income")}
              expenseLabel={t("expense")}
            />
          </CardContent>
        </Card>
        <Card className="border-border bg-card xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartExpenseByCat")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={expenseSlices} unitLabel={t("kpiExpenses")} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("recentJournal")}</CardTitle>
          <Link href="/dashboard/accounting/journal">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
              {t("viewAll")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("tableDate")}</TableHead>
                <TableHead>{t("tableRef")}</TableHead>
                <TableHead>{t("tableDescription")}</TableHead>
                <TableHead className="text-right">{t("tableDebit")}</TableHead>
                <TableHead className="text-right">{t("tableCredit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((entry) => {
                const { debit, credit } = journalTotals(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {entry.date}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">{entry.ref}</TableCell>
                    <TableCell className="max-w-64 truncate text-sm" title={`${entry.description} — ${entry.lines.map((l) => accountName(l.accountId)).join(", ")}`}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap">
                      {money(debit)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap">
                      {money(credit)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
