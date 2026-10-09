"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, BellRing, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { COMMISSION_BASES, type CommissionType } from "@/features/admin/commission";
import { useCommissionStore } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-border bg-card px-4 py-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-label={label} />
    </label>
  );
}

const HOLD_OPTIONS = ["0", "3", "7", "14", "30", "custom"];

export default function CommissionSettingsPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const settings = useCommissionStore((s) => s.settings);
  const patchSettings = useCommissionStore((s) => s.patchSettings);

  const save = () => toast.success(t("toastSaved"));

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("sTitle")}
        subtitle={t("sSubtitle")}
        highlightLabel={t("sDefaultRate")}
        highlightValue={`${settings.defaultRate}%`}
        highlightIcon={Settings2}
      >
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <Tabs defaultValue="general">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
          <TabsTrigger value="calc">{t("tabCalc")}</TabsTrigger>
          <TabsTrigger value="refund">{t("tabRefund")}</TabsTrigger>
          <TabsTrigger value="hold">{t("tabHold")}</TabsTrigger>
          <TabsTrigger value="payout">{t("tabPayout")}</TabsTrigger>
          <TabsTrigger value="round">{t("tabRound")}</TabsTrigger>
          <TabsTrigger value="notify">{t("tabNotify")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-4 pt-2">
          <Toggle label={t("sEnable")} checked={settings.enabled} onChange={(v) => patchSettings({ enabled: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("sDefaultType")}>
              <Select value={settings.defaultType} onValueChange={(v) => patchSettings({ defaultType: (v as CommissionType) ?? "percentage" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t("optPercentage")}</SelectItem>
                  <SelectItem value="fixed">{t("optFixed")}</SelectItem>
                  <SelectItem value="mixed">{t("optMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("sDefaultRate")}>
              <Input
                type="number"
                min={0}
                value={settings.defaultRate}
                onChange={(e) => patchSettings({ defaultRate: Math.max(0, Number(e.target.value) || 0) })}
                className="bg-card"
              />
            </Field>
            <Field label={t("sCurrency")}>
              <Select value={settings.currency} onValueChange={(v) => patchSettings({ currency: v ?? "BDT" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["BDT", "USD", "INR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="calc" className="flex flex-col gap-4 pt-2">
          <Field label={t("sBase")}>
            <Select value={settings.base} onValueChange={(v) => patchSettings({ base: v ?? "order_subtotal" })}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_BASES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {t(`base${b.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}` as "baseProductPrice")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label={t("applyTax")} checked={settings.includeTax} onChange={(v) => patchSettings({ includeTax: v })} />
            <Toggle label={t("applyShipping")} checked={settings.includeShipping} onChange={(v) => patchSettings({ includeShipping: v })} />
            <Toggle label={t("applyDiscount")} checked={settings.includeDiscount} onChange={(v) => patchSettings({ includeDiscount: v })} />
            <Toggle label={t("applyCoupon")} checked={settings.includeCoupon} onChange={(v) => patchSettings({ includeCoupon: v })} />
            <Toggle label={t("applyFees")} checked={settings.includeFees} onChange={(v) => patchSettings({ includeFees: v })} />
          </div>
        </TabsContent>

        <TabsContent value="refund" className="flex flex-col gap-4 pt-2">
          <Toggle label={t("sAutoRev")} checked={settings.autoReversal} onChange={(v) => patchSettings({ autoReversal: v })} />
          <Field label={t("sPartial")}>
            <Select value={settings.partialHandling} onValueChange={(v) => patchSettings({ partialHandling: v ?? "proportional" })}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proportional">{t("optProportional")}</SelectItem>
                <SelectItem value="full">{t("optFullReverse")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </TabsContent>

        <TabsContent value="hold" className="flex flex-col gap-4 pt-2">
          <SectionCard title={t("sHold")}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HOLD_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patchSettings({ holdDays: d })}
                  className={cn(
                    "border px-2 py-2.5 text-sm font-bold transition-colors",
                    settings.holdDays === d
                      ? "border-secondary bg-secondary font-semibold text-white"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d === "custom" ? t("holdCustom") : `${d} Days`}
                </button>
              ))}
            </div>
            {settings.holdDays === "custom" ? (
              <Field label={t("holdCustom")}>
                <Input
                  type="number"
                  min={0}
                  value={settings.payoutHold}
                  onChange={(e) => patchSettings({ payoutHold: Math.max(0, Number(e.target.value) || 0) })}
                  className="bg-card"
                />
              </Field>
            ) : null}
            <div className="flex flex-col items-stretch gap-0 pt-2">
              {[t("hold1"), `${settings.holdDays === "custom" ? settings.payoutHold : settings.holdDays} ${t("hold2")}`, t("hold3")].map((s, i, arr) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={cn("w-full border px-4 py-2.5 text-center text-sm", i === arr.length - 1 ? "border-secondary bg-secondary/10 font-bold text-secondary" : "border-border font-medium")}>
                    {s}
                  </span>
                  {i < arr.length - 1 ? <ArrowDown className="size-4 shrink-0 text-secondary" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="payout" className="flex flex-col gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("sMinPayout")}>
              <Input
                type="number"
                min={0}
                value={settings.minPayout}
                onChange={(e) => patchSettings({ minPayout: Math.max(0, Number(e.target.value) || 0) })}
                className="bg-card"
              />
            </Field>
            <Field label={t("sSchedule")}>
              <Select value={settings.payoutSchedule} onValueChange={(v) => patchSettings({ payoutSchedule: v ?? "weekly" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t("optWeekly")}</SelectItem>
                  <SelectItem value="biweekly">{t("optBiweekly")}</SelectItem>
                  <SelectItem value="monthly">{t("optMonthly")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("sPayoutHold")}>
              <Input
                type="number"
                min={0}
                value={settings.payoutHold}
                onChange={(e) => patchSettings({ payoutHold: Math.max(0, Number(e.target.value) || 0) })}
                className="bg-card"
              />
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="round" className="flex flex-col gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("sPrecision")}>
              <Select value={settings.precision} onValueChange={(v) => patchSettings({ precision: v ?? "2" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["0", "2", "3"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("sRounding")}>
              <Select value={settings.rounding} onValueChange={(v) => patchSettings({ rounding: v ?? "half_up" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="half_up">{t("optHalfUp")}</SelectItem>
                  <SelectItem value="down">{t("optDown")}</SelectItem>
                  <SelectItem value="up">{t("optUp")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </TabsContent>

        <TabsContent value="notify" className="flex flex-col gap-4 pt-2">
          <Toggle label={t("sNotifyVendor")} checked={settings.notifyVendor} onChange={(v) => patchSettings({ notifyVendor: v })} />
          <Toggle label={t("sNotifyAdmin")} checked={settings.notifyAdmin} onChange={(v) => patchSettings({ notifyAdmin: v })} />
          <Toggle label={t("sNotifyPayout")} checked={settings.notifyPayout} onChange={(v) => patchSettings({ notifyPayout: v })} />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BellRing className="size-4 text-secondary" aria-hidden="true" />
            {t("sSubtitle")}
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
