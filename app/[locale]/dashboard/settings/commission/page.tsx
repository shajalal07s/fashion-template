"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowDown, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import { commissionPreview } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { toast } from "sonner";

const PRIORITY = ["Product Commission", "Vendor Commission", "Category Commission", "Global Commission"];

export default function CommissionSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const commission = useSettingsStore((s) => s.commission);
  const patch = useSettingsStore((s) => s.patchCommission);

  const [orderTotal, setOrderTotal] = useState(10000);
  const [pvType, setPvType] = useState<"percentage" | "fixed">("percentage");
  const [pvRate, setPvRate] = useState(10);
  const [pvFixed, setPvFixed] = useState(100);

  const save = () => toast.success(t("toastSaved"));
  const calc = commissionPreview(orderTotal, pvType, pvRate, pvFixed);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("cmTitle")}
        subtitle={t("cmSubtitle")}
        highlightLabel={t("fDefaultRate")}
        highlightValue={`${commission.defaultRate}%`}
        highlightIcon={Landmark}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secGlobalCom")}>
          <SettingToggle label={t("fEnableCom")} checked={commission.enabled} onChange={(v) => patch({ enabled: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fDefaultType")}>
              <Select value={commission.defaultType} onValueChange={(v) => patch({ defaultType: (v as "percentage" | "fixed") ?? "percentage" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDefaultRate")}>
              <Input type="number" min={0} value={commission.defaultRate} onChange={(e) => patch({ defaultRate: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fPayoutFreq")}>
              <Select value={commission.payoutFreq} onValueChange={(v) => patch({ payoutFreq: v ?? "Weekly" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Weekly", "Bi-weekly", "Monthly"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fBasedOn2")}>
              <Select value={commission.basedOn} onValueChange={(v) => patch({ basedOn: v ?? "Order Subtotal" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Product Price", "Order Subtotal", "Order Total"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("priorityTitle")}>
          <div className="flex flex-col items-stretch gap-0">
            {PRIORITY.map((p, i) => (
              <div key={p} className="flex flex-col items-center">
                <span className="flex w-full items-center gap-2 border border-border bg-card px-3 py-2.5 text-sm font-bold">
                  <span className="flex size-6 items-center justify-center bg-gradient-to-br from-primary to-secondary font-heading text-xs text-white">
                    {i + 1}
                  </span>
                  {p}
                </span>
                {i < PRIORITY.length - 1 ? (
                  <ArrowDown className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("cmPreview")}>
          <Field label={t("pvOrder")}>
            <Input type="number" min={0} value={orderTotal} onChange={(e) => setOrderTotal(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("fDefaultType")}>
              <Select value={pvType} onValueChange={(v) => setPvType((v as "percentage" | "fixed") ?? "percentage")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">৳</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDefaultRate")}>
              <Input type="number" min={0} value={pvRate} onChange={(e) => setPvRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={pvType === "fixed"} />
            </Field>
            <Field label={t("fDefaultRate")}>
              <Input type="number" min={0} value={pvFixed} onChange={(e) => setPvFixed(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={pvType === "percentage"} />
            </Field>
          </div>
          <div className="flex flex-col divide-y divide-border border-y border-border text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("pvOrder")}</span>
              <span className="font-semibold">৳{orderTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
              <span className="font-bold">{t("pvCommission")}</span>
              <span className="font-heading text-lg font-bold text-secondary">৳{calc.commission.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between bg-green-600/10 px-4 py-3">
              <span className="font-bold">{t("pvEarning")}</span>
              <span className="font-heading text-lg font-bold text-green-700">৳{calc.earning.toLocaleString()}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SaveBar onSave={save} />
    </div>
  );
}
