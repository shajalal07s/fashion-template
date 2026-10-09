"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeftRight, Banknote, Building2, Landmark, Power, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Field } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BankAccount } from "@/features/admin/accounting";
import { useAccountingStore, useBankAccounts } from "@/store/accounting.store";

const KIND_ICON = { bank: Landmark, cash: Banknote, mobile: Smartphone } as const;

const KIND_GRADIENT: Record<BankAccount["kind"], string> = {
  bank: "from-[#1a0d00] via-[#5c2e00] to-[#b35400]",
  cash: "from-green-800 via-green-700 to-green-600",
  mobile: "from-secondary via-[#ff962e] to-primary",
};

const BKASH_GRADIENT = "from-[#8f0f45] via-[#E2136E] to-[#f06292]";

export default function AccountingBankCashPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const banks = useBankAccounts();
  const patchBank = useAccountingStore((s) => s.patchBank);
  const transfer = useAccountingStore((s) => s.transfer);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const total = useMemo(
    () => banks.filter((b) => b.status === "active").reduce((n, b) => n + b.balance, 0),
    [banks]
  );

  const [transferOpen, setTransferOpen] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState(0);

  const openTransfer = (presetFrom?: string) => {
    const active = banks.filter((b) => b.status === "active");
    setFromId(presetFrom ?? active[0]?.id ?? "");
    setToId(active.find((b) => b.id !== (presetFrom ?? active[0]?.id))?.id ?? "");
    setAmount(0);
    setTransferOpen(true);
  };

  const fromBank = banks.find((b) => b.id === fromId);

  const handleTransfer = () => {
    if (!fromId || !toId || fromId === toId || amount <= 0) return;
    if (fromBank && amount > fromBank.balance) return;
    transfer(fromId, toId, amount);
    setTransferOpen(false);
    toast.success(t("toastTransferred"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("bankTitle")}
        description={t("bankSubtitle", { count: banks.length })}
        actions={
          <Button size="sm" className="h-8 gap-1.5" onClick={() => openTransfer()}>
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            {t("transfer")}
          </Button>
        }
      />

      <AccountingHero
        eyebrow={ts("accBank")}
        title={t("bankTitle")}
        subtitle={t("bankSubtitle", { count: banks.length })}
        highlightLabel={t("totalBankBalance")}
        highlightValue={money(total)}
        highlightIcon={Building2}
      >
        <span className={heroPillClassName}>
          {banks.filter((b) => b.status === "active").length} / {banks.length} {t("active")}
        </span>
        <button type="button" onClick={() => openTransfer()} className={heroPillClassName}>
          <ArrowLeftRight className="size-3.5" aria-hidden="true" />
          {t("transfer")}
        </button>
      </AccountingHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {banks.map((b: BankAccount) => {
          const Icon = KIND_ICON[b.kind];
          const gradient = b.name.toLowerCase().includes("bkash") ? BKASH_GRADIENT : KIND_GRADIENT[b.kind];
          return (
            <Card key={b.id} className={cn("overflow-hidden border-border bg-card py-0", b.status === "inactive" && "opacity-60")}>
              <div className={`flex flex-col gap-1 bg-gradient-to-br px-5 pt-5 pb-4 ${gradient}`}>
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center bg-white/15 backdrop-blur">
                    <Icon className="size-5 text-white" aria-hidden="true" />
                  </span>
                  <Badge
                    className={cn(
                      "font-semibold backdrop-blur",
                      b.status === "active" ? "bg-white/20 text-white" : "bg-black/30 text-white/70"
                    )}
                  >
                    {t(b.status)}
                  </Badge>
                </div>
                <p className="font-heading pt-2 text-sm font-bold text-white/85">{b.name}</p>
                <p className="font-mono text-xs tracking-widest text-white/70">{b.accountNo}</p>
                <p className="font-heading pt-1 text-2xl font-bold text-white">{money(b.balance)}</p>
              </div>
              <CardContent className="flex items-center gap-2 p-4">
                <Badge className="bg-primary/20 font-semibold text-[#8a5a00]">{t(b.kind)}</Badge>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 bg-card"
                    disabled={b.status !== "active"}
                    onClick={() => openTransfer(b.id)}
                  >
                    <ArrowLeftRight className="size-3.5" aria-hidden="true" />
                    {t("transfer")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => patchBank(b.id, { status: b.status === "active" ? "inactive" : "active" })}
                    aria-label={b.name}
                    title={b.name}
                  >
                    <Power className={cn("size-4", b.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("transferTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("transferFrom")}>
                <Select value={fromId} onValueChange={(v) => setFromId(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.filter((b) => b.status === "active").map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("transferTo")}>
                <Select value={toId} onValueChange={(v) => setToId(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.filter((b) => b.status === "active" && b.id !== fromId).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("transferAmount")}>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="bg-card"
              />
              {fromBank ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  {t("tableBalance")}: {money(fromBank.balance)}
                </p>
              ) : null}
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(false)}>{t("cancelBtn")}</Button>
            <Button
              size="sm"
              onClick={handleTransfer}
              disabled={!fromId || !toId || fromId === toId || amount <= 0 || (fromBank ? amount > fromBank.balance : false)}
            >
              {t("transfer")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
