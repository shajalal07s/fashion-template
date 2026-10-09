"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BadgeCheck, Download, RefreshCw, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/admin/products/edit/sections";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { PAYOUT_RULES, downloadCsv, earningsSummary } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts, useVendorStore } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorEarningsAvailablePage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const lastPayout = useMemo(
    () => [...payouts].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    [payouts]
  );

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(PAYOUT_RULES.minimum);
  const [method, setMethod] = useState("Bank Transfer");

  const eligible = summary.withdrawable >= PAYOUT_RULES.minimum;

  const request = () => {
    if (!eligible || amount <= 0 || amount > summary.available) return;
    store.addPayout({
      id: `PO-${311 + payouts.length}`,
      amount: Math.round(amount),
      method,
      date: "2026-09-26",
      status: "pending",
    });
    store.logOrderEvent(orders[0]?.id ?? "ORD-2041", "Payout requested", `${method} ${amount}`);
    setOpen(false);
    toast.success(t("withdrawDone"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eAvailTitle")}
        subtitle={t("eSubtitle")}
        highlightLabel={t("availBalance")}
        highlightValue={money(summary.available)}
        highlightIcon={Wallet}
      >
        <button type="button" onClick={() => setOpen(true)} disabled={!eligible} className={heroPillClassName}>
          <Wallet className="size-3.5" aria-hidden="true" />
          {t("eRequestPayout")}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadCsv("available-balance.csv", ["metric", "amount"], [["available", summary.available], ["withdrawable", summary.withdrawable], ["minimum", PAYOUT_RULES.minimum]]);
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-secondary/40 bg-card">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("availBalance")}</p>
            <p className="font-heading text-4xl font-bold text-secondary">{money(summary.available)}</p>
            <p className="text-sm text-muted-foreground">{t("eWithdrawable")}: {money(summary.withdrawable)}</p>
            {eligible ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-green-700">
                <BadgeCheck className="size-4" aria-hidden="true" />
                {t("eEligible")}
              </p>
            ) : (
              <p className="text-sm font-semibold text-destructive">
                {t("eNeedMore", { amount: money(summary.shortfall) })}
              </p>
            )}
            <Button className="mt-2 w-full max-w-xs" disabled={!eligible} onClick={() => setOpen(true)}>
              {t("eRequestPayout")}
            </Button>
            <Link href="/vendor/earnings/transactions" className="text-xs font-bold text-secondary hover:underline">
              {t("viewPayouts")}
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("ePayoutRules")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pb-4 text-sm">
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("eWithdrawable")}</span><span className="font-bold">{money(summary.withdrawable)}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("eLastPayout")}</span><span className="font-semibold">{lastPayout ? `${lastPayout.id} · ${money(lastPayout.amount)}` : "—"}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("eNextPayout")}</span><span className="font-semibold">{PAYOUT_RULES.eligibleWeekday}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("eMinPayout")}</span><span className="font-bold">{money(PAYOUT_RULES.minimum)}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("ePayoutFee")}</span><span className="font-bold">{money(PAYOUT_RULES.fee)}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-muted-foreground">{t("eReleaseNote", { days: PAYOUT_RULES.holdDays })}</span><span className="font-semibold">{PAYOUT_RULES.holdDays}d</span></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("eRequestPayout")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("withdrawAmt")}>
              <Input type="number" min={PAYOUT_RULES.minimum} max={summary.available} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("withdrawMethod")}>
              <Select value={method} onValueChange={(v) => setMethod(v ?? "Bank Transfer")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bank Transfer", "bKash", "Nagad", "Rocket"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">{t("availBalance")}: {money(summary.available)} · {t("eMinPayout")}: {money(PAYOUT_RULES.minimum)}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={request} disabled={!eligible || amount < PAYOUT_RULES.minimum || amount > summary.available}>
              {t("eRequestPayout")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
