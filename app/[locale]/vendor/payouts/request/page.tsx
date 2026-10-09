"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Wallet } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { PAYOUT_CONFIG, payoutRequestSchema } from "@/features/vendor/payouts";
import { earningsSummary } from "@/features/vendor/earnings";
import { usePayoutAccounts, useVendorOrders, useVendorPayouts, useVendorStore } from "@/store/vendor.store";
import { PayoutTabs } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorPayoutRequestPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const router = useRouter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const accounts = usePayoutAccounts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const verifiedAccounts = accounts.filter((a) => a.verified);

  const [amount, setAmount] = useState<number>(PAYOUT_CONFIG.minimum);
  const [method, setMethod] = useState<string>(PAYOUT_CONFIG.methods[0]);
  const [accountId, setAccountId] = useState(verifiedAccounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const fee = PAYOUT_CONFIG.feeFlat;
  const net = Math.max(0, amount - fee);
  const account = accounts.find((a) => a.id === accountId);

  const submit = () => {
    const parsed = payoutRequestSchema.safeParse({ amount, method, accountId, note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid request");
      return;
    }
    if (amount > summary.available) {
      setError(`Amount exceeds available balance of ${money(summary.available)}.`);
      return;
    }
    setError("");
    setConfirm(true);
  };

  const confirmRequest = () => {
    const id = `PO-${311 + payouts.length}`;
    store.addPayout({ id, amount: Math.round(amount), method, date: "2026-09-26", status: "pending" });
    store.notifyVendor(`Payout ${id} requested (${money(amount)}).`, "payout");
    setConfirm(false);
    toast.success(`${t("withdrawDone")} · ${id}`);
    router.push(`/vendor/payouts/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poReqTitle")}
        subtitle={`${t("poAvail")}: ${money(summary.available)}`}
        highlightLabel={t("poAvail")}
        highlightValue={money(summary.available)}
        highlightIcon={Wallet}
      >
        <Link href="/vendor/payouts" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("poOverview")}
        </Link>
      </AccountingHero>

      <PayoutTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("poAmount")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("poAvail")}: <span className="font-bold text-foreground">{money(summary.available)}</span></p>
            <Field label={t("poAmount")}>
              <Input type="number" min={PAYOUT_CONFIG.minimum} max={Math.min(PAYOUT_CONFIG.maximum, summary.available)} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{t("poFee")}</span>
              <span className="font-bold">{money(fee)}</span>
            </div>
            <div className="flex items-center justify-between bg-green-600/10 px-2 py-2.5">
              <span className="text-sm font-bold">{t("poNet")}</span>
              <span className="font-heading text-lg font-bold text-green-700">{money(net)}</span>
            </div>
            <Field label={t("poMethod")}>
              <Select value={method} onValueChange={(v) => setMethod(v ?? PAYOUT_CONFIG.methods[0])}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYOUT_CONFIG.methods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("poNote")}>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("poNote")} className="bg-card" rows={2} />
            </Field>
            {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}
            <p className="text-xs text-muted-foreground">{t("poAfter")}</p>
            <Button onClick={submit} disabled={verifiedAccounts.length === 0 || amount <= 0}>
              {t("poConfirm")}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("poAccountSel")}</CardTitle>
            <Link href="/vendor/payouts/account" className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline">
              <Plus className="size-3.5" aria-hidden="true" />
              {t("poAddAccount")}
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {accounts.length > 0 ? accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                aria-pressed={accountId === a.id}
                className={cn("flex items-center gap-3 border p-3 text-left transition-colors",
                  accountId === a.id ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary")}
              >
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border-2", accountId === a.id ? "border-secondary" : "border-muted-foreground")}>
                  {accountId === a.id ? <span className="size-2 rounded-full bg-secondary" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{a.label} · {a.bank ?? a.provider}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{a.masked}</span>
                </span>
                <span className={cn("shrink-0 px-2 py-0.5 text-[11px] font-bold", a.verified ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>
                  {a.verified ? t("poVerified") : t("poUnverified")}
                </span>
              </button>
            )) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <p className="font-bold">{t("poNoAccount")}</p>
                <p className="text-sm text-muted-foreground">{t("poNoAccountDesc")}</p>
                <Link href="/vendor/payouts/account">
                  <Button size="sm">{t("poAddAccount")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-border text-sm">
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("poAmount")}</span><span className="font-bold">{money(amount)}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("poFee")}</span><span className="font-bold">{money(fee)}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("poNet")}</span><span className="font-bold text-green-700">{money(net)}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("poMethod")}</span><span className="font-semibold">{method}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("poAccount")}</span><span className="font-mono text-xs font-bold">{account?.masked ?? "—"}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={confirmRequest}>{t("poConfirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
