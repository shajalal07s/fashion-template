"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { SETTINGS_CONFIG, passwordSchema } from "@/features/vendor/settings";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs } from "@/components/vendor/shipping-settings-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorPasswordPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const rules = useMemo(() => [
    { label: t("seMin8"), ok: next.length >= SETTINGS_CONFIG.passwordMin },
    { label: t("seUpper"), ok: /[A-Z]/.test(next) },
    { label: t("seLower"), ok: /[a-z]/.test(next) },
    { label: t("seNumber"), ok: /[0-9]/.test(next) },
    { label: t("seSpecial"), ok: /[^A-Za-z0-9]/.test(next) },
  ], [next, t]);

  const save = () => {
    const parsed = passwordSchema.safeParse({ current, next, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setError("");
    setCurrent(""); setNext(""); setConfirm("");
    store.notifyVendor("Password changed. Please log in again.", "info");
    toast.success(t("seChanged"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("sePassword")} subtitle={t("seRequirements")}
        highlightLabel={t("sePassword")} highlightValue="••••" highlightIcon={KeyRound}
      />

      <SettingTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("sePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4">
            <Field label={t("seCurrent")}>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} className="bg-card pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Hide" : "Show"}>
                  {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </Field>
            <Field label={t("seNew")}>
              <Input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} className="bg-card" autoComplete="new-password" />
            </Field>
            <Field label={t("seConfirm")}>
              <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-card" autoComplete="new-password" />
            </Field>
            {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}
            <div className="flex gap-2">
              <Button onClick={save} disabled={!current || !next || !confirm}>{t("saveBtn")}</Button>
              <Button variant="link" size="sm" onClick={() => toast.success(t("seSendCode"))}>{t("seForgot")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("seRequirements")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {rules.map((r) => (
              <p key={r.label} className="flex items-center gap-2 text-sm">
                {r.ok ? <Check className="size-4 shrink-0 text-green-600" aria-hidden="true" /> : <X className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <span className={cn(r.ok ? "font-bold text-green-700" : "text-muted-foreground")}>{r.label}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
