"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Landmark, Pencil, Plus, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { PAYOUT_CONFIG, maskAccount } from "@/features/vendor/payouts";
import { usePayoutAccounts, useVendorStore } from "@/store/vendor.store";
import { PayoutTabs } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorPayoutAccountPage() {
  const t = useTranslations("Dashboard.Vendor");
  const accounts = usePayoutAccounts();
  const store = useVendorStore();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"bank" | "mobile">("bank");
  const [holder, setHolder] = useState("");
  const [bank, setBank] = useState("");
  const [branch, setBranch] = useState("");
  const [number, setNumber] = useState("");
  const [provider, setProvider] = useState<string>(PAYOUT_CONFIG.providers[0]);
  const [mobile, setMobile] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const resetForm = () => {
    setHolder(""); setBank(""); setBranch(""); setNumber("");
    setProvider(PAYOUT_CONFIG.providers[0]); setMobile(""); setEditing(null);
  };

  const save = () => {
    if (!holder.trim() || (!number.trim() && !mobile.trim())) {
      toast.error(t("errRequired"));
      return;
    }
    if (editing) {
      store.patchPayoutAccount(editing, {
        holder: holder.trim(),
        bank: kind === "bank" ? bank.trim() : undefined,
        branch: kind === "bank" ? branch.trim() : undefined,
        masked: maskAccount(kind === "bank" ? number : mobile),
        provider: kind === "mobile" ? provider : undefined,
        mobile: kind === "mobile" ? mobile.trim() : undefined,
        updated: "2026-09-26",
      });
      store.notifyVendor(`Payout account ${editing} changed.`, "payout");
    } else {
      store.addPayoutAccount({
        id: `pa-${Date.now()}`,
        type: kind,
        label: kind === "bank" ? t("poBankForm") : t("poMobileForm"),
        holder: holder.trim(),
        bank: kind === "bank" ? bank.trim() : undefined,
        branch: kind === "bank" ? branch.trim() : undefined,
        masked: maskAccount(kind === "bank" ? number : mobile),
        provider: kind === "mobile" ? provider : undefined,
        mobile: kind === "mobile" ? mobile.trim() : undefined,
        verified: false,
        isDefault: accounts.length === 0,
        updated: "2026-09-26",
      });
      store.notifyVendor("Payout account added.", "payout");
    }
    setOpen(false);
    resetForm();
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poAccount")}
        subtitle={`${accounts.length} · ${t("poSubtitle")}`}
        highlightLabel={t("poAccount")}
        highlightValue={String(accounts.length)}
        highlightIcon={Landmark}
      />

      <PayoutTabs />

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" />
          {t("poAddAccount")}
        </Button>
      </div>

      {accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id} className={cn("border-border bg-card", a.isDefault && "border-secondary/60")}>
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  {a.type === "bank" ? <Landmark className="size-4 text-secondary" aria-hidden="true" /> : <Smartphone className="size-4 text-secondary" aria-hidden="true" />}
                  {a.label}
                </CardTitle>
                {a.isDefault ? <span className="bg-secondary px-2 py-0.5 text-[11px] font-bold text-white">{t("poDefault")}</span> : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-1 px-4 pb-4 text-sm">
                <p><span className="text-muted-foreground">{t("poHolder")}: </span><span className="font-bold">{a.holder}</span></p>
                {a.bank ? <p><span className="text-muted-foreground">{t("poBank")}: </span><span className="font-semibold">{a.bank}{a.branch ? ` · ${a.branch}` : ""}</span></p> : null}
                {a.provider ? <p><span className="text-muted-foreground">{t("poProvider")}: </span><span className="font-semibold">{a.provider}</span></p> : null}
                <p className="font-mono font-bold">{a.masked}</p>
                <p className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck className={cn("size-3.5", a.verified ? "text-green-600" : "text-secondary")} aria-hidden="true" />
                  <span className={a.verified ? "font-bold text-green-700" : "font-bold text-[#8a5a00]"}>
                    {a.verified ? t("poVerified") : t("poUnverified")}
                  </span>
                  <span className="text-muted-foreground">· {a.updated}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {!a.isDefault ? (
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { store.setDefaultAccount(a.id); toast.success(t("toastSaved")); }}>
                      {t("poSetDefault")}
                    </Button>
                  ) : null}
                  {!a.verified ? (
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { store.patchPayoutAccount(a.id, { verified: true }); store.notifyVendor(`Account ${a.id} verified.`, "payout"); toast.success(t("toastSaved")); }}>
                      {t("poVerify")}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => {
                    setEditing(a.id);
                    setKind(a.type === "bank" ? "bank" : "mobile");
                    setHolder(a.holder); setBank(a.bank ?? ""); setBranch(a.branch ?? "");
                    setNumber(""); setProvider(a.provider ?? PAYOUT_CONFIG.providers[0]); setMobile(a.mobile ?? "");
                    setOpen(true);
                  }}>
                    <Pencil className="size-3" aria-hidden="true" />
                    {t("poEdit")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px] text-destructive" onClick={() => setDeleting(a.id)}>
                    <Trash2 className="size-3" aria-hidden="true" />
                    {t("poDelete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Landmark} title={t("poNoAccount")} description={t("poNoAccountDesc")} />
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poAddAccount")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("poType")}>
              <Select value={kind} onValueChange={(v) => setKind((v as typeof kind) ?? "bank")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">{t("poBankForm")}</SelectItem>
                  <SelectItem value="mobile">{t("poMobileForm")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("poHolder")}>
              <Input value={holder} onChange={(e) => setHolder(e.target.value)} className="bg-card" />
            </Field>
            {kind === "bank" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("poBank")}><Input value={bank} onChange={(e) => setBank(e.target.value)} className="bg-card" /></Field>
                  <Field label={t("poBranch")}><Input value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-card" /></Field>
                </div>
                <Field label={t("poAcctNum")}>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" placeholder="**** **** 4582" className="bg-card" />
                </Field>
              </>
            ) : (
              <>
                <Field label={t("poProvider")}>
                  <Select value={provider} onValueChange={(v) => setProvider(v ?? PAYOUT_CONFIG.providers[0])}>
                    <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYOUT_CONFIG.providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("poMobile")}>
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" className="bg-card" />
                </Field>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); resetForm(); }}>{t("cancel")}</Button>
              <Button size="sm" onClick={save}>{t("poSave")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poDelete")}?</DialogTitle>
            <DialogDescription className="font-mono">{deleting}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button
              size="sm"
              onClick={() => {
                if (deleting) {
                  store.removePayoutAccount(deleting);
                  store.notifyVendor(`Payout account ${deleting} deleted.`, "payout");
                  toast.success(t("toastSaved"));
                }
                setDeleting(null);
              }}
            >
              {t("poDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
