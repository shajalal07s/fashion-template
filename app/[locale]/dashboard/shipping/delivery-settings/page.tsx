"use client";

import { useTranslations } from "next-intl";
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
import { useShipMethods, useShippingStore, useShipZones } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
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

export default function DeliverySettingsPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const delivery = useShippingStore((s) => s.delivery);
  const patchDelivery = useShippingStore((s) => s.patchDelivery);
  const methods = useShipMethods();
  const zones = useShipZones();

  const save = () => toast.success(t("toastSaved"));

  const toggleDay = (d: string) => {
    const has = delivery.businessDays.includes(d);
    patchDelivery({ businessDays: has ? delivery.businessDays.filter((x) => x !== d) : [...delivery.businessDays, d] });
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("dTitle")}
        subtitle={t("dSubtitle")}
        highlightLabel={t("fDefaultMethod")}
        highlightValue={delivery.defaultMethod}
        highlightIcon={Settings2}
      >
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <Tabs defaultValue="general">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="general">{t("dGeneral")}</TabsTrigger>
          <TabsTrigger value="time">{t("dTime")}</TabsTrigger>
          <TabsTrigger value="cutoff">{t("dCutoff")}</TabsTrigger>
          <TabsTrigger value="restrict">{t("dRestrict")}</TabsTrigger>
          <TabsTrigger value="free">{t("dFree")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fDefaultMethod")}>
              <Select value={delivery.defaultMethod} onValueChange={(v) => patchDelivery({ defaultMethod: v ?? methods[0]?.name ?? "" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDefaultTime")}>
              <Input value={delivery.defaultTime} onChange={(e) => patchDelivery({ defaultTime: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fMinDays2")}>
              <Input type="number" min={0} value={delivery.minDays} onChange={(e) => patchDelivery({ minDays: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fMaxDays2")}>
              <Input type="number" min={0} value={delivery.maxDays} onChange={(e) => patchDelivery({ maxDays: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fProcessing")}>
              <Input type="number" min={0} value={delivery.processingHours} onChange={(e) => patchDelivery({ processingHours: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fHandling2")}>
              <Input type="number" min={0} value={delivery.handlingHours} onChange={(e) => patchDelivery({ handlingHours: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
          </div>
          <Toggle label={t("fWeekend")} checked={delivery.weekend} onChange={(v) => patchDelivery({ weekend: v })} />
          <Toggle label={t("fSameDay")} checked={delivery.sameDay} onChange={(v) => patchDelivery({ sameDay: v })} />
          <Toggle label={t("fNextDay")} checked={delivery.nextDay} onChange={(v) => patchDelivery({ nextDay: v })} />
        </TabsContent>

        <TabsContent value="time" className="flex flex-col gap-4 pt-2">
          <SectionCard title={t("dTime")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-border bg-card p-4">
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{t("stdRange")}</p>
                <p className="font-heading pt-1 text-2xl font-bold text-secondary">
                  {delivery.standardMin}–{delivery.standardMax} Days
                </p>
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Input type="number" min={0} value={delivery.standardMin} onChange={(e) => patchDelivery({ standardMin: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" aria-label={t("stdRange")} />
                  <Input type="number" min={0} value={delivery.standardMax} onChange={(e) => patchDelivery({ standardMax: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" aria-label={t("stdRange")} />
                </div>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{t("expRange")}</p>
                <p className="font-heading pt-1 text-2xl font-bold text-secondary">
                  {delivery.expressMin}–{delivery.expressMax} Days
                </p>
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Input type="number" min={0} value={delivery.expressMin} onChange={(e) => patchDelivery({ expressMin: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" aria-label={t("expRange")} />
                  <Input type="number" min={0} value={delivery.expressMax} onChange={(e) => patchDelivery({ expressMax: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" aria-label={t("expRange")} />
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="cutoff" className="flex flex-col gap-4 pt-2">
          <SectionCard title={t("dCutoff")}>
            <Field label={t("fCutoff")}>
              <Input type="time" value={delivery.cutoff} onChange={(e) => patchDelivery({ cutoff: e.target.value })} className="bg-card" />
            </Field>
            <p className="text-xs text-muted-foreground">{t("cutoffHint")}</p>
            <Field label={t("fBusinessDays")}>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    aria-pressed={delivery.businessDays.includes(d)}
                    className={cn("border px-3 py-1.5 text-xs font-bold transition-colors", delivery.businessDays.includes(d) ? "border-secondary bg-secondary text-white" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>
        </TabsContent>

        <TabsContent value="restrict" className="flex flex-col gap-4 pt-2">
          <Field label={t("fRestrictedC")}>
            <Input value={delivery.restrictedCountries} onChange={(e) => patchDelivery({ restrictedCountries: e.target.value })} className="bg-card" placeholder="—" />
          </Field>
          <Field label={t("fRestrictedR")}>
            <Input value={delivery.restrictedRegions} onChange={(e) => patchDelivery({ restrictedRegions: e.target.value })} className="bg-card" placeholder="—" />
          </Field>
          <Field label={t("fRestrictedP")}>
            <Input value={delivery.restrictedPostals} onChange={(e) => patchDelivery({ restrictedPostals: e.target.value })} className="bg-card" placeholder="—" />
          </Field>
        </TabsContent>

        <TabsContent value="free" className="flex flex-col gap-4 pt-2">
          <Toggle label={t("fFreeEnabled")} hint={`${t("fFreeMin")}: ৳${delivery.freeMinAmount}`} checked={delivery.freeEnabled} onChange={(v) => patchDelivery({ freeEnabled: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fFreeMin")}>
              <Input type="number" min={0} value={delivery.freeMinAmount} onChange={(e) => patchDelivery({ freeMinAmount: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fFreeQty")}>
              <Input type="number" min={0} value={delivery.freeMinQty} onChange={(e) => patchDelivery({ freeMinQty: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fFreeZone")}>
              <Select value={delivery.freeZone} onValueChange={(v) => patchDelivery({ freeZone: v ?? "" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fFreeVendor")}>
              <Input value={delivery.freeVendor} onChange={(e) => patchDelivery({ freeVendor: e.target.value })} className="bg-card" />
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
