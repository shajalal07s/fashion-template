"use client";

import { useTranslations } from "next-intl";
import { Globe, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog, SaveBar } from "@/components/admin/settings/shared";
import { useSettingsStore } from "@/store/settings.store";
import { useState } from "react";
import { toast } from "sonner";

const TIMEZONES = ["Asia/Dhaka", "UTC", "Europe/London", "America/New_York", "Asia/Dubai", "Asia/Kolkata"];
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const TIME_FORMATS = ["12h", "24h"];
const WEEK_STARTS = ["Saturday", "Sunday", "Monday"];
const COUNTRIES = ["Bangladesh", "India", "United States", "United Kingdom", "UAE", "Saudi Arabia"];

function BrandRow({ label, value, onUpload, onRemove }: { label: string; value: string; onUpload: () => void; onRemove: () => void }) {
  const t = useTranslations("Dashboard.settings");
  return (
    <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
      <span className="flex size-10 shrink-0 items-center justify-center bg-muted font-mono text-[10px] text-muted-foreground">
        {value ? <ImageIcon className="size-4 text-secondary" aria-hidden="true" /> : "—"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">{value || "—"}</span>
      </span>
      <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={onUpload}>
        {value ? t("replace") : t("upload")}
      </Button>
      {value ? (
        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={onRemove}>
          {t("remove")}
        </Button>
      ) : null}
    </div>
  );
}

export default function GeneralSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const general = useSettingsStore((s) => s.general);
  const patch = useSettingsStore((s) => s.patchGeneral);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => toast.success(t("toastSaved"));
  const mockUpload = (key: "logo" | "adminLogo" | "favicon" | "loginLogo" | "loginBg") => {
    patch({ [key]: `/images/logo/logo.png` } as Partial<typeof general>);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("gTitle")}
        subtitle={t("gSubtitle")}
        highlightLabel={t("fSiteName")}
        highlightValue={general.siteName}
        highlightIcon={Globe}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secWebsite")}>
          <Field label={t("fSiteName")}>
            <Input value={general.siteName} onChange={(e) => patch({ siteName: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fSiteTitle")}>
            <Input value={general.siteTitle} onChange={(e) => patch({ siteTitle: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fSiteDesc")}>
            <Input value={general.siteDesc} onChange={(e) => patch({ siteDesc: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fSiteUrl")}>
              <Input value={general.siteUrl} onChange={(e) => patch({ siteUrl: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fAdminUrl")}>
              <Input value={general.adminUrl} onChange={(e) => setAdminUrl(e.target.value)} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fAdminName")}>
              <Input value={general.adminName} onChange={(e) => patch({ adminName: e.target.value })} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secBranding")}>
          <BrandRow label={t("fLogo")} value={general.logo} onUpload={() => mockUpload("logo")} onRemove={() => patch({ logo: "" })} />
          <BrandRow label={t("fAdminLogo")} value={general.adminLogo} onUpload={() => mockUpload("adminLogo")} onRemove={() => patch({ adminLogo: "" })} />
          <BrandRow label={t("fFavicon")} value={general.favicon} onUpload={() => mockUpload("favicon")} onRemove={() => patch({ favicon: "" })} />
          <BrandRow label={t("fLoginLogo")} value={general.loginLogo} onUpload={() => mockUpload("loginLogo")} onRemove={() => patch({ loginLogo: "" })} />
          <BrandRow label={t("fLoginBg")} value={general.loginBg} onUpload={() => mockUpload("loginBg")} onRemove={() => patch({ loginBg: "" })} />
        </SectionCard>

        <SectionCard title={t("secRegional")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fCountry")}>
              <Select value={general.country} onValueChange={(v) => patch({ country: v ?? "Bangladesh" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDivision")}>
              <Input value={general.division} onChange={(e) => patch({ division: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fCity")}>
              <Input value={general.city} onChange={(e) => patch({ city: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fPostal")}>
              <Input value={general.postal} onChange={(e) => patch({ postal: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fAddress")}>
              <Input value={general.address} onChange={(e) => patch({ address: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fTimezone")}>
              <Select value={general.timezone} onValueChange={(v) => patch({ timezone: v ?? "Asia/Dhaka" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDateFormat")}>
              <Select value={general.dateFormat} onValueChange={(v) => patch({ dateFormat: v ?? DATE_FORMATS[0] })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fTimeFormat")}>
              <Select value={general.timeFormat} onValueChange={(v) => patch({ timeFormat: v ?? "12h" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMATS.map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fWeekStart")}>
              <Select value={general.weekStart} onValueChange={(v) => patch({ weekStart: v ?? "Saturday" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_STARTS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secContact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fPhone")}>
              <Input value={general.phone} onChange={(e) => patch({ phone: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fPhone2")}>
              <Input value={general.phone2} onChange={(e) => patch({ phone2: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fEmail")}>
              <Input value={general.email} onChange={(e) => patch({ email: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fSupportEmail")}>
              <Input value={general.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fWhatsapp")}>
              <Input value={general.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fContactAddress")}>
              <Input value={general.contactAddress} onChange={(e) => patch({ contactAddress: e.target.value })} className="bg-card" />
            </Field>
          </div>
          {Object.entries(general.socials).map(([network, url]) => (
            <Field key={network} label={network}>
              <Input
                value={url}
                onChange={(e) => patch({ socials: { ...general.socials, [network]: e.target.value } })}
                className="bg-card font-mono text-xs"
                placeholder="https://…"
              />
            </Field>
          ))}
        </SectionCard>
      </div>

      <SaveBar onSave={save} onReset={() => setConfirmReset(true)} />
      <ConfirmDialog
        open={confirmReset}
        title={t("resetBtn")}
        description={t("resetDesc")}
        confirmLabel={t("resetBtn")}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          toast.success(t("toastReset"));
        }}
      />
    </div>
  );

  function setAdminUrl(v: string) {
    patch({ adminUrl: v });
  }
}
