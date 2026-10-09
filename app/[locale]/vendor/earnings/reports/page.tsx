"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Field } from "@/components/admin/products/edit/sections";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import {
  buildVendorTransactions,
  downloadCsv,
  earningsByMonth,
  earningsSummary,
} from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

type ReportKind = "sales" | "earnings" | "commission" | "refund" | "payout" | "transaction" | "tax";

export default function VendorEarningsReportsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [kind, setKind] = useState<ReportKind>("earnings");
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const txns = useMemo(() => buildVendorTransactions(orders, payouts), [orders, payouts]);
  const monthly = useMemo(() => earningsByMonth(orders), [orders]);

  const inRange = (date: string) => {
    if (range === "custom") return (!from || date >= from) && (!to || date <= to);
    if (range === "today") return date >= "2026-09-26";
    if (range === "week") return date >= "2026-09-19";
    if (range === "month") return date.startsWith("2026-09");
    if (range === "lastMonth") return date.startsWith("2026-08");
    if (range === "year") return date.startsWith("2026");
    return true;
  };

  const preview = useMemo(() => {
    if (kind === "sales" || kind === "earnings" || kind === "commission" || kind === "refund") {
      return orders.filter((o) => !o.archived && inRange(o.date)).slice(0, 8);
    }
    if (kind === "payout") return [];
    return txns.filter((x) => inRange(x.date)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, range, from, to, orders, txns]);

  const reportTitle =
    kind === "sales" ? t("eSalesReport")
    : kind === "earnings" ? t("eEarningsReport")
    : kind === "commission" ? t("eCommReport")
    : kind === "refund" ? t("eRefundReport")
    : kind === "payout" ? t("ePayoutReport")
    : kind === "transaction" ? t("eTxnReport")
    : t("eTaxReport");

  const exportReport = () => {
    if (kind === "payout") {
      downloadCsv("payout-report.csv", ["id", "amount", "method", "date", "status"],
        payouts.filter((p) => inRange(p.date)).map((p) => [p.id, p.amount, p.method, p.date, p.status]));
    } else if (kind === "transaction" || kind === "tax") {
      downloadCsv(`${kind}-report.csv`, ["id", "date", "type", "net", "status"],
        txns.filter((x) => inRange(x.date)).map((x) => [x.id, x.date, x.type, x.net, x.status]));
    } else {
      downloadCsv(`${kind}-report.csv`, ["order", "total", "commission", "earning", "date"],
        orders.filter((o) => inRange(o.date)).map((o) => [o.id, o.total, o.commission, o.earning, o.date]));
    }
    toast.success(t("exported"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eReports")}
        subtitle={`${reportTitle} · ${t("eSubtitle")}`}
        highlightLabel={t("netEarnings")}
        highlightValue={money(summary.net)}
        highlightIcon={FileText}
      >
        <button type="button" onClick={exportReport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("eExport")}
        </button>
        <button type="button" onClick={() => window.setTimeout(() => printInvoiceDoc(reportTitle), 50)} className={heroPillClassName}>
          <Printer className="size-3.5" aria-hidden="true" />
          {t("ePrint")}
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <EarnTabs />

      <Card className="border-border bg-card">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("report")}>
            <Select value={kind} onValueChange={(v) => setKind((v as ReportKind) ?? "earnings")}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">{t("eSalesReport")}</SelectItem>
                <SelectItem value="earnings">{t("eEarningsReport")}</SelectItem>
                <SelectItem value="commission">{t("eCommReport")}</SelectItem>
                <SelectItem value="refund">{t("eRefundReport")}</SelectItem>
                <SelectItem value="payout">{t("ePayoutReport")}</SelectItem>
                <SelectItem value="transaction">{t("eTxnReport")}</SelectItem>
                <SelectItem value="tax">{t("eTaxReport")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("eDateRange")}>
            <Select value={range} onValueChange={(v) => setRange(v ?? "month")}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t("eToday")}</SelectItem>
                <SelectItem value="week">{t("eLast7")}</SelectItem>
                <SelectItem value="month">{t("eThisMonthF")}</SelectItem>
                <SelectItem value="lastMonth">{t("eLastMonth")}</SelectItem>
                <SelectItem value="year">{t("eThisYear")}</SelectItem>
                <SelectItem value="custom">{t("eCustom")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {range === "custom" ? (
            <>
              <Field label={t("eFrom")}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-card" /></Field>
              <Field label={t("eTo")}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-card" /></Field>
            </>
          ) : null}
          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={exportReport}>{t("eGenerate")}</Button>
            <Button variant="outline" className="bg-card" onClick={() => window.setTimeout(() => printInvoiceDoc(reportTitle), 50)}>{t("ePrint")}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: t("eSalesReport"), href: "", value: money(summary.gross) },
          { label: t("eEarningsReport"), href: "", value: money(summary.net) },
          { label: t("eCommReport"), href: "", value: money(summary.commission) },
          { label: t("eRefundReport"), href: "", value: money(summary.refunds) },
          { label: t("ePayoutReport"), href: "", value: money(summary.withdrawn) },
          { label: t("eTxnReport"), href: "", value: num(txns.length) },
        ].map((c) => (
          <Card key={c.label} className="border-border bg-card">
            <CardContent className="p-3">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</p>
              <p className="font-heading text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{reportTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("ePeriod")}</TableHead>
                <TableHead className="text-right">{t("eSales")}</TableHead>
                <TableHead className="text-right">{t("commission")}</TableHead>
                <TableHead className="text-right">{t("netEarnings")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthly.map((m) => (
                <TableRow key={m.period}>
                  <TableCell className="font-mono text-xs font-bold">{m.period}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{money(m.sales)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-destructive">−{money(m.commission)}</TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(m.earnings)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div id="invoice-print" className="hidden" aria-hidden="true">
        <div className="bg-white p-4 text-sm">
          <p className="text-center font-heading text-xl font-bold">Ayesha Boutique — {reportTitle}</p>
          <p className="text-center">{`Gross ${money(summary.gross)} · Commission ${money(summary.commission)} · Net ${money(summary.net)}`}</p>
          {preview.map((r, i) => (
            <div key={i} className="flex justify-between border-b py-1">
              <span>{"id" in r ? (r as { id: string }).id : ""}</span>
              <span>{"net" in r ? money((r as { net: number }).net) : money((r as { total: number }).total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
