"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Eye, FileText, RotateCcw } from "lucide-react";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { defaultPolicy } from "@/features/admin/returns";
import { useReturnsStore } from "@/store/returns.store";
import { toast } from "sonner";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border border-border bg-card px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="size-4 accent-[#ff8000]"
      />
    </label>
  );
}

export default function ReturnPolicyPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const policy = useReturnsStore((s) => s.policy);
  const patchPolicy = useReturnsStore((s) => s.patchPolicy);
  const [previewOpen, setPreviewOpen] = useState(false);

  const save = () => toast.success(t("toastPolicy"));
  const reset = () => {
    patchPolicy({ ...defaultPolicy });
    toast.success(t("toastSaved"));
  };

  const toggleCondition = (c: string) => {
    const has = policy.conditions.includes(c);
    patchPolicy({ conditions: has ? policy.conditions.filter((x) => x !== c) : [...policy.conditions, c] });
  };

  const CONDITIONS = ["Unused", "Original packaging", "Tags attached", "Accessories included"];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("pTitle")}
        subtitle={t("pSubtitle")}
        highlightLabel={t("pWindow")}
        highlightValue={`${policy.windowDays} ${t("days")}`}
        highlightIcon={FileText}
      >
        <button type="button" onClick={() => setPreviewOpen(true)} className={heroPillClassName}>
          <Eye className="size-3.5" aria-hidden="true" />
          {t("previewPolicy")}
        </button>
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secGeneral")}>
          <Toggle label={t("fEnable")} checked={policy.enabled} onChange={(v) => patchPolicy({ enabled: v })} />
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("fWindow")}>
              <Input type="number" min={0} value={policy.windowDays} onChange={(e) => patchPolicy({ windowDays: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fRefundDays")}>
              <Input type="number" min={0} value={policy.refundDays} onChange={(e) => patchPolicy({ refundDays: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("pRestock")}>
              <Input type="number" min={0} value={policy.restockFee} onChange={(e) => patchPolicy({ restockFee: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
          </div>
          <Toggle label={t("fExchange")} checked={policy.exchange} onChange={(v) => patchPolicy({ exchange: v })} />
        </SectionCard>

        <SectionCard title={t("secConditions")}>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={policy.conditions.includes(c)}
                  onChange={() => toggleCondition(c)}
                  aria-label={c}
                  className="size-4 accent-[#ff8000]"
                />
                {c}
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("secNonReturn")}>
          <div className="flex flex-wrap gap-2">
            {policy.nonReturnable.map((n) => (
              <span key={n} className="flex items-center gap-1.5 border border-border bg-card px-2.5 py-1.5 text-xs font-semibold">
                {n}
                <button
                  type="button"
                  aria-label={n}
                  onClick={() => patchPolicy({ nonReturnable: policy.nonReturnable.filter((x) => x !== n) })}
                  className="text-destructive hover:underline"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <Field label={t("secNonReturn")}>
            <AddNonReturnable
              onAdd={(v) => patchPolicy({ nonReturnable: [...policy.nonReturnable, v] })}
              placeholder={t("secNonReturn")}
            />
          </Field>
        </SectionCard>

        <SectionCard title={t("secShipping")}>
          <Field label={t("fShipPayer")}>
            <Select value={policy.shipPayer} onValueChange={(v) => patchPolicy({ shipPayer: v ?? "vendor" })}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">{t("optCustomer")}</SelectItem>
                <SelectItem value="vendor">{t("optVendor")}</SelectItem>
                <SelectItem value="admin">{t("optAdmin")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </SectionCard>

        <SectionCard title={t("secRefund")}>
          <Toggle label={t("fFullRefund")} checked={policy.fullRefund} onChange={(v) => patchPolicy({ fullRefund: v })} />
          <Toggle label={t("fPartialRefund")} checked={policy.partialRefund} onChange={(v) => patchPolicy({ partialRefund: v })} />
          <Toggle label={t("fShipRefund")} checked={policy.shipRefund} onChange={(v) => patchPolicy({ shipRefund: v })} />
        </SectionCard>

        <Card className="border-border bg-card">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("pOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            <OverviewRow label={t("pWindow")} value={`${policy.windowDays} ${t("days")}`} />
            <OverviewRow label={t("pRefundWindow")} value={`${policy.refundDays} ${t("days")}`} />
            <OverviewRow label={t("pExchange")} value={policy.exchange ? "Yes" : "No"} />
            <OverviewRow label={t("pShipResp")} value={policy.shipPayer} />
            <OverviewRow label={t("pRestock")} value={`৳${policy.restockFee}`} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="gap-1.5 bg-card" onClick={reset}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("resetPolicy")}
        </Button>
        <Button variant="outline" className="gap-1.5 bg-card" onClick={() => setPreviewOpen(true)}>
          <Eye className="size-3.5" aria-hidden="true" />
          {t("previewPolicy")}
        </Button>
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("policyPreviewTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 border border-border bg-white p-5 text-sm text-[#1a0d00]">
            <p className="font-heading text-xl font-bold">{t("policyPreviewTitle")}</p>
            <p>
              You may request a return within <strong>{policy.windowDays} days</strong> of delivery.
            </p>
            <p>
              Products must be {policy.conditions.join(", ").toLowerCase()} for a return to be accepted.
            </p>
            <p>
              Refunds are processed within <strong>{policy.refundDays} days</strong> after the returned
              item has been received and inspected{policy.restockFee > 0 ? `, minus a ৳${policy.restockFee} restocking fee` : ""}.
            </p>
            <p>
              Return shipping is paid by the <strong>{policy.shipPayer}</strong>
              {policy.exchange ? ", and exchanges are available" : ", and exchanges are not available"}.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>{t("cancelBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function AddNonReturnable({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="bg-card" aria-label={placeholder} />
      <Button
        size="sm"
        onClick={() => {
          if (v.trim()) {
            onAdd(v.trim());
            setV("");
          }
        }}
      >
        +
      </Button>
    </div>
  );
}
