"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Clock, Download, RefreshCw } from "lucide-react";
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
import { downloadCsv, earningsSummary, pendingReleases } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorEarningsPendingPage() {
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
  const releases = useMemo(() => pendingReleases(orders), [orders]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("pendingBalance")}
        subtitle={`${num(releases.length)} · ${money(summary.pending)}`}
        highlightLabel={t("pendingBalance")}
        highlightValue={money(summary.pending)}
        highlightIcon={Clock}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("pending-balance.csv", ["order", "earning", "status", "reason", "expected"], releases.map((r) => [r.orderId, r.earning, r.status, r.reason, r.expected]));
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
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">
            {t("pendingBalance")} · {money(summary.pending)}
          </CardTitle>
        </CardHeader>
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {releases.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead className="text-right">{t("vendorEarning")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("eReason")}</TableHead>
                  <TableHead>{t("eExpected")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((r) => (
                  <TableRow key={r.orderId}>
                    <TableCell>
                      <Link href={`/vendor/orders/${r.orderId}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">
                        #{r.orderId}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-sm">{r.customer}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">{money(r.earning)}</TableCell>
                    <TableCell>
                      <span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#8a5a00]">{t(r.status as "pending")}</span>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{r.reason}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{dateOf(r.expected)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8"><EmptyState icon={Clock} title={t("emptyTitle")} description={t("emptyOrders")} /></div>
          )}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {releases.length > 0 ? releases.map((r) => (
            <Link key={r.orderId} href={`/vendor/orders/${r.orderId}`} className="flex flex-col gap-1 border border-border bg-card p-3">
              <span className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold">#{r.orderId}</span>
                <span className="font-heading text-base font-bold text-secondary">{money(r.earning)}</span>
              </span>
              <span className="truncate text-sm font-semibold">{r.customer}</span>
              <span className="text-xs text-muted-foreground">{t("pending")} · {r.reason}</span>
              <span className="text-xs font-bold">{t("eExpected")}: {dateOf(r.expected)}</span>
            </Link>
          )) : <EmptyState icon={Clock} title={t("emptyTitle")} description={t("emptyOrders")} />}
        </CardContent>
      </Card>
    </div>
  );
}
