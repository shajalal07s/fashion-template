"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Calculator, Settings2 } from "lucide-react";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { COMMISSION_BASES, type CommissionType } from "@/features/admin/commission";
import { useCommissionStore } from "@/store/commission.store";
import { toast } from "sonner";

const APPLY_KEYS = ["applyPrice", "applyShipping", "applyTax", "applyDiscount", "applyCoupon", "applyFees"] as const;

export default function GlobalCommissionPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const patchRule = useCommissionStore((s) => s.patchRule);
  const rules = useCommissionStore((s) => s.rules);
  const global = rules.find((r) => r.scope === "global") ?? rules[0];

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 2 });

  const [name, setName] = useState("Global Standard 10%");
  const [type, setType] = useState<CommissionType>("percentage");
  const [rate, setRate] = useState(10);
  const [fixed, setFixed] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [priority, setPriority] = useState(4);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-12-31");
  const [desc, setDesc] = useState("Default marketplace commission applied to every order.");
  const [base, setBase] = useState("order_subtotal");
  const [apply, setApply] = useState<Record<string, boolean>>({
    applyPrice: true,
    applyShipping: false,
    applyTax: false,
    applyDiscount: true,
    applyCoupon: true,
    applyFees: false,
  });

  const [pvPrice, setPvPrice] = useState(200);
  const [pvQty, setPvQty] = useState(2);
  const [pvDiscount, setPvDiscount] = useState(40);

  const preview = useMemo(() => {
    const subtotal = pvPrice * pvQty;
    const commissionable = Math.max(0, subtotal - pvDiscount);
    let commission = type === "percentage" ? (commissionable * rate) / 100 : 0;
    if (type === "fixed" || type === "mixed") commission += fixed;
    if (type === "mixed") commission = (commissionable * rate) / 100 + fixed;
    if (min > 0) commission = Math.max(min, commission);
    if (max > 0) commission = Math.min(max, commission);
    return { subtotal, commissionable, commission, earning: commissionable - commission };
  }, [pvPrice, pvQty, pvDiscount, type, rate, fixed, min, max]);

  const handleSave = () => {
    if (global) {
      patchRule(global.id, {
        name,
        type,
        rate,
        fixed,
        priority,
        status,
        start,
        end,
      });
    }
    toast.success(t("toastUpdated"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("gTitle")}
        subtitle={t("gSubtitle")}
        highlightLabel={t("gRate")}
        highlightValue={type === "fixed" ? money(fixed) : `${rate}%`}
        highlightIcon={Settings2}
      >
        <button type="button" onClick={handleSave} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <SectionCard title={t("gCard")}>
            <Field label={t("gName")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("gType")}>
                <Select value={type} onValueChange={(v) => setType(v as CommissionType)}>
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
              <Field label={t("gRate")}>
                <Input
                  type="number"
                  min={0}
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                  disabled={type === "fixed"}
                />
              </Field>
              <Field label={t("gFixed")}>
                <Input
                  type="number"
                  min={0}
                  value={fixed}
                  onChange={(e) => setFixed(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                  disabled={type === "percentage"}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("gMin")}>
                <Input
                  type="number"
                  min={0}
                  value={min}
                  onChange={(e) => setMin(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                />
              </Field>
              <Field label={t("gMax")}>
                <Input
                  type="number"
                  min={0}
                  value={max}
                  onChange={(e) => setMax(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                />
              </Field>
              <Field label={t("gPriority")}>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Math.max(1, Number(e.target.value) || 4))}
                  className="bg-card"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("gStatus")}>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("gStart")}>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("gEnd")}>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
            <Field label={t("gDesc")}>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-card" />
            </Field>
          </SectionCard>

          <SectionCard title={t("gBase")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {COMMISSION_BASES.map((b) => (
                <label
                  key={b}
                  className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-sm font-medium transition-colors ${base === b ? "border-secondary bg-secondary/10 font-semibold text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  <input
                    type="radio"
                    name="commission-base"
                    checked={base === b}
                    onChange={() => setBase(b)}
                    className="accent-[#ff8000]"
                  />
                  {t(`base${b.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}` as "baseProductPrice")}
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t("gApplyTo")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {APPLY_KEYS.map((k) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-sm font-medium transition-colors ${apply[k] ? "border-secondary bg-secondary/10 font-semibold text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  <Checkbox
                    checked={apply[k]}
                    onCheckedChange={(v) => setApply((p) => ({ ...p, [k]: v === true }))}
                    aria-label={t(k)}
                  />
                  {t(k)}
                </label>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <SectionCard
              title={t("gPreview")}
              icon={<Calculator className="size-4 text-secondary" aria-hidden="true" />}
              action={
                <Button size="sm" className="h-8" onClick={handleSave}>
                  {t("saveBtn")}
                </Button>
              }
            >
              <div className="grid grid-cols-3 gap-2">
                <Field label={t("pvPrice")}>
                  <Input
                    type="number"
                    min={0}
                    value={pvPrice}
                    onChange={(e) => setPvPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="bg-card"
                  />
                </Field>
                <Field label={t("pvQty")}>
                  <Input
                    type="number"
                    min={1}
                    value={pvQty}
                    onChange={(e) => setPvQty(Math.max(1, Number(e.target.value) || 1))}
                    className="bg-card"
                  />
                </Field>
                <Field label={t("pvDiscount")}>
                  <Input
                    type="number"
                    min={0}
                    value={pvDiscount}
                    onChange={(e) => setPvDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="bg-card"
                  />
                </Field>
              </div>
              <div className="flex flex-col divide-y divide-border border-y border-border">
                <PreviewRow label={t("pvSubtotal")} value={money(preview.subtotal)} />
                <PreviewRow label={t("pvDiscount")} value={`-${money(pvDiscount)}`} />
                <PreviewRow label={t("pvCommissionable")} value={money(preview.commissionable)} />
                <PreviewRow
                  label={`${t("pvRate")} (${type === "fixed" ? money(fixed) : `${rate}%`})`}
                  value={money(preview.commission)}
                />
              </div>
              <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
                <span className="text-sm font-bold">{t("pvCommission")}</span>
                <span className="font-heading text-lg font-bold text-secondary">{money(preview.commission)}</span>
              </div>
              <div className="flex items-center justify-between bg-green-600/10 px-4 py-3">
                <span className="text-sm font-bold">{t("pvEarning")}</span>
                <span className="font-heading text-lg font-bold text-green-700">{money(preview.earning)}</span>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold whitespace-nowrap text-foreground">{value}</span>
    </div>
  );
}
