"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, Copy, Ticket } from "lucide-react";
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
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { couponConversion } from "@/features/vendor/coupons";
import { useVendorCoupons, useVendorOrders } from "@/store/vendor.store";
import { CouponTabs, CpStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "text-right font-mono text-xs font-bold break-all" : "text-right font-semibold break-all"}>{value}</span>
    </div>
  );
}

export default function VendorCouponDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ couponId: string }>();
  const id = params.couponId;
  const coupons = useVendorCoupons();
  const orders = useVendorOrders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const coupon = useMemo(() => coupons.find((c) => c.id === id), [coupons, id]);
  const couponOrders = useMemo(
    () => orders.filter((o) => !o.archived && (o.discount > 0 || o.coupon > 0)).slice(0, 6),
    [orders]
  );

  if (!coupon) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero eyebrow={t("nav_coupons")} title={t("cpList")} subtitle={id} highlightLabel={t("cpStatus")} highlightValue="—" highlightIcon={Ticket}>
          <Link href="/vendor/coupons/list" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("cpList")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Ticket} title={t("cpEmpty")} description={t("cpEmptyDesc")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={coupon.code} subtitle={`${coupon.name} · ${couponConversion(coupon)}% conv.`}
        highlightLabel={t("cpUsage")} highlightValue={`${num(coupon.used)}/${num(coupon.usageLimit)}`} highlightIcon={Ticket}
      >
        <Link href="/vendor/coupons/list" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("cpList")}
        </Link>
        <button type="button" onClick={() => { void navigator.clipboard.writeText(coupon.code); toast.success(t("cpCopy")); }} className={heroPillClassName}>
          <Copy className="size-3.5" aria-hidden="true" />
          {t("cpCopy")}
        </button>
      </AccountingHero>

      <CouponTabs />

      <div className="flex items-center gap-2">
        <CpStatusBadge status={coupon.status} />
        <span className="text-xs text-muted-foreground">{coupon.type} · {t("cpRemaining")}: {num(coupon.usageLimit - coupon.used)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpCode")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <KV label={t("cpCode")} value={coupon.code} mono />
            <KV label={t("cpType")} value={`${coupon.type} · ${coupon.type === "percent" ? `${coupon.value}%` : money(coupon.value)}`} />
            <KV label={t("cpMinOrder")} value={money(coupon.minOrder)} />
            <KV label={t("cpMaxDisc")} value={money(coupon.maxDiscount)} />
            <KV label={t("cpStart")} value={coupon.start} />
            <KV label={t("cpExpiry")} value={coupon.expiry} />
            <KV label={t("cpLimit")} value={`${num(coupon.usageLimit)} (${t("cpPerCustomer")}: ${num(coupon.perCustomer)})`} />
            <KV label={t("cpUsed")} value={`${num(coupon.used)} · ${t("cpRemaining")}: ${num(coupon.usageLimit - coupon.used)}`} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("cpAnalytics")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <KV label={t("cpUses")} value={num(coupon.used)} />
              <KV label={t("cpOrders")} value={num(coupon.orders)} />
              <KV label={t("cpRevenue")} value={money(coupon.revenue)} />
              <KV label={t("cpDiscountGiven")} value={money(coupon.discountGiven)} />
              <KV label={t("cpAov")} value={money(coupon.orders > 0 ? Math.round(coupon.revenue / coupon.orders) : 0)} />
              <KV label={t("cpConversion")} value={`${couponConversion(coupon)}%`} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("cpRestrictions")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm">
              <KV label={t("cpScope")} value={coupon.scope} />
              <KV label={t("cpAudience")} value={coupon.audience === "all" ? t("cpEveryone") : coupon.audience === "new" ? t("cpNewOnly") : t("cpExistingOnly")} />
              <KV label={t("cpStackable")} value={coupon.stackable ? t("cpStack") : "—"} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("cpOrders")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("tOrder")}</TableHead>
                <TableHead>{t("tCustomer")}</TableHead>
                <TableHead className="text-right">{t("tTotal")}</TableHead>
                <TableHead className="text-right">{t("discount")}</TableHead>
                <TableHead>{t("tStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell><Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">#{o.id}</Link></TableCell>
                  <TableCell className="text-sm">{o.customer}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{money(o.total)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-destructive">−{money(o.discount + o.coupon)}</TableCell>
                  <TableCell><span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">{t(o.status)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="bg-card" onClick={() => { void navigator.clipboard.writeText(coupon.code); toast.success(t("cpCopy")); }}>
          {t("cpCopy")}
        </Button>
      </div>
    </div>
  );
}
