"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Power, Save, Store } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { SETTINGS_CONFIG } from "@/features/vendor/settings";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs, Toggle } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorAccountStoreSettingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const s = store.accountStoreSettings;

  const [accept, setAccept] = useState(s.acceptOrders);
  const [confirmStop, setConfirmStop] = useState(false);
  const [vacation, setVacation] = useState(s.vacation);
  const [vacStart, setVacStart] = useState(s.vacStart);
  const [vacEnd, setVacEnd] = useState(s.vacEnd);
  const [vacMsg, setVacMsg] = useState(s.vacMessage);
  const [storeVisible, setStoreVisible] = useState(s.storeVisible);
  const [productsVisible, setProductsVisible] = useState(s.productsVisible);
  const [reviewsVisible, setReviewsVisible] = useState(s.reviewsVisible);
  const [contactVisible, setContactVisible] = useState(s.contactVisible);
  const [addressVisible, setAddressVisible] = useState(s.addressVisible);
  const [minOrder, setMinOrder] = useState(s.minOrder);
  const [maxOrder, setMaxOrder] = useState(s.maxOrder);
  const [currency, setCurrency] = useState(s.currency);
  const [timezone, setTimezone] = useState(s.timezone);
  const [language, setLanguage] = useState(s.language);

  const save = () => {
    if (vacation && vacStart > vacEnd) {
      toast.error("Vacation start must be before end.");
      return;
    }
    store.patchAccountStoreSettings({
      acceptOrders: accept, vacation, vacStart, vacEnd, vacMessage: vacMsg,
      storeVisible, productsVisible, reviewsVisible, contactVisible, addressVisible,
      minOrder, maxOrder, currency, timezone, language,
    });
    store.setStoreStatus(vacation ? "vacation" : accept ? "open" : "closed");
    store.notifyVendor(vacation ? "Vacation mode enabled." : "Store settings changed.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("seStore")} subtitle={t("seSubtitle")}
        highlightLabel={t("seStore")} highlightValue={vacation ? t("seVacation") : accept ? t("seOn") : t("seOff")} highlightIcon={Store}
      />

      <SettingTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("seAcceptOrders")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3 px-4 pb-4">
              <Toggle
                checked={accept}
                onChange={(v) => {
                  if (!v) setConfirmStop(true);
                  else setAccept(true);
                }}
                label={t("seAcceptOrders")}
              />
              <p className="text-sm font-semibold">{accept ? t("seOn") : t("seOff")}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
              <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
                <Power className="size-4 text-secondary" aria-hidden="true" />
                {t("seVacation")}
              </CardTitle>
              <Toggle checked={vacation} onChange={setVacation} label={t("seVacation")} />
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <Field label={t("seVacStart")}><Input type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)} className="bg-card" disabled={!vacation} /></Field>
              <Field label={t("seVacEnd")}><Input type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)} className="bg-card" disabled={!vacation} /></Field>
              <div className="sm:col-span-2">
                <Field label={t("seVacMsg")}><Textarea value={vacMsg} onChange={(e) => setVacMsg(e.target.value)} rows={2} className="bg-card" maxLength={200} disabled={!vacation} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("seStore")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4">
              {[
                { label: t("seStoreVisible"), v: storeVisible, set: setStoreVisible },
                { label: t("seProductsVisible"), v: productsVisible, set: setProductsVisible },
                { label: t("seReviewsVisible"), v: reviewsVisible, set: setReviewsVisible },
                { label: t("seContactVisible"), v: contactVisible, set: setContactVisible },
                { label: t("seAddrVisible"), v: addressVisible, set: setAddressVisible },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border border-border p-2.5">
                  <span className="text-sm font-semibold">{row.label}</span>
                  <Toggle checked={row.v} onChange={row.set} label={row.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("seStore")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <Field label={`${t("seMinOrder")} (৳)`}>
              <Input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={`${t("seMaxOrder")} (৳, 0 = ∞)`}>
              <Input type="number" min={0} value={maxOrder} onChange={(e) => setMaxOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("seCurrency")}>
              <Select value={currency} onValueChange={(v) => setCurrency(v ?? "BDT")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BDT", "USD", "INR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("seTimezone")}>
              <Select value={timezone} onValueChange={(v) => setTimezone(v ?? "Asia/Dhaka")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SETTINGS_CONFIG.timezones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("seLanguage")}>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "English")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SETTINGS_CONFIG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="bg-card" onClick={() => window.location.reload()}>{t("eReset")}</Button>
        <Button onClick={save}>
          <Save className="size-4" aria-hidden="true" />
          {t("saveBtn")}
        </Button>
      </div>

      <Dialog open={confirmStop} onOpenChange={setConfirmStop}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("seStopOrders")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("seStopDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmStop(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={() => { setAccept(false); setConfirmStop(false); }}>{t("seOff")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
