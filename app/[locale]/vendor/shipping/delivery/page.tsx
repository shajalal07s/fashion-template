"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PackageCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { SHIPPING_CONFIG } from "@/features/vendor/shipping";
import { useVendorStore } from "@/store/vendor.store";
import { ShipTabs, Toggle } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorDeliverySettingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const d = store.deliverySettings;

  const [procMin, setProcMin] = useState(d.procMin);
  const [procMax, setProcMax] = useState(d.procMax);
  const [shipMin, setShipMin] = useState(d.shipMin);
  const [shipMax, setShipMax] = useState(d.shipMax);
  const [weekday, setWeekday] = useState(d.weekday);
  const [weekend, setWeekend] = useState(d.weekend);
  const [holiday, setHoliday] = useState(d.holiday);
  const [sameCut, setSameCut] = useState(d.sameDayCutoff);
  const [procCut, setProcCut] = useState(d.processCutoff);
  const [pickup, setPickup] = useState(d.pickupEnabled);
  const [pickupAddr, setPickupAddr] = useState(d.pickupAddress);
  const [pickupInstr, setPickupInstr] = useState(d.pickupInstructions);
  const [pickupHours, setPickupHours] = useState(d.pickupHours);
  const [pickupContact, setPickupContact] = useState(d.pickupContact);
  const [pickupPhone, setPickupPhone] = useState(d.pickupPhone);
  const [custNotes, setCustNotes] = useState(d.customerNotes);
  const [handling, setHandling] = useState(d.handlingNotes);
  const [maxW, setMaxW] = useState(d.maxOrderWeight);
  const [cod, setCod] = useState(d.codRestricted);

  const save = () => {
    if (procMin > procMax || shipMin > shipMax) {
      toast.error("Min days must be ≤ max days.");
      return;
    }
    store.patchDeliverySettings({
      procMin, procMax, shipMin, shipMax, weekday, weekend, holiday,
      sameDayCutoff: sameCut, processCutoff: procCut, pickupEnabled: pickup,
      pickupAddress: pickupAddr, pickupInstructions: pickupInstr, pickupHours,
      pickupContact, pickupPhone, customerNotes: custNotes, handlingNotes: handling,
      maxOrderWeight: maxW, codRestricted: cod,
    });
    store.notifyVendor("Delivery settings updated.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shDelivery")}
        subtitle={`${t("shTotalEta")}: ${procMin + shipMin}–${procMax + shipMax}d`}
        highlightLabel={t("shTotalEta")} highlightValue={`${procMin + shipMin}–${procMax + shipMax}d`} highlightIcon={PackageCheck}
      />

      <ShipTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shProc")} + {t("shShip")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 px-4 pb-4">
              <Field label={`${t("shProc")} min`}><Input type="number" min={0} value={procMin} onChange={(e) => setProcMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={`${t("shProc")} max`}><Input type="number" min={0} value={procMax} onChange={(e) => setProcMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={`${t("shShip")} min`}><Input type="number" min={0} value={shipMin} onChange={(e) => setShipMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={`${t("shShip")} max`}><Input type="number" min={0} value={shipMax} onChange={(e) => setShipMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <div className="col-span-2 border border-secondary/40 bg-secondary/5 p-3 text-center">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("shTotalEta")}</p>
                <p className="font-heading text-2xl font-bold text-secondary">{procMin + shipMin}–{procMax + shipMax} Days</p>
              </div>
              <Field label={t("shSameDayCutoff")}><Input type="time" value={sameCut} onChange={(e) => setSameCut(e.target.value)} className="bg-card" /></Field>
              <Field label={t("shProcessCutoff")}><Input type="time" value={procCut} onChange={(e) => setProcCut(e.target.value)} className="bg-card" /></Field>
              <p className="col-span-2 text-xs text-muted-foreground">{t("shAfterCutoff")}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shOptions")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4">
              {SHIPPING_CONFIG.methods.map((m) => (
                <div key={m} className="flex items-center justify-between border border-border p-2.5 text-sm">
                  <span className="font-semibold">{m}</span>
                  <span className="bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary">{t("seOn")}</span>
                </div>
              ))}
              {[
                { label: t("shWeekday"), v: weekday, set: setWeekday },
                { label: t("shWeekend"), v: weekend, set: setWeekend },
                { label: t("shHoliday"), v: holiday, set: setHoliday },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border border-border p-2.5">
                  <span className="text-sm font-semibold">{row.label}</span>
                  <Toggle checked={row.v} onChange={row.set} label={row.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shPickup")}</CardTitle>
              <Toggle checked={pickup} onChange={setPickup} label={t("shPickup")} />
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={t("shPickupAddr")}><Input value={pickupAddr} onChange={(e) => setPickupAddr(e.target.value)} className="bg-card" disabled={!pickup} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t("shPickupInstr")}><Textarea value={pickupInstr} onChange={(e) => setPickupInstr(e.target.value)} rows={2} className="bg-card" disabled={!pickup} /></Field>
              </div>
              <Field label={t("shPickupHours")}><Input value={pickupHours} onChange={(e) => setPickupHours(e.target.value)} className="bg-card" disabled={!pickup} /></Field>
              <Field label={t("shPickupContact")}><Input value={pickupContact} onChange={(e) => setPickupContact(e.target.value)} className="bg-card" disabled={!pickup} /></Field>
              <Field label={t("shPickupPhone")}><Input value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} className="bg-card" disabled={!pickup} /></Field>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shHandling")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-4 pb-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={custNotes} onCheckedChange={(v) => setCustNotes(v === true)} aria-label={t("shCustNotes")} />
                {t("shCustNotes")}
              </label>
              <Field label={t("shHandling")}>
                <Textarea value={handling} onChange={(e) => setHandling(e.target.value)} rows={2} className="bg-card" maxLength={300} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`${t("shMaxWeight2")} (kg)`}>
                  <Input type="number" min={0} max={SHIPPING_CONFIG.maxWeight} value={maxW} onChange={(e) => setMaxW(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                  <Checkbox checked={cod} onCheckedChange={(v) => setCod(v === true)} aria-label={t("shCodRestr")} />
                  {t("shCodRestr")}
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="bg-card" onClick={() => window.location.reload()}>{t("eReset")}</Button>
        <Button onClick={save}>
          <Save className="size-4" aria-hidden="true" />
          {t("saveBtn")}
        </Button>
      </div>
    </div>
  );
}
