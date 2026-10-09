"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, RefreshCw, Ticket } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { couponConversion, demoFlashSales } from "@/features/vendor/coupons";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorCoupons } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { CouponTabs, CpStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

export default function VendorCouponsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const coupons = useVendorCoupons();
  const [range, setRange] = useState("30D");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const active = coupons.filter((c) => c.status === "active");
  const stats = useMemo(() => ({
    total: coupons.length,
    active: active.length,
    scheduled: coupons.filter((c) => c.status === "scheduled").length,
    expired: coupons.filter((c) => c.status === "expired").length,
    uses: coupons.reduce((n, c) => n + c.used, 0),
    given: coupons.reduce((n, c) => n + c.discountGiven, 0),
    revenue: coupons.reduce((n, c) => n + c.revenue, 0),
    promos: active.length + demoFlashSales.filter((f) => f.status === "live").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [coupons]);

  const top = useMemo(() => [...coupons].sort((a, b) => b.revenue - a.revenue).slice(0, 5), [coupons]);
  const trend = useMemo(() => {
    const base = top.slice(0, 4).map((c, i) => ({ x: c.code.slice(0, 6), y: c.used * (i + 1) }));
    return range === "7D" ? base.slice(0, 2) : base;
  }, [top, range]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")}
        title={t("cpTitle")}
        subtitle={t("cpSubtitle")}
        highlightLabel={t("cpActive")}
        highlightValue={num(stats.active)}
        highlightIcon={Ticket}
      >
        <Link href="/vendor/coupons/create" className={heroPillClassName}>
          <Ticket className="size-3.5" aria-hidden="true" />
          {t("cpCreate")}
        </Link>
        <button
          type="button"
          onClick={() => {
            downloadCsv("coupons.csv", ["code", "type", "used", "discount", "revenue", "status"],
              coupons.map((c) => [c.code, c.type, c.used, c.discountGiven, c.revenue, c.status]));
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

      <CouponTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("cpTotal")} value={num(stats.total)} href="/vendor/coupons/list" accent />
        <EarnStatCard label={t("cpActive")} value={num(stats.active)} href="/vendor/coupons/list" accent />
        <EarnStatCard label={t("cpScheduled")} value={num(stats.scheduled)} href="/vendor/coupons/list" />
        <EarnStatCard label={t("cpExpired")} value={num(stats.expired)} href="/vendor/coupons/list" />
        <EarnStatCard label={t("cpUses")} value={num(stats.uses)} href="/vendor/coupons/list" />
        <EarnStatCard label={t("cpDiscountGiven")} value={money(stats.given)} href="/vendor/coupons/list" />
        <EarnStatCard label={t("cpRevenue")} value={money(stats.revenue)} href="/vendor/coupons/list" />
        <EarnStatCard label={t("cpPromos")} value={num(stats.promos)} href="/vendor/coupons/flash-sale" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpUses")} · {range}</CardTitle>
            <Select value={range} onValueChange={(v) => setRange(v ?? "30D")}>
              <SelectTrigger size="sm" className="h-8 w-28 bg-card" aria-label={t("eDateRange")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {["7D", "30D", "90D", "1Y"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend.length > 0 ? trend : [{ x: "—", y: 0 }]} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpRevenue")}</CardTitle>
            <Link href="/vendor/coupons/list" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("cpCode")}</TableHead>
                  <TableHead className="text-right">{t("cpUsage")}</TableHead>
                  <TableHead className="text-right">{t("cpRevenueCol")}</TableHead>
                  <TableHead>{t("cpStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/vendor/coupons/${c.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{c.code}</Link>
                      <p className="text-[11px] text-muted-foreground">{couponConversion(c)}% conv.</p>
                    </TableCell>
                    <TableCell className="text-right font-bold">{num(c.used)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(c.revenue)}</TableCell>
                    <TableCell><CpStatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
