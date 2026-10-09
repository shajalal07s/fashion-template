"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneCall, Save } from "lucide-react";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DEFAULT_CALL_SETTINGS,
  loadCallSettings,
  saveCallSettings,
  type CallSettings,
} from "@/features/admin/calls";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CallSettingsPage() {
  const t = useTranslations("Dashboard.calls");
  const [settings, setSettings] = useState<CallSettings>(() => loadCallSettings());

  const set = <K extends keyof CallSettings>(key: K, value: CallSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    saveCallSettings(settings);
    toast.success(t("toastSaved"));
  };

  const label = "text-xs font-bold tracking-wider text-muted-foreground uppercase";

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("settingsTitle")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={save}>
            <Save className="size-3.5" aria-hidden="true" />
            {t("settings.save")}
          </Button>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card pt-5 pb-5">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <PhoneCall className="size-4 text-secondary" aria-hidden="true" />
            <CardTitle className="font-heading text-lg font-bold">{t("settingsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{t("settings.enableLabel")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.enableHint")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.enabled}
                onClick={() => set("enabled", !settings.enabled)}
                className={cn(
                  "relative h-6 w-11 shrink-0 border transition-colors",
                  settings.enabled ? "border-secondary bg-secondary" : "border-border bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 bg-white shadow transition-all",
                    settings.enabled ? "left-[22px]" : "left-0.5"
                  )}
                />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>{t("settings.concurrentLabel")}</span>
                <Select
                  value={String(settings.concurrentCalls)}
                  onValueChange={(v) => set("concurrentCalls", Number(v) || 1)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 8, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>{t("settings.retryLabel")}</span>
                <Select
                  value={String(settings.retryAttempts)}
                  onValueChange={(v) => set("retryAttempts", Number(v) || 0)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>{t("settings.hoursLabel")}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={settings.workStart}
                  onChange={(e) => set("workStart", e.target.value)}
                  className="bg-card"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={settings.workEnd}
                  onChange={(e) => set("workEnd", e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>{t("settings.callerLabel")}</span>
              <Input
                value={settings.callerId}
                onChange={(e) => set("callerId", e.target.value)}
                className="bg-card font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card pt-5 pb-5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg font-bold">{t("recTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border bg-card px-4 py-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{t("settings.recordLabel")}</span>
                <span className="text-xs text-muted-foreground">{t("settings.recordHint")}</span>
              </span>
              <Checkbox
                checked={settings.recordCalls}
                onCheckedChange={(v) => set("recordCalls", v === true)}
                aria-label={t("settings.recordLabel")}
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              className="w-fit bg-card"
              onClick={() => setSettings(DEFAULT_CALL_SETTINGS)}
            >
              {t("settings.reset")}
            </Button>
            <Button className="w-full gap-1.5" onClick={save}>
              <Save className="size-4" aria-hidden="true" />
              {t("settings.save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
