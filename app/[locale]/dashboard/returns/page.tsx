"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowRight,
  HandCoins,
  Hourglass,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { ReturnStatusBadge } from "@/components/admin/returns/shared";
import { useRefundRequests, useReturnRequests } from "@/store/returns.store";

function Kpi({ label, value, delta, icon: Icon, tile}: { label: string; value: string; delta?: number; icon: LucideIcon; tile: string }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          {delta !== undefined ? (
            <span className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {positive ? "+" : ""}{delta}%
            </span>
          ) : null}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function ReturnsOverviewPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const returns = useReturnRequests();
  const refunds = useRefundRequests();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const byReturn = (s: string) => returns.filter((r) => r.status === s).length;
  const totalRefund = refunds.filter((r) => r.status === "completed").reduce((n, r) => n + r.final, 0);
  const rate = returns.length > 0 ? Math.round(((byReturn("completed") + byReturn("received")) / returns.length) * 1000) / 10 : 0;

  const statusSlices = useMemo(
    () => [
      { id: "Pending", label: t("pending"), value: byReturn("pending") + byReturn("review") },
      { id: "Completed", label: t("approved"), value: byReturn("approved") + byReturn("completed") + byReturn("received") },
      { id: "Failed", label: t("rejected"), value: byReturn("rejected") },
      { id: "Shipped", label: t("awaiting"), value: byReturn("awaiting") + byReturn("transit") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [returns]
  );
  const trend = useMemo(
    () => [
      { x: "Apr", y: 12 }, { x: "May", y: 18 }, { x: "Jun", y: 15 },
      { x: "Jul", y: 22 }, { x: "Aug", y: 28 }, { x: "Sep", y: 24 },
    ],
    []
  );

  const kpis = [
    { label: t("kpiTotal"), value: num(returns.length), delta: 6, icon: Undo2, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiPending"), value: num(byReturn("pending") + byReturn("review")), delta: -4, icon: Hourglass, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiApproved"), value: num(byReturn("approved")), delta: 11, icon: Undo2, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiRejected"), value: num(byReturn("rejected")), delta: -8, icon: XCircle, tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiRefundReq"), value: num(refunds.length), delta: 7, icon: HandCoins, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiRefundPending"), value: num(refunds.filter((r) => r.status === "pending" || r.status === "review").length), icon: Hourglass, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiRefundDone"), value: num(refunds.filter((r) => r.status === "completed").length), delta: 14, icon: HandCoins, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiRefundAmt"), value: money(totalRefund), delta: 10, icon: HandCoins, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiRate"), value: `${rate}%`, delta: -1, icon: Undo2, tile: "bg-muted text-muted-foreground" },
  ];

  const recent = useMemo(() => [...returns].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6), [returns]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiRefundAmt")}
        highlightValue={money(totalRefund)}
        highlightIcon={HandCoins}
      >
        <Link href="/dashboard/returns/requests" className={heroPillClassName}>{t("qTitle")}</Link>
        <Link href="/dashboard/returns/refunds" className={heroPillClassName}>{t("fTitle")}</Link>
        <Link href="/dashboard/returns/analytics" className={heroPillClassName}>{t("anTitle")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("anTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartReturnStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusSlices} unitLabel={t("kpiTotal")} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("qTitle")}</CardTitle>
          <Link href="/dashboard/returns/requests">
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
                <TableHead>{t("tReturn")}</TableHead>
                <TableHead>{t("tCustomer")}</TableHead>
                <TableHead>{t("tProduct")}</TableHead>
                <TableHead className="text-right">{t("tAmount")}</TableHead>
                <TableHead>{t("tStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</p>
                    <p className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</p>
                  </TableCell>
                  <TableCell className="text-sm font-semibold whitespace-nowrap">{r.customer}</TableCell>
                  <TableCell className="max-w-44 truncate text-sm" title={r.product}>{r.product}</TableCell>
                  <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.amount)}</TableCell>
                  <TableCell>
                    <ReturnStatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
