"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  CheckCircle,
  Clock,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { PAYOUT_CONFIG, enrichPayout, payoutEligibility } from "@/features/vendor/payouts";
import { earningsSummary } from "@/features/vendor/earnings";
import { usePayoutAccounts, useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { PayoutTabs } from "@/components/vendor/payout-coupon-shared";

export default function VendorPayoutsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const accounts = usePayoutAccounts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const detailed = useMemo(() => payouts.map(enrichPayout), [payouts]);
  const pendingList = detailed.filter((p) => p.status === "pending" || p.status === "processing");
  const failedList = detailed.filter((p) => p.status === "failed");
  const paidOut = detailed.filter((p) => p.status === "completed").reduce((n, p) => n + p.amount, 0);
  const last = useMemo(() => [...payouts].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null, [payouts]);

  const elig = payoutEligibility({
    available: summary.available,
    accountMissing: accounts.filter((a) => a.verified).length === 0,
    verified: true,
    disabled: false,
    hasPendingRestriction: false,
  });

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poTitle")}
        subtitle={t("poSubtitle")}
        highlightLabel={t("poAvail")}
        highlightValue={money(summary.available)}
        highlightIcon={Wallet}
      >
        <Link href="/vendor/payouts/request" className={heroPillClassName}>
          <ArrowDownToLine className="size-3.5" aria-hidden="true" />
          {t("poRequest")}
        </Link>
        <Link href="/vendor/payouts/history" className={heroPillClassName}>
          <Banknote className="size-3.5" aria-hidden="true" />
          {t("poHistory")}
        </Link>
      </AccountingHero>

      <PayoutTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("poAvail")} value={money(summary.available)} sub={t("poRequest")} href="/vendor/payouts/request" accent />
        <EarnStatCard label={t("poPendingBal")} value={money(summary.pending)} sub={t("poPending")} href="/vendor/payouts/pending" />
        <EarnStatCard label={t("poPaidOut")} value={money(paidOut)} sub={t("poHistory")} href="/vendor/payouts/history" />
        <EarnStatCard label={t("poTotal")} value={num(payouts.length)} href="/vendor/payouts/history" />
        <EarnStatCard label={t("poPendingCount")} value={num(pendingList.length)} href="/vendor/payouts/pending" />
        <EarnStatCard label={t("poFailed")} value={num(failedList.length)} href="/vendor/payouts/history" />
        <EarnStatCard label={t("poLast")} value={last ? money(last.amount) : "—"} sub={last?.id ?? ""} href={last ? `/vendor/payouts/${last.id}` : "/vendor/payouts/history"} />
        <EarnStatCard label={t("poNext")} value={PAYOUT_CONFIG.schedule.split("·")[1]?.trim() ?? "Thursday"} sub={t("poSchedule")} href="/vendor/payouts/request" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-secondary/40 bg-card">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("poAvail")}</p>
            <p className="font-heading text-4xl font-bold text-secondary">{money(summary.available)}</p>
            <p className="text-sm text-muted-foreground">
              {t("poMin")}: {money(PAYOUT_CONFIG.minimum)} · {t("poFee")}: {money(PAYOUT_CONFIG.feeFlat)} · {t("poNext")}: Oct 05, 2026
            </p>
            {!elig.ok ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                {elig.reason}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-sm font-bold text-green-700">
                <CheckCircle className="size-4" aria-hidden="true" />
                {elig.reason}
              </p>
            )}
            <Link href="/vendor/payouts/request" className="w-full max-w-xs">
              <Button className="w-full" disabled={!elig.ok}>{t("poRequest")}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <Clock className="size-4 text-secondary" aria-hidden="true" />
              {t("poPending")} ({num(pendingList.length)})
            </CardTitle>
            <Link href="/vendor/payouts/pending" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {pendingList.length > 0 ? pendingList.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/vendor/payouts/${p.id}`} className="flex items-center justify-between gap-3 border border-border p-2.5 transition-colors hover:border-secondary">
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-bold">{p.id}</span>
                  <span className="block text-[11px] text-muted-foreground">{p.method} · {t("poExpected")}: {p.expected}</span>
                </span>
                <span className="shrink-0 font-heading text-base font-bold text-secondary">{money(p.amount)}</span>
              </Link>
            )) : (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("poEmpty")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
