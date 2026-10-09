"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Eye,
  HandCoins,
  Hourglass,
  Landmark,
  RotateCcw,
  Undo2,
  Wallet,
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
import { CommissionStatusBadge } from "@/components/admin/commission/shared";
import { TxDetailsDialog } from "@/components/admin/commission/TxDetailsDialog";
import {
  commissionRevenueRanges,
  commissionStatusSlices,
  commissionSummary,
  rateLabel,
  type CommissionTx,
} from "@/features/admin/commission";
import { useCommissionCategories, useCommissionTxs, useCommissionVendors } from "@/store/commission.store";

const RANGES = ["today", "7days", "30days", "3months", "6months", "1year"] as const;

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tile,
}: {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  tile: string;
}) {
  const positive = delta >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          <span
            className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}
          >
            {positive ? "+" : ""}
            {delta}%
          </span>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function CommissionOverviewPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const txs = useCommissionTxs();
  const vendors = useCommissionVendors();
  const categories = useCommissionCategories();
  const [range, setRange] = useState<(typeof RANGES)[number]>("30days");
  const [viewTx, setViewTx] = useState<CommissionTx | null>(null);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => commissionSummary(txs), [txs]);
  const ranges = useMemo(() => commissionRevenueRanges(), []);
  const slices = useMemo(() => commissionStatusSlices(txs), [txs]);
  const recent = useMemo(() => txs.slice(0, 6), [txs]);
  const topVendors = useMemo(() => [...vendors].sort((a, b) => b.earned - a.earned).slice(0, 5), [vendors]);
  const catRows = useMemo(
    () =>
      categories
        .filter((c) => c.status === "active")
        .slice(0, 5)
        .map((c) => {
          const catTxs = txs.filter((x) => x.category === c.category);
          const sales = catTxs.reduce((n, x) => n + x.commissionable, 0);
          const com = catTxs.reduce((n, x) => n + x.commission, 0);
          return { ...c, sales, com };
        }),
    [categories, txs]
  );

  const rangeKey = (r: (typeof RANGES)[number]) =>
    r === "today" ? "rangeToday" : r === "7days" ? "range7" : r === "30days" ? "range30" : r === "3months" ? "range3m" : r === "6months" ? "range6m" : "range1y";

  const kpis = [
    { label: t("kpiTotal"), value: money(summary.total), delta: 14.2, icon: CircleDollarSign, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiToday"), value: money(summary.today), delta: 8.1, icon: BadgeDollarSign, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiWeek"), value: money(summary.week), delta: 5.4, icon: CalendarCheck, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiMonth"), value: money(summary.month), delta: 12.7, icon: CalendarDays, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiYear"), value: money(summary.year), delta: 21.3, icon: CalendarRange, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiPending"), value: money(summary.pending), delta: -2.2, icon: Hourglass, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiApproved"), value: money(summary.approved), delta: 6.9, icon: Wallet, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiPaid"), value: money(summary.paid), delta: 11.5, icon: Landmark, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiRefunded"), value: money(summary.refunded), delta: -4.8, icon: Undo2, tile: "bg-purple-600/10 text-purple-700" },
    { label: t("kpiReversed"), value: money(summary.reversed), delta: -1.3, icon: RotateCcw, tile: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiTotal")}
        highlightValue={money(summary.total)}
        highlightIcon={HandCoins}
      >
        <Link href="/dashboard/commission/history" className={heroPillClassName}>
          {t("recentTx")}
        </Link>
        <Link href="/dashboard/commission/reports" className={heroPillClassName}>
          {t("rTitle")}
        </Link>
        <Link href="/dashboard/commission/rules" className={heroPillClassName}>
          {t("ruTitle")}
        </Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("chartRevenue")}</CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                className={range === r ? "h-7 text-xs" : "h-7 bg-card text-xs"}
                onClick={() => setRange(r)}
              >
                {t(rangeKey(r))}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart data={ranges[range]} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("chartByVendor")}</CardTitle>
          <Link href="/dashboard/commission/vendors">
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
                <TableHead>{t("tVendor")}</TableHead>
                <TableHead className="text-right">{t("tSales")}</TableHead>
                <TableHead className="text-right">{t("tCom")}</TableHead>
                <TableHead className="text-right">{t("tEarning")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <p className="text-sm font-semibold whitespace-nowrap">{v.vendor}</p>
                    <p className="text-xs text-muted-foreground">{v.store}</p>
                  </TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap">{money(v.sales)}</TableCell>
                  <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                    {money(v.earned)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
                    {money(v.sales - v.earned)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartByCategory")}</CardTitle>
            <Link href="/dashboard/commission/categories">
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
                  <TableHead>{t("tCategory")}</TableHead>
                  <TableHead className="text-right">{t("tSales")}</TableHead>
                  <TableHead>{t("tRate")}</TableHead>
                  <TableHead className="text-right">{t("tCom")}</TableHead>
                  <TableHead className="text-right">{t("tEarning")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{c.category}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(c.sales)}</TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {rateLabel(c.type, c.rate, c.fixed)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(c.com)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
                      {money(Math.max(0, c.sales - c.com))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={slices} unitLabel={t("kpiTotal")} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("recentTx")}</CardTitle>
          <Link href="/dashboard/commission/history">
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
                <TableHead>{t("tTx")}</TableHead>
                <TableHead>{t("tVendor")}</TableHead>
                <TableHead>{t("tProduct")}</TableHead>
                <TableHead className="text-right">{t("tCom")}</TableHead>
                <TableHead>{t("tStatus")}</TableHead>
                <TableHead className="w-20">{t("colAction")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>
                    <p className="font-mono text-xs font-bold whitespace-nowrap">{x.id}</p>
                    <p className="text-xs whitespace-nowrap text-muted-foreground">{x.date}</p>
                  </TableCell>
                  <TableCell className="text-sm font-semibold whitespace-nowrap">{x.vendor}</TableCell>
                  <TableCell className="max-w-44 truncate text-sm" title={x.product}>{x.product}</TableCell>
                  <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                    {money(x.commission)}
                  </TableCell>
                  <TableCell>
                    <CommissionStatusBadge status={x.status} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => setViewTx(x)} aria-label={`${t("viewDetails")} ${x.id}`} title={t("viewDetails")}>
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TxDetailsDialog tx={viewTx} onClose={() => setViewTx(null)} />
    </div>
  );
}
