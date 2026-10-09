"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { CategoryBarChart } from "@/components/admin/charts/CategoryBarChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import {
  balanceHistory,
  buildVendorTransactions,
  downloadCsv,
  earningsByMonth,
  earningsSummary,
  financialActivity,
  productEarnings,
} from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts, useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard, EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

const RANGES = ["7D", "30D", "90D", "6M", "1Y"] as const;

export default function VendorEarningsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const products = useVendorProducts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [ready, setReady] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]>("30D");
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const txns = useMemo(() => buildVendorTransactions(orders, payouts), [orders, payouts]);
  const monthly = useMemo(() => earningsByMonth(orders), [orders]);
  const topProducts = useMemo(() => productEarnings(orders, products).slice(0, 5), [orders, products]);
  const balances = useMemo(() => balanceHistory(txns).slice(0, 5), [txns]);
  const activity = useMemo(() => financialActivity(orders, payouts), [orders, payouts]);

  const trend = useMemo(() => {
    const pts = monthly.map((m) => ({ x: m.period.slice(5), y: m.earnings }));
    if (range === "7D") return pts.slice(-2);
    if (range === "90D" || range === "6M" || range === "1Y") return pts;
    return pts.slice(-4);
  }, [monthly, range]);

  const exportSummary = () => {
    downloadCsv("earnings-summary.csv",
      ["metric", "amount"],
      [
        ["gross", summary.gross], ["discounts", summary.discounts], ["refunds", summary.refunds],
        ["shipping", summary.shipping], ["tax", summary.tax], ["commission", summary.commission],
        ["net", summary.net], ["available", summary.available], ["pending", summary.pending],
        ["withdrawn", summary.withdrawn],
      ]);
    toast.success(t("exported"));
    store.logOrderEvent(orders[0]?.id ?? "ORD-2041", "Report exported", "Earnings summary CSV");
  };

  const breakdown: Array<{ label: string; value: number; href: string; negative?: boolean }> = [
    { label: t("grossSales"), value: summary.gross, href: "/vendor/earnings/orders" },
    { label: t("discount"), value: -summary.discounts, href: "/vendor/earnings/orders", negative: true },
    { label: t("refunds"), value: -summary.refunds, href: "/vendor/earnings/transactions", negative: true },
    { label: t("commission"), value: -summary.commission, href: "/vendor/earnings/commission", negative: true },
    { label: t("shipping"), value: summary.shipping, href: "/vendor/earnings/orders" },
    { label: t("eTax"), value: summary.tax, href: "/vendor/earnings/reports" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eTitle")}
        subtitle={t("eSubtitle")}
        highlightLabel={t("availBalance")}
        highlightValue={money(summary.available)}
        highlightIcon={Wallet}
      >
        <span className={heroPillClassName}>
          <Calendar className="size-3.5" aria-hidden="true" />
          <Select value={range} onValueChange={(v) => setRange((v as typeof range) ?? "30D")}>
            <SelectTrigger size="sm" className="h-6 w-24 border-0 bg-transparent p-0 text-xs font-semibold text-white [&_svg]:text-white" aria-label={t("eDateRange")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
        <button type="button" onClick={exportSummary} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("eExport")}
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <EarnTabs />

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <EarnStatCard label={t("kpiEarnings")} value={money(summary.net)} sub={`${num(summary.totalOrders)} ${t("eOrders")}`} href="/vendor/earnings/orders" accent />
          <EarnStatCard label={t("availBalance")} value={money(summary.available)} sub={t("eWithdrawable")} href="/vendor/earnings/available" accent />
          <EarnStatCard label={t("pendingBalance")} value={money(summary.pending)} sub={t("eExpected")} href="/vendor/earnings/pending" />
          <EarnStatCard label={t("eCommTotal")} value={money(summary.commission)} sub={`${summary.avgRate}% ${t("eRate")}`} href="/vendor/earnings/commission" />
          <EarnStatCard label={t("eSales")} value={money(summary.gross)} href="/vendor/earnings/orders" />
          <EarnStatCard label={t("eOrders")} value={num(summary.totalOrders)} href="/vendor/earnings/orders" />
          <EarnStatCard label={t("eRefunded")} value={money(summary.refunds)} href="/vendor/earnings/transactions" />
          <EarnStatCard label={t("eWithdrawn")} value={money(summary.withdrawn)} href="/vendor/earnings/transactions" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eFinOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {breakdown.map((b) => (
              <Link key={b.label} href={b.href as "/vendor/earnings"} className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm transition-colors last:border-0 hover:bg-muted/50">
                <span className="text-muted-foreground underline-offset-2 hover:underline">{b.label}</span>
                <span className={b.negative ? "font-bold text-destructive" : "font-bold"}>
                  {b.value < 0 ? `−${money(-b.value)}` : money(b.value)}
                </span>
              </Link>
            ))}
            <Link href="/vendor/earnings/reports" className="mt-2 flex items-center justify-between bg-green-600/10 px-2 py-2.5 hover:bg-green-600/20">
              <span className="text-sm font-bold">{t("netEarnings")}</span>
              <span className="font-heading font-bold text-green-700">{money(summary.net)}</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eBalanceHist")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            <StatusPieChart
              data={[
                { id: "avail", label: t("availBalance"), value: Math.max(summary.available, 0) },
                { id: "pend", label: t("pendingBalance"), value: Math.max(summary.pending, 0) },
                { id: "with", label: t("eWithdrawn"), value: Math.max(summary.withdrawn, 0) },
              ]}
            />
            <Link href="/vendor/earnings/balance" className="text-center text-xs font-bold text-secondary hover:underline">
              {t("viewDetails")}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("earnChart")} · {range}</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? <Skeleton className="h-[300px] w-full" /> : <RevenueChart data={trend.length > 0 ? trend : [{ x: "—", y: 0 }]} />}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eMonthly")} · {t("eSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!ready ? <Skeleton className="h-[300px] w-full" /> : (
              <CategoryBarChart data={monthly.map((m) => ({ category: m.period.slice(5), sales: m.sales, orders: m.orders }))} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eOrdersEarn")}</CardTitle>
            <Link href="/vendor/earnings/orders" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead className="text-right">{t("tTotal")}</TableHead>
                  <TableHead className="text-right">{t("vendorEarning")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.filter((o) => !o.archived).slice(0, 5).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">#{o.id}</Link>
                      <p className="text-[11px] text-muted-foreground">{dateOf(o.date)}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">{money(o.total)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">+{money(o.earning)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eProductsEarn")}</CardTitle>
            <Link href="/vendor/earnings/products" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-4">
            {topProducts.length > 0 ? topProducts.map((p) => (
              <Link
                key={p.sku}
                href={p.productId ? `/vendor/products/${p.productId}` : "/vendor/earnings/products"}
                className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-secondary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{num(p.units)} {t("eUnits")} · {money(p.gross)}</span>
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-green-700">
                  {p.net >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownRight className="size-3.5" aria-hidden="true" />}
                  {money(p.net)}
                </span>
              </Link>
            )) : <EmptyState icon={Wallet} title={t("emptyTitle")} description={t("emptyProducts")} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eBalanceHist")}</CardTitle>
            <Link href="/vendor/earnings/balance" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-transparent text-muted-foreground">{t("tDate")}</TableHead>
                  <TableHead className="bg-transparent text-right text-muted-foreground">{t("eClosing")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => (
                  <TableRow key={b.date}>
                    <TableCell className="text-xs">{dateOf(b.date)}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{money(b.closing)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eActivity")}</CardTitle>
            <Link href="/vendor/earnings/transactions" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ol className="flex flex-col gap-3 border-l-2 border-secondary/30 pl-4">
              {activity.slice(0, 6).map((a, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-secondary" aria-hidden="true" />
                  <p className="font-bold">{a.event} · <span className={a.amount < 0 ? "text-destructive" : "text-green-700"}>{a.amount < 0 ? `−${money(-a.amount)}` : `+${money(a.amount)}`}</span></p>
                  <p className="text-xs text-muted-foreground">{dateOf(a.date)} · {a.ref}</p>
                </li>
              ))}
            </ol>
            <div className="flex justify-end pt-3">
              <Button size="sm" variant="outline" className="bg-card" onClick={() => toast.success(t("toastSaved"))}>
                {t("refresh")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
