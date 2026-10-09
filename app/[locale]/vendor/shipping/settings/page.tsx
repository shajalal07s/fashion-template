"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Save, Settings } from "lucide-react";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { SHIPPING_CONFIG, shippingSettingsSchema } from "@/features/vendor/shipping";
import { useStoreAddresses, useVendorStore } from "@/store/vendor.store";
import { ShipTabs, Toggle } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorShippingSettingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const addresses = useStoreAddresses();
  const s = store.shippingSettings;

  const [enabled, setEnabled] = useState(s.enabled);
  const [confirmOff, setConfirmOff] = useState(false);
  const [country, setCountry] = useState(s.origin.country);
  const [division, setDivision] = useState(s.origin.division);
  const [city, setCity] = useState(s.origin.city);
  const [area, setArea] = useState(s.origin.area);
  const [postal, setPostal] = useState(s.origin.postal);
  const [address, setAddress] = useState(s.origin.address);
  const [cName, setCName] = useState(s.origin.contactName);
  const [cPhone, setCPhone] = useState(s.origin.contactPhone);
  const [minP, setMinP] = useState(s.minProcessDays);
  const [maxP, setMaxP] = useState(s.maxProcessDays);
  const [sameDay, setSameDay] = useState(s.sameDay);
  const [weekend, setWeekend] = useState(s.weekendProcessing);
  const [holiday, setHoliday] = useState(s.holidayProcessing);
  const [calcMode, setCalcMode] = useState(s.calcMode);
  const [weight, setWeight] = useState(s.defaultWeight);
  const [len, setLen] = useState(s.defaultLength);
  const [wid, setWid] = useState(s.defaultWidth);
  const [hei, setHei] = useState(s.defaultHeight);
  const [error, setError] = useState("");

  const dirty =
    enabled !== s.enabled || country !== s.origin.country || division !== s.origin.division ||
    city !== s.origin.city || area !== s.origin.area || postal !== s.origin.postal ||
    address !== s.origin.address || cName !== s.origin.contactName || cPhone !== s.origin.contactPhone ||
    minP !== s.minProcessDays || maxP !== s.maxProcessDays || sameDay !== s.sameDay ||
    weekend !== s.weekendProcessing || holiday !== s.holidayProcessing || calcMode !== s.calcMode ||
    weight !== s.defaultWeight || len !== s.defaultLength || wid !== s.defaultWidth || hei !== s.defaultHeight;

  const useStoreAddr = () => {
    const a = addresses.find((x) => x.isDefault) ?? addresses[0];
    if (!a) {
      toast.error(t("emptyDescription"));
      return;
    }
    setCountry(a.country); setDivision(a.division); setCity(a.city);
    setArea(a.area); setPostal(a.postal); setAddress(a.line1);
  };

  const save = () => {
    const parsed = shippingSettingsSchema.safeParse({
      minProcessDays: minP, maxProcessDays: maxP,
      defaultWeight: weight, defaultLength: len, defaultWidth: wid, defaultHeight: hei,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid settings");
      return;
    }
    if (!city.trim() || !cPhone.trim()) {
      setError(t("errRequired"));
      return;
    }
    setError("");
    store.patchShippingSettings({
      enabled,
      origin: { country, division, city, area, postal, address, contactName: cName, contactPhone: cPhone },
      minProcessDays: minP, maxProcessDays: maxP, sameDay,
      weekendProcessing: weekend, holidayProcessing: holiday, calcMode,
      defaultWeight: weight, defaultLength: len, defaultWidth: wid, defaultHeight: hei,
    });
    store.notifyVendor("Shipping settings updated.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shSettings")} subtitle={t("shSubtitle")}
        highlightLabel={t("shStatus")} highlightValue={s.enabled ? t("seOn") : t("seOff")} highlightIcon={Settings}
      />

      <ShipTabs />
      {dirty ? <p className="border border-secondary/50 bg-secondary/10 p-2.5 text-sm font-semibold text-secondary" role="alert">{t("smUnsaved")}</p> : null}

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("shEnabled")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 px-4 pb-4">
          <Toggle
            checked={enabled}
            onChange={(v) => {
              if (!v && s.enabled) setConfirmOff(true);
              else setEnabled(v);
            }}
            label={t("shEnabled")}
          />
          <p className="text-sm text-muted-foreground">{t("shEnabledDesc")}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shOrigin")}</CardTitle>
            <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={useStoreAddr}>
              {t("shUseStore")}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <Field label={t("shCountry")}><Input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shDivision")}><Input value={division} onChange={(e) => setDivision(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shCity")}><Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shArea")}><Input value={area} onChange={(e) => setArea(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shPostal")}><Input value={postal} onChange={(e) => setPostal(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shAddress")}><Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shContactName")}><Input value={cName} onChange={(e) => setCName(e.target.value)} className="bg-card" /></Field>
            <Field label={t("shContactPhone")}><Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="bg-card" /></Field>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shProcTime")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("shMinDays")}><Input type="number" min={0} max={30} value={minP} onChange={(e) => setMinP(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
                <Field label={t("shMaxDays")}><Input type="number" min={0} max={30} value={maxP} onChange={(e) => setMaxP(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              </div>
              {[
                { label: t("shSameDay"), v: sameDay, set: setSameDay },
                { label: t("shWeekendProc"), v: weekend, set: setWeekend },
                { label: t("shHolidayProc"), v: holiday, set: setHoliday },
              ].map((row) => (
                <label key={row.label} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox checked={row.v} onCheckedChange={(v) => row.set(v === true)} aria-label={row.label} />
                  {row.label}
                </label>
              ))}
              <Field label={t("shCalc")}>
                <Select value={calcMode} onValueChange={(v) => setCalcMode(v ?? "Zone Based")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Flat Rate", "Per Item", "Weight Based", "Price Based", "Free Shipping", "Zone Based"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shPkg")} ({SHIPPING_CONFIG.weightUnit} · {SHIPPING_CONFIG.dimUnit})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 px-4 pb-4">
              <Field label={t("shWeight")}><Input type="number" min={0} value={weight} onChange={(e) => setWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={t("shLength")}><Input type="number" min={0} value={len} onChange={(e) => setLen(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={t("shWidth")}><Input type="number" min={0} value={wid} onChange={(e) => setWid(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={t("shHeight")}><Input type="number" min={0} value={hei} onChange={(e) => setHei(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
            </CardContent>
          </Card>
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="bg-card" onClick={() => window.location.reload()}>{t("eReset")}</Button>
        <Button onClick={save} disabled={!dirty}>
          <Save className="size-4" aria-hidden="true" />
          {t("saveBtn")}
        </Button>
      </div>

      <Dialog open={confirmOff} onOpenChange={setConfirmOff}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("shDisableConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOff(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={() => { setEnabled(false); setConfirmOff(false); }}>{t("seOff")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
