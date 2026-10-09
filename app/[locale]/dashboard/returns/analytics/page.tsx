"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useRefundRequests, useReturnReasons, useReturnRequests } from "@/store/returns.store";
import { toast } from "sonner";

const DATE_FILTERS = ["Today", "Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"] as const;

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="p-4">
        <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ReturnsAnalyticsPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const returns = useReturnRequests();
  const refunds = useRefundRequests();
  const reasons = useReturnReasons();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [tab, setTab] = useState("returns");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const byReturn = (s: string) => returns.filter((r) => r.status === s).length;
  const approvedCount = byReturn("approved") + byReturn("completed") + byReturn("received");
  const totalRefund = refunds.filter((r) => r.status === "completed").reduce((n, r) => n + r.final, 0);

  const returnSlices = useMemo(
    () => [
      { id: "Completed", label: t("approved"), value: approvedCount },
      { id: "Pending", label: t("pending"), value: byReturn("pending") + byReturn("review") },
      { id: "Failed", label: t("rejected"), value: byReturn("rejected") },
      { id: "Shipped", label: t("awaiting"), value: byReturn("awaiting") + byReturn("transit") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [returns]
  );
  const methodSlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of refunds) map.set(r.method, (map.get(r.method) ?? 0) + r.final);
    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
  }, [refunds]);

  const trend = useMemo(
    () => [
      { x: "Apr", y: 12400 }, { x: "May", y: 18200 }, { x: "Jun", y: 15300 },
      { x: "Jul", y: 22100 }, { x: "Aug", y: 28600 }, { x: "Sep", y: 24400 },
    ],
    []
  );

  const productRows = useMemo(() => {
    const map = new Map<string, { vendor: string; orders: number; returns: number; amount: number; reasons: Map<string, number> }>();
    for (const r of returns) {
      const e = map.get(r.product) ?? { vendor: r.vendor, orders: r.qty * 8, returns: 0, amount: 0, reasons: new Map() };
      e.returns += 1;
      e.amount += r.amount;
      e.reasons.set(r.reason, (e.reasons.get(r.reason) ?? 0) + 1);
      map.set(r.product, e);
    }
    return [...map.entries()].map(([product, v]) => ({
      product,
      vendor: v.vendor,
      orders: v.orders,
      returns: v.returns,
      rate: v.orders > 0 ? Math.round((v.returns / v.orders) * 1000) / 10 : 0,
      amount: v.amount,
      main: [...v.reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      trendUp: v.returns % 2 === 0,
    }));
  }, [returns]);

  const vendorRows = useMemo(() => {
    const map = new Map<string, { orders: number; returns: number; approved: number; rejected: number; amount: number }>();
    for (const r of returns) {
      const e = map.get(r.vendor) ?? { orders: 0, returns: 0, approved: 0, rejected: 0, amount: 0 };
      e.orders += r.qty * 8;
      e.returns += 1;
      if (r.status === "approved" || r.status === "completed") e.approved += 1;
      if (r.status === "rejected") e.rejected += 1;
      e.amount += r.amount;
      map.set(r.vendor, e);
    }
    return [...map.entries()].map(([vendor, v]) => ({
      vendor,
      ...v,
      rate: v.orders > 0 ? Math.round((v.returns / v.orders) * 1000) / 10 : 0,
    }));
  }, [returns]);

  const exportLater = () => toast(t("exported"));

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("anTitle")}
        subtitle={t("anSubtitle")}
        highlightLabel={t("finNet")}
        highlightValue={money(totalRefund)}
        highlightIcon={BarChart3}
      >
        <button type="button" onClick={exportLater} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}
        </button>
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_FILTERS.map((d) => (
          <Button
            key={d}
            variant={dateFilter === d ? "default" : "outline"}
            size="sm"
            className={dateFilter === d ? "h-8 text-xs" : "h-8 bg-card text-xs"}
            onClick={() => setDateFilter(d)}
          >
            {d}
          </Button>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="returns">{t("tabReturns")}</TabsTrigger>
          <TabsTrigger value="refunds">{t("tabRefunds")}</TabsTrigger>
          <TabsTrigger value="products">{t("tabProducts")}</TabsTrigger>
          <TabsTrigger value="vendors">{t("tabVendors")}</TabsTrigger>
          <TabsTrigger value="reasons">{t("tabReasons")}</TabsTrigger>
          <TabsTrigger value="financial">{t("tabFinancial")}</TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="flex flex-col gap-6 pt-2">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Mini label={t("aTotal")} value={num(returns.length)} />
            <Mini label={t("aRate")} value={`${returns.length > 0 ? Math.round((approvedCount / returns.length) * 1000) / 10 : 0}%`} />
            <Mini label={t("aApprovedRate")} value={`${returns.length > 0 ? Math.round((approvedCount / returns.length) * 100) : 0}%`} />
            <Mini label={t("aRejectRate")} value={`${returns.length > 0 ? Math.round((byReturn("rejected") / returns.length) * 100) : 0}%`} />
            <Mini label={t("aAvgValue")} value={money(returns.length > 0 ? Math.round(returns.reduce((n, r) => n + r.amount, 0) / returns.length) : 0)} />
            <Mini label={t("aItems")} value={num(returns.reduce((n, r) => n + r.qty, 0))} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden border-border bg-card py-0">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{t("chartReturns")}</CardTitle>
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
                <StatusPieChart data={returnSlices} unitLabel={t("aTotal")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="refunds" className="flex flex-col gap-6 pt-2">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Mini label={t("fTotalRefunds")} value={num(refunds.length)} />
            <Mini label={t("fTotalAmt")} value={money(refunds.reduce((n, r) => n + r.final, 0))} />
            <Mini label={t("fAvg")} value={money(refunds.length > 0 ? Math.round(refunds.reduce((n, r) => n + r.final, 0) / refunds.length) : 0)} />
            <Mini label={t("fPendingAmt")} value={money(refunds.filter((r) => r.status === "pending" || r.status === "review").reduce((n, r) => n + r.final, 0))} />
            <Mini label={t("fDoneAmt")} value={money(totalRefund)} />
            <Mini label={t("fFailedAmt")} value={money(refunds.filter((r) => r.status === "failed").reduce((n, r) => n + r.final, 0))} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden border-border bg-card py-0">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{t("chartRefundTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={trend} />
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-border bg-card py-0">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{t("chartRefundMethods")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={methodSlices} unitLabel={t("fTotalAmt")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="pt-2">
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tProduct2")}</TableHead>
                    <TableHead className="text-right">{t("tOrders")}</TableHead>
                    <TableHead className="text-right">{t("tReturns")}</TableHead>
                    <TableHead className="text-right">{t("tReturnRate")}</TableHead>
                    <TableHead className="text-right">{t("tAmount")}</TableHead>
                    <TableHead>{t("tMainReason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productRows.map((r) => (
                    <TableRow key={r.product}>
                      <TableCell>
                        <p className="max-w-44 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                        <p className="text-xs text-muted-foreground">{r.vendor}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{num(r.orders)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{num(r.returns)}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-secondary">{r.rate}%</TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap">{money(r.amount)}</TableCell>
                      <TableCell className="max-w-36 truncate text-xs text-muted-foreground" title={r.main}>{r.main}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="pt-2">
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tVendor")}</TableHead>
                    <TableHead className="text-right">{t("tOrders")}</TableHead>
                    <TableHead className="text-right">{t("tReturns")}</TableHead>
                    <TableHead className="text-right">{t("tReturnRate")}</TableHead>
                    <TableHead className="text-right">{t("approved")}</TableHead>
                    <TableHead className="text-right">{t("rejected")}</TableHead>
                    <TableHead className="text-right">{t("tAmount")}</TableHead>
                    <TableHead>{t("tAvgTime")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorRows.map((r) => (
                    <TableRow key={r.vendor}>
                      <TableCell className="text-sm font-semibold whitespace-nowrap">{r.vendor}</TableCell>
                      <TableCell className="text-right text-sm">{num(r.orders)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{num(r.returns)}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-secondary">{r.rate}%</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{num(r.approved)}</TableCell>
                      <TableCell className="text-right text-sm text-destructive">{num(r.rejected)}</TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap">{money(r.amount)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">2.4 {t("days")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reasons" className="pt-2">
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("chartReasons")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tReason")}</TableHead>
                    <TableHead className="text-right">{t("tUsage")}</TableHead>
                    <TableHead className="text-right">{t("tRate")}</TableHead>
                    <TableHead className="text-right">{t("tAmount")}</TableHead>
                    <TableHead className="w-16">{t("tRate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reasons.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-semibold whitespace-nowrap">{r.name}</TableCell>
                      <TableCell className="text-right text-sm">{num(r.usage)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{r.rate}%</TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap">{money(r.amount)}</TableCell>
                      <TableCell className="text-center">
                        {r.usage > 50 ? (
                          <ArrowUp className="mx-auto size-4 text-destructive" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="mx-auto size-4 text-green-600" aria-hidden="true" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="pt-2">
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("tabFinancial")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {[
                { l: t("finGross"), v: money(2450000) },
                { l: t("finReturned"), v: money(185000) },
                { l: t("finRefund"), v: money(totalRefund) },
                { l: t("finShip"), v: money(8500) },
                { l: t("finFees"), v: money(4200) },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="font-semibold">{r.v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
                <span className="text-sm font-bold">{t("finNet")}</span>
                <span className="font-heading text-lg font-bold text-secondary">{money(totalRefund + 8500 - 4200)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
