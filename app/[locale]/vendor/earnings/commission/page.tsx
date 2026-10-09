"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Download, Percent, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { COMMISSION_RULES, downloadCsv, earningsSummary } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnStatCard, EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorEarningsCommissionPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const rows = useMemo(
    () => orders.filter((o) => !o.archived && o.status !== "cancelled" && o.commission > 0)
      .map((o) => ({ ...o, rate: o.total > 0 ? Math.round((o.commission / o.total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.commission - a.commission),
    [orders]
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eCommTotal")}
        subtitle={`${t("eAvgRate")}: ${summary.avgRate}%`}
        highlightLabel={t("eCommTotal")}
        highlightValue={money(summary.commission)}
        highlightIcon={Percent}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("commission.csv", ["order", "product", "gross", "rate", "commission", "earning", "date"],
              rows.map((o) => [o.id, o.items[0]?.name ?? "", o.total, o.rate, o.commission, o.earning, o.date]));
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("eCommTotal")} value={money(summary.commission)} href="/vendor/earnings/commission" accent />
        <EarnStatCard label={t("eThisMonth")} value={money(summary.monthCommission)} href="/vendor/earnings/commission" />
        <EarnStatCard label={t("eThisYear")} value={money(summary.yearCommission)} href="/vendor/earnings/commission" />
        <EarnStatCard label={t("eAvgRate")} value={`${num(summary.avgRate)}%`} sub={`${t("eCommRefunds")}: ${money(summary.commissionRefunds)}`} href="/vendor/earnings/commission" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eCommTotal")} · {num(rows.length)}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {rows.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tOrder")}</TableHead>
                    <TableHead>{t("eProduct")}</TableHead>
                    <TableHead className="text-right">{t("eGrossAmt")}</TableHead>
                    <TableHead className="text-right">{t("eRate")}</TableHead>
                    <TableHead className="text-right">{t("commission")}</TableHead>
                    <TableHead className="text-right">{t("vendorEarning")}</TableHead>
                    <TableHead>{t("tDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">#{o.id}</Link>
                      </TableCell>
                      <TableCell className="max-w-36 truncate text-xs">{o.items[0]?.name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(o.total)}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">{num(o.rate)}%</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap text-destructive">−{money(o.commission)}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(o.earning)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(o.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className="py-8"><EmptyState icon={Percent} title={t("emptyTitle")} description={t("emptyOrders")} /></div>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eRules")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pb-4 text-sm">
            {COMMISSION_RULES.map((r) => (
              <div key={r.scope} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-bold">{r.scope}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.note}</span>
                </span>
                <span className="shrink-0 bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">{num(r.rate)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
