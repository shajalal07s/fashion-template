"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowLeft, Truck } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import {
  CALC_TYPE_LABELS,
  SHIPPING_CONFIG,
  rateSchema,
  type RateCalcType,
} from "@/features/vendor/shipping";
import { useVendorStore } from "@/store/vendor.store";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorRateCreatePage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const router = useRouter();
  const store = useVendorStore();
  const zones = store.shippingZones.filter((z) => z.active);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [calcType, setCalcType] = useState<RateCalcType>("flat");
  const [baseRate, setBaseRate] = useState(80);
  const [perExtra, setPerExtra] = useState(20);
  const [minOrder, setMinOrder] = useState(0);
  const [maxOrder, setMaxOrder] = useState(0);
  const [minWeight, setMinWeight] = useState(0);
  const [maxWeight, setMaxWeight] = useState(5);
  const [minDays, setMinDays] = useState(2);
  const [maxDays, setMaxDays] = useState(4);
  const [bizDays, setBizDays] = useState(true);
  const [active, setActive] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const review = () => {
    const parsed = rateSchema.safeParse({ name: name.trim(), zoneId, baseRate, minDays, maxDays });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid rate");
      return;
    }
    if (calcType === "free" && minOrder <= 0) {
      setError(`${t("shMinOrder")} > 0 required for free shipping.`);
      return;
    }
    setError("");
    setConfirm(true);
  };

  const create = () => {
    const id = `sr-${Date.now()}`;
    store.addShippingRate({
      id, name: name.trim(), zoneId, calcType, baseRate,
      perExtra: ["weight", "perItem"].includes(calcType) ? perExtra : 0,
      minOrder: ["free", "price"].includes(calcType) ? minOrder : 0,
      maxOrder: calcType === "price" ? maxOrder : 0,
      minWeight: calcType === "weight" ? minWeight : 0,
      maxWeight: calcType === "weight" ? maxWeight : 0,
      minQty: 0, maxQty: 0, minDays, maxDays,
      businessDays: bizDays, active, updated: "2026-09-26",
    });
    store.notifyVendor(`Shipping rate ${name} created.`, "info");
    setConfirm(false);
    toast.success(t("toastSaved"));
    router.push("/vendor/shipping/rates");
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shCreateRate")} subtitle={t("shSubtitle")}
        highlightLabel={t("shRates")} highlightValue={name || "—"} highlightIcon={Truck}
      >
        <Link href="/vendor/shipping/rates" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("shRates")}
        </Link>
      </AccountingHero>

      <ShipTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shRateName")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <Field label={t("shRateName")}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard Delivery" className="bg-card" maxLength={60} />
              </Field>
              <Field label={t("shZone")}>
                <Select value={zoneId} onValueChange={(v) => setZoneId(v ?? "")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("shCalcType")}>
                <Select value={calcType} onValueChange={(v) => setCalcType((v as RateCalcType) ?? "flat")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIPPING_CONFIG.calcTypes.filter((c) => c !== "zone").map((c) => <SelectItem key={c} value={c}>{CALC_TYPE_LABELS[c as RateCalcType]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`${t("shBaseRate")} (৳)`}>
                <Input type="number" min={0} value={baseRate} onChange={(e) => setBaseRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              {["weight", "perItem"].includes(calcType) ? (
                <Field label={`${t("shExtraRate")} (৳)`}>
                  <Input type="number" min={0} value={perExtra} onChange={(e) => setPerExtra(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                </Field>
              ) : null}
              {["free", "price"].includes(calcType) ? (
                <>
                  <Field label={`${t("shMinOrder")} (৳)`}>
                    <Input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                  </Field>
                  {calcType === "price" ? (
                    <Field label={`${t("shMaxOrder")} (৳, 0 = ∞)`}>
                      <Input type="number" min={0} value={maxOrder} onChange={(e) => setMaxOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                    </Field>
                  ) : null}
                </>
              ) : null}
              {calcType === "weight" ? (
                <>
                  <Field label={`${t("shMinWeight")} (kg)`}>
                    <Input type="number" min={0} value={minWeight} onChange={(e) => setMinWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                  </Field>
                  <Field label={`${t("shMaxWeight")} (kg, 0 = ∞)`}>
                    <Input type="number" min={0} value={maxWeight} onChange={(e) => setMaxWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                  </Field>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shEtaCol")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-3">
              <Field label={t("shMinDays")}>
                <Input type="number" min={0} max={60} value={minDays} onChange={(e) => setMinDays(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("shMaxDays")}>
                <Input type="number" min={0} max={60} value={maxDays} onChange={(e) => setMaxDays(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <Checkbox checked={bizDays} onCheckedChange={(v) => setBizDays(v === true)} aria-label={t("shBizDays")} />
                {t("shBizDays")}
              </label>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-secondary/50 bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shPreview")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 px-4 pb-4 text-sm">
            <p><span className="text-muted-foreground">{t("shOrderAmt")}: </span><span className="font-bold">{money(2500)}</span></p>
            <p><span className="text-muted-foreground">{t("shWeight")}: </span><span className="font-bold">1.8 kg</span></p>
            <div className="mt-1 border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">{t("shMatchMethod")}</p>
              <p className="font-heading text-base font-bold">{name || t("shRateName")}</p>
              <p className="font-heading text-xl font-bold text-secondary">{calcType === "free" ? money(0) : money(baseRate)}</p>
              <p className="text-xs text-muted-foreground">{t("shEtaCol")}: {minDays}–{maxDays} {bizDays ? t("shBizDays") : ""}</p>
            </div>
            <label className="flex items-center gap-2 pt-2 text-sm font-medium">
              <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} aria-label={t("tStatus")} />
              {t("seOn")}
            </label>
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Link href="/vendor/shipping/rates"><Button variant="outline" className="bg-card">{t("cancel")}</Button></Link>
        <Button onClick={review}>{t("shCreateRate")}</Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{name} · {calcType === "free" ? money(0) : money(baseRate)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{zones.find((z) => z.id === zoneId)?.name} · {minDays}–{maxDays}d</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={create}>{t("shCreateRate")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
