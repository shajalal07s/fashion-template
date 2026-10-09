"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Landmark } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { earningsSummary } from "@/features/vendor/earnings";
import { usePayoutAccounts, useVendorOrders, useVendorPayouts, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { SettingTabs } from "@/components/vendor/shipping-settings-shared";
import { cn } from "@/lib/utils";

export default function VendorSettingsPaymentPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const accounts = usePayoutAccounts();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const def = accounts.find((a) => a.isDefault) ?? accounts[0];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("sePayment")} subtitle={t("poSubtitle")}
        highlightLabel={t("seDefaultMethod")} highlightValue={def ? `${def.label} · ${def.masked}` : "—"} highlightIcon={Landmark}
      />

      <SettingTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <EarnStatCard label={t("seDefaultMethod")} value={def ? def.masked : "—"} sub={def?.label ?? t("poNoAccount")} href="/vendor/payouts/account" accent />
        <EarnStatCard label={t("seEligibility")} value={summary.available >= 5000 ? t("seOn") : t("seOff")} sub={money(summary.available)} href="/vendor/payouts/request" />
        <EarnStatCard label={t("poAccount")} value={String(accounts.length)} href="/vendor/payouts/account" />
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("sePayment")}</CardTitle>
          <Link href="/vendor/payouts/account" className="text-xs font-bold text-secondary hover:underline">{t("seManageAccounts")}</Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 pb-4">
          {accounts.length > 0 ? accounts.map((a) => (
            <div key={a.id} className={cn("flex items-center gap-3 border p-3", a.isDefault ? "border-secondary/60" : "border-border")}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{a.label} · {a.bank ?? a.provider}</span>
                <span className="block font-mono text-xs text-muted-foreground">{a.masked}</span>
              </span>
              <span className={cn("shrink-0 px-2 py-0.5 text-[11px] font-bold", a.verified ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>
                {a.verified ? t("poVerified") : t("poUnverified")}
              </span>
              {!a.isDefault ? (
                <Button size="sm" variant="outline" className="h-7 shrink-0 bg-card text-[11px]" onClick={() => store.setDefaultAccount(a.id)}>
                  {t("poSetDefault")}
                </Button>
              ) : (
                <span className="shrink-0 bg-secondary px-2 py-0.5 text-[11px] font-bold text-white">{t("poDefault")}</span>
              )}
              <Link href="/vendor/payouts/account" className="shrink-0 text-xs font-bold text-secondary hover:underline">{t("poEdit")}</Link>
            </div>
          )) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="font-bold">{t("poNoAccount")}</p>
              <p className="text-sm text-muted-foreground">{t("poNoAccountDesc")}</p>
              <Link href="/vendor/payouts/account"><Button size="sm">{t("poAddAccount")}</Button></Link>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("poAccount")} · {t("seEligibility")}: {money(summary.available)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
