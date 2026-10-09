"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreditCard, Pencil, Play, Plus, Power, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { ConfirmDialog, SaveBar } from "@/components/admin/settings/shared";
import type { PaymentMethod } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const payments = useSettingsStore((s) => s.payments);
  const store = useSettingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fDisplay, setFDisplay] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fInstructions, setFInstructions] = useState("");
  const [fMin, setFMin] = useState(0);
  const [fMax, setFMax] = useState(100000);
  const [fFee, setFFee] = useState(0);
  const [fFeeType, setFFeeType] = useState<"fixed" | "percent">("fixed");
  const [fPublic, setFPublic] = useState("");
  const [fSecret, setFSecret] = useState("");
  const [fMerchant, setFMerchant] = useState("");

  const save = () => toast.success(t("toastSaved"));
  const active = payments.filter((p) => p.status === "active");
  const def = payments.find((p) => p.isDefault);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFDisplay(""); setFDesc(""); setFInstructions("");
    setFMin(0); setFMax(100000); setFFee(0); setFFeeType("fixed");
    setFPublic(""); setFSecret(""); setFMerchant("");
    setDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditId(m.id);
    setFName(m.name); setFDisplay(m.display); setFDesc(m.description);
    setFInstructions(m.instructions); setFMin(m.min); setFMax(m.max);
    setFFee(m.fee); setFFeeType(m.feeType);
    setFPublic(m.publicKey); setFSecret(m.secretKey); setFMerchant(m.merchantId);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fDisplay.trim()) return;
    if (fMin > fMax) {
      toast.error(t("confirmDesc"));
      return;
    }
    if (editId) {
      store.patchPayment(editId, {
        display: fDisplay.trim(), description: fDesc.trim(), instructions: fInstructions.trim(),
        min: fMin, max: fMax, fee: fFee, feeType: fFeeType,
        publicKey: fPublic.trim(), secretKey: fSecret.trim(), merchantId: fMerchant.trim(),
      });
      toast.success(t("toastUpdated"));
    }
    setDialogOpen(false);
  };

  const subtotal = 2450;
  const discount = 245;
  const shipping = 60;
  const tax = 164;
  const fee = def ? (def.feeType === "percent" ? Math.round(subtotal * (def.fee / 100)) : def.fee) : 0;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("pmTitle")}
        subtitle={t("pmSubtitle")}
        highlightLabel={t("sActiveMethods")}
        highlightValue={String(active.length)}
        highlightIcon={CreditCard}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addMethod")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: t("sActiveMethods"), v: String(active.length) },
          { l: t("sInactiveMethods"), v: String(payments.length - active.length) },
          { l: t("sDefaultMethod"), v: def?.display ?? "—" },
          { l: t("sTestMode"), v: String(payments.filter((p) => p.testMode).length) },
        ].map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading truncate text-xl font-bold">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {payments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {payments.map((m) => (
            <Card key={m.id} className={cn("overflow-hidden border-border bg-card py-0", m.status !== "active" && "opacity-70")}>
              <div className={cn("h-1 w-full", m.status === "active" ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-muted")} />
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center bg-secondary/15 text-secondary">
                    <CreditCard className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {m.display}
                      {m.isDefault ? <Star className="ml-1 inline size-3.5 fill-primary text-primary" aria-label={t("tDefault")} /> : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{m.description}</span>
                  </span>
                  {m.testMode ? (
                    <span className="bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-[#8a5a00]">TEST</span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  ৳{m.min.toLocaleString()} – ৳{m.max.toLocaleString()} · {t("tFee")}: {m.feeType === "percent" ? `${m.fee}%` : `৳${m.fee}`} · {t("tSort")}: {m.sort}
                </p>
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(m)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {t("editTitle")}
                  </Button>
                  {!m.isDefault ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { store.setDefaultPayment(m.id); toast.success(t("toastSaved")); }}>
                      <Star className="size-3.5" aria-hidden="true" />
                      {t("tDefault")}
                    </Button>
                  ) : null}
                  {m.status === "active" ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { store.patchPayment(m.id, { status: "inactive" }); toast.success(t("toastUpdated")); }}>
                      <Power className="size-3.5 text-[#8a5a00]" aria-hidden="true" />
                      {t("disabled")}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { store.patchPayment(m.id, { status: "active" }); toast.success(t("toastUpdated")); }}>
                      <Play className="size-3.5 text-green-600" aria-hidden="true" />
                      {t("active")}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmId(m.id)} aria-label={m.display} title={t("confirmTitle")}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={CreditCard} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("checkoutPreview")}>
          <div className="flex flex-col divide-y divide-border text-sm">
            <PreviewRow label={t("pvSubtotal")} value={`৳${subtotal.toLocaleString()}`} />
            <PreviewRow label={t("pvDiscount")} value={`-৳${discount.toLocaleString()}`} />
            <PreviewRow label={t("pvShipping")} value={`৳${shipping.toLocaleString()}`} />
            <PreviewRow label={t("pvTax2")} value={`৳${tax.toLocaleString()}`} />
            <PreviewRow label={`${t("pvFee")} (${def?.display ?? "—"})`} value={`৳${fee.toLocaleString()}`} />
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
            <span className="text-sm font-bold">{t("pvGrand")}</span>
            <span className="font-heading text-lg font-bold text-secondary">
              ৳{(subtotal - discount + shipping + tax + fee).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {active.map((m) => (
              <span key={m.id} className={cn("border px-2.5 py-1.5 text-xs font-bold", m.isDefault ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground")}>
                {m.display}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <SaveBar onSave={save} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addMethod")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fMethodName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card font-mono text-xs" disabled={!!editId} />
            </Field>
            <Field label={t("fDisplayName")}>
              <Input value={fDisplay} onChange={(e) => setFDisplay(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <Field label={t("fDesc")}>
            <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("fInstructions")}>
            <Input value={fInstructions} onChange={(e) => setFInstructions(e.target.value)} className="bg-card" />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label={t("fMin")}>
              <Input type="number" min={0} value={fMin} onChange={(e) => setFMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fMax")}>
              <Input type="number" min={0} value={fMax} onChange={(e) => setFMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fFee")}>
              <Input type="number" min={0} value={fFee} onChange={(e) => setFFee(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fFeeType")}>
              <Select value={fFeeType} onValueChange={(v) => setFFeeType((v as "fixed" | "percent") ?? "fixed")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fPublicKey")}>
              <Input value={fPublic} onChange={(e) => setFPublic(e.target.value)} className="bg-card font-mono text-xs" type="password" />
            </Field>
            <Field label={t("fSecretKey")}>
              <Input value={fSecret} onChange={(e) => setFSecret(e.target.value)} className="bg-card font-mono text-xs" type="password" />
            </Field>
            <Field label={t("fMerchant")}>
              <Input value={fMerchant} onChange={(e) => setFMerchant(e.target.value)} className="bg-card font-mono text-xs" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
        confirmLabel={t("confirmBtn")}
        destructive
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) store.removePayments([confirmId]);
          setConfirmId(null);
          toast.success(t("toastDeleted", { count: 1 }));
        }}
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
