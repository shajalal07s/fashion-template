"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { useStoreContact, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

export default function VendorStoreContactPage() {
  const t = useTranslations("Dashboard.Vendor");
  const saved = useStoreContact();
  const store = useVendorStore();

  const [biz, setBiz] = useState(saved.businessEmail);
  const [support, setSupport] = useState(saved.supportEmail);
  const [phone, setPhone] = useState(saved.phone);
  const [alt, setAlt] = useState(saved.altPhone);
  const [wa, setWa] = useState(saved.whatsapp);
  const [showEmail, setShowEmail] = useState(saved.showEmail);
  const [showPhone, setShowPhone] = useState(saved.showPhone);
  const [showWa, setShowWa] = useState(saved.showWhatsapp);
  const [showAlt, setShowAlt] = useState(saved.showAltPhone);
  const [hours, setHours] = useState(saved.hours);

  const save = () => {
    if (!biz.includes("@") || !support.includes("@") || phone.trim().length < 6) {
      toast.error(t("errRequired"));
      return;
    }
    store.patchStoreContact({
      businessEmail: biz.trim(), supportEmail: support.trim(), phone: phone.trim(),
      altPhone: alt.trim(), whatsapp: wa.trim(),
      showEmail, showPhone, showWhatsapp: showWa, showAltPhone: showAlt, hours,
    });
    store.logStoreActivity("Store contact updated");
    store.notifyVendor("Store contact updated.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smContact")} subtitle={biz}
        highlightLabel={t("smContact")} highlightValue={phone} highlightIcon={Mail}
      />

      <StoreTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("smContact")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <Field label={t("smBizEmail")}><Input type="email" value={biz} onChange={(e) => setBiz(e.target.value)} className="bg-card" /></Field>
            <Field label={t("smSupportEmail")}><Input type="email" value={support} onChange={(e) => setSupport(e.target.value)} className="bg-card" /></Field>
            <Field label={t("smPhone")}><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card" /></Field>
            <Field label={t("smAltPhone")}><Input value={alt} onChange={(e) => setAlt(e.target.value)} className="bg-card" /></Field>
            <div className="sm:col-span-2">
              <Field label={t("smWhatsapp")}><Input value={wa} onChange={(e) => setWa(e.target.value)} className="bg-card" /></Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("smContact")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4 text-sm">
              {[
                { label: t("smShowEmail"), v: showEmail, set: setShowEmail },
                { label: t("smShowPhone"), v: showPhone, set: setShowPhone },
                { label: t("smShowWhatsapp"), v: showWa, set: setShowWa },
                { label: t("smShowAlt"), v: showAlt, set: setShowAlt },
              ].map((row) => (
                <label key={row.label} className="flex cursor-pointer items-center gap-2 border border-border p-2.5 transition-colors hover:border-secondary">
                  <Checkbox checked={row.v} onCheckedChange={(v) => row.set(v === true)} aria-label={row.label} />
                  <span className="font-medium">{row.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
              <Clock className="size-4 text-secondary" aria-hidden="true" />
              <CardTitle className="font-heading text-base font-bold">{t("smHours")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4">
              {hours.map((h, i) => (
                <div key={h.day} className="flex flex-wrap items-center gap-2 border border-border p-2 text-sm">
                  <span className="w-24 shrink-0 font-bold">{h.day}</span>
                  <Select value={h.open ? "open" : "closed"} onValueChange={(v) => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, open: v === "open" } : x)))}>
                    <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label={h.day}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t("smOpen")}</SelectItem>
                      <SelectItem value="closed">{t("smClosed")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {h.open ? (
                    <>
                      <Input type="time" value={h.from} onChange={(e) => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, from: e.target.value } : x)))} className="h-8 w-28 bg-card" aria-label={`${h.day} from`} />
                      <span className="text-muted-foreground">—</span>
                      <Input type="time" value={h.to} onChange={(e) => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, to: e.target.value } : x)))} className="h-8 w-28 bg-card" aria-label={`${h.day} to`} />
                    </>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{t("smClosed")}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
