"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { ConfirmDialog, SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import { useSettingsStore } from "@/store/settings.store";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const security = useSettingsStore((s) => s.security);
  const patch = useSettingsStore((s) => s.patchSecurity);
  const [confirm2fa, setConfirm2fa] = useState(false);

  const save = () => toast.success(t("toastSaved"));

  const policySummary = [
    `Min ${security.minLength} chars`,
    security.requireUpper ? "A-Z" : null,
    security.requireLower ? "a-z" : null,
    security.requireNumber ? "0-9" : null,
    security.requireSpecial ? "!@#" : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("scTitle")}
        subtitle={t("scSubtitle")}
        highlightLabel={t("f2fa")}
        highlightValue={security.twoFactor ? t("on") : t("off")}
        highlightIcon={ShieldCheck}
      />

      <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#8a5a00]" aria-hidden="true" />
        <p className="text-muted-foreground">{t("secWarning")}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secAccount")}>
          <div className="flex flex-col gap-2">
            <SettingToggle label={t("f2fa")} checked={security.twoFactor} onChange={(v) => (v ? setConfirm2fa(true) : patch({ twoFactor: false }))} />
            <SettingToggle label={t("fStrongPwd")} checked={security.strongPassword} onChange={(v) => patch({ strongPassword: v })} />
            <SettingToggle label={t("fRemember")} checked={security.rememberMe} onChange={(v) => patch({ rememberMe: v })} />
            <SettingToggle label={t("fLoginNotify")} checked={security.loginNotify} onChange={(v) => patch({ loginNotify: v })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("fAttempts")}>
              <Input type="number" min={1} value={security.attemptLimit} onChange={(e) => patch({ attemptLimit: Math.max(1, Number(e.target.value) || 5) })} className="bg-card" />
            </Field>
            <Field label={t("fSession")}>
              <Input type="number" min={5} value={security.sessionTimeout} onChange={(e) => patch({ sessionTimeout: Math.max(5, Number(e.target.value) || 60) })} className="bg-card" />
            </Field>
            <Field label={t("fPwdExpiry")}>
              <Input type="number" min={0} value={security.passwordExpiry} onChange={(e) => patch({ passwordExpiry: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secPassword")}>
          <Field label={t("fMinLength")}>
            <Input type="number" min={4} value={security.minLength} onChange={(e) => patch({ minLength: Math.max(4, Number(e.target.value) || 8) })} className="bg-card" />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <SettingToggle label={t("fUpper")} checked={security.requireUpper} onChange={(v) => patch({ requireUpper: v })} />
            <SettingToggle label={t("fLower")} checked={security.requireLower} onChange={(v) => patch({ requireLower: v })} />
            <SettingToggle label={t("fNumber")} checked={security.requireNumber} onChange={(v) => patch({ requireNumber: v })} />
            <SettingToggle label={t("fSpecial")} checked={security.requireSpecial} onChange={(v) => patch({ requireSpecial: v })} />
          </div>
          <Field label={t("fHistory")}>
            <Input type="number" min={0} value={security.historyCount} onChange={(e) => patch({ historyCount: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
          </Field>
          <div className="border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Policy</p>
            <p className="font-mono text-sm font-bold text-secondary">{policySummary.join(" · ")}</p>
          </div>
        </SectionCard>

        <SectionCard title={t("secSession")}>
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("fIdle")}>
              <Input type="number" min={1} value={security.idleTimeout} onChange={(e) => patch({ idleTimeout: Math.max(1, Number(e.target.value) || 15) })} className="bg-card" />
            </Field>
            <Field label={t("fMaxSessions")}>
              <Input type="number" min={1} value={security.maxSessions} onChange={(e) => patch({ maxSessions: Math.max(1, Number(e.target.value) || 3) })} className="bg-card" />
            </Field>
            <Field label={t("fRememberDays")}>
              <Input type="number" min={0} value={security.rememberDays} onChange={(e) => patch({ rememberDays: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" disabled={!security.rememberMe} />
            </Field>
          </div>
          <Button variant="outline" size="sm" className="w-fit bg-card" onClick={() => toast.success(t("toastSaved"))}>
            {t("viewTitle")}
          </Button>
        </SectionCard>
      </div>

      <SaveBar onSave={save} />

      <ConfirmDialog
        open={confirm2fa}
        title={t("f2fa")}
        description={t("secWarning")}
        confirmLabel={t("confirmBtn")}
        onClose={() => setConfirm2fa(false)}
        onConfirm={() => {
          patch({ twoFactor: true });
          setConfirm2fa(false);
          toast.success(t("toastSaved"));
        }}
      />
    </div>
  );
}
