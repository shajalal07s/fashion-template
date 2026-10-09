"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { BadgeCheck, ImagePlus, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SETTINGS_CONFIG, profileSchema } from "@/features/vendor/settings";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorAccountProfilePage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const saved = store.accountProfile;
  const fileRef = useRef<HTMLInputElement>(null);

  const [first, setFirst] = useState(saved.firstName);
  const [last, setLast] = useState(saved.lastName);
  const [display, setDisplay] = useState(saved.displayName);
  const [email, setEmail] = useState(saved.email);
  const [phone, setPhone] = useState(saved.phone);
  const [photo, setPhoto] = useState(saved.photo);
  const [language, setLanguage] = useState(saved.language);
  const [timezone, setTimezone] = useState(saved.timezone);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!SETTINGS_CONFIG.avatarTypes.includes(file.type as "image/png")) {
      toast.error("Use PNG, JPG or WebP.");
      return;
    }
    if (file.size > SETTINGS_CONFIG.avatarMaxMb * 1024 * 1024) {
      toast.error(`Max ${SETTINGS_CONFIG.avatarMaxMb}MB.`);
      return;
    }
    setPhoto(URL.createObjectURL(file));
  };

  const save = () => {
    const parsed = profileSchema.safeParse({ firstName: first.trim(), lastName: last.trim(), displayName: display.trim(), email: email.trim(), phone: phone.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid profile");
      return;
    }
    setError("");
    store.patchAccountProfile({
      firstName: first.trim(), lastName: last.trim(), displayName: display.trim(),
      email: email.trim(), phone: phone.trim(), photo, language, timezone,
      emailVerified: email.trim() === saved.email ? saved.emailVerified : false,
      phoneVerified: phone.trim() === saved.phone ? saved.phoneVerified : saved.phoneVerified,
    });
    store.notifyVendor("Vendor profile updated.", "info");
    toast.success(t("toastSaved"));
  };

  const verifyPhone = () => {
    if (!otpSent) {
      setOtpSent(true);
      toast.success(t("seSendCode"));
      return;
    }
    if (otp.trim().length >= 4) {
      store.patchAccountProfile({ phoneVerified: true, phone: phone.trim() });
      setOtpSent(false);
      setOtp("");
      toast.success(t("seVerify"));
    } else {
      toast.error(t("errRequired"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("seProfile")} subtitle={saved.email}
        highlightLabel={t("seProfile")} highlightValue={saved.displayName} highlightIcon={User}
      />

      <SettingTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("sePhoto")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 px-4 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={display} className="size-28 border border-border object-cover" />
            <input ref={fileRef} type="file" accept={SETTINGS_CONFIG.avatarTypes.join(",")} className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} aria-label={t("sePhoto")} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-card" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-3.5" aria-hidden="true" />
                {t("smReplace")}
              </Button>
              <Button size="sm" variant="outline" className="bg-card" onClick={() => setPhoto("/images/women/women-1.jpg")}>{t("eReset")}</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">PNG/JPG/WebP · max {SETTINGS_CONFIG.avatarMaxMb}MB</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("seProfile")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <Field label={t("seFirstName")}><Input value={first} onChange={(e) => setFirst(e.target.value)} className="bg-card" maxLength={40} /></Field>
            <Field label={t("seLastName")}><Input value={last} onChange={(e) => setLast(e.target.value)} className="bg-card" maxLength={40} /></Field>
            <Field label={t("seDisplay")}><Input value={display} onChange={(e) => setDisplay(e.target.value)} className="bg-card" maxLength={60} /></Field>
            <Field label={t("seLanguage")}>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "English")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SETTINGS_CONFIG.languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
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
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <Field label={`${t("seEmail")} ${saved.emailVerified && email === saved.email ? "✓" : ""}`}>
                <div className="flex gap-1.5">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card" />
                  {email !== saved.email ? (
                    <Button variant="outline" size="sm" className="h-9 shrink-0 bg-card" onClick={() => toast.success(t("seSendCode"))}>
                      <Send className="size-3.5" aria-hidden="true" />
                      {t("seVerify")}
                    </Button>
                  ) : null}
                </div>
              </Field>
              <Field label={`${t("sePhone")} ${saved.phoneVerified ? "✓" : ""}`}>
                <div className="flex gap-1.5">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card" maxLength={20} />
                  <Button variant="outline" size="sm" className="h-9 shrink-0 bg-card" onClick={verifyPhone}>
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    {t("seVerify")}
                  </Button>
                </div>
              </Field>
            </div>
            {otpSent ? (
              <div className="sm:col-span-2">
                <Field label="OTP">
                  <div className="flex gap-1.5">
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="4-digit code" inputMode="numeric" className="bg-card" maxLength={6} />
                    <Button size="sm" className="h-9 shrink-0" onClick={verifyPhone}>{t("seVerify")}</Button>
                  </div>
                </Field>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="bg-card" onClick={() => window.location.reload()}>{t("cancel")}</Button>
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
