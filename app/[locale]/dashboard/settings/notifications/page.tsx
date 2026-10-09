"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Bell, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import type { NotifyEvent } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNELS = ["email", "dashboard", "push", "sms"] as const;

export default function NotificationSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const notifications = useSettingsStore((s) => s.notifications);
  const patch = useSettingsStore((s) => s.patchNotify);

  const [query, setQuery] = useState("");
  const [emailAll, setEmailAll] = useState(true);
  const [dashboardAll, setDashboardAll] = useState(true);
  const [pushAll, setPushAll] = useState(false);
  const [smsAll, setSmsAll] = useState(false);

  const save = () => toast.success(t("toastSaved"));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => n.event.toLowerCase().includes(q));
  }, [notifications, query]);

  const toggleChannel = (id: string, channel: (typeof CHANNELS)[number]) => {
    const ev = notifications.find((n) => n.id === id);
    if (ev) patch(id, { [channel]: !ev[channel] } as Partial<NotifyEvent>);
  };

  const channelLabel = (c: (typeof CHANNELS)[number]) =>
    c === "email" ? t("chEmail") : c === "dashboard" ? t("chDashboard") : c === "push" ? t("chPush") : t("chSms");

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("ntTitle")}
        subtitle={t("ntSubtitle")}
        highlightLabel={t("secEvents")}
        highlightValue={String(notifications.filter((n) => n.status === "active").length)}
        highlightIcon={Bell}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SettingToggle label={t("chEmail")} checked={emailAll} onChange={setEmailAll} />
        <SettingToggle label={t("chDashboard")} checked={dashboardAll} onChange={setDashboardAll} />
        <SettingToggle label={t("chPush")} hint="Visual only" checked={pushAll} onChange={setPushAll} />
        <SettingToggle label={t("chSms")} hint="Visual only" checked={smsAll} onChange={setSmsAll} />
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("tEvent")}</TableHead>
                <TableHead className="text-center">{t("tAdmin")}</TableHead>
                <TableHead className="text-center">{t("tVendor")}</TableHead>
                <TableHead className="text-center">{t("tCustomer")}</TableHead>
                {CHANNELS.map((c) => (
                  <TableHead key={c} className="text-center">{channelLabel(c)}</TableHead>
                ))}
                <TableHead>{t("tStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => (
                <TableRow key={n.id} className={cn(n.status !== "active" && "opacity-60")}>
                  <TableCell className="text-sm font-semibold whitespace-nowrap">{n.event}</TableCell>
                  {([
                    ["admin", n.admin],
                    ["vendor", n.vendor],
                    ["customer", n.customer],
                  ] as const).map(([role, on]) => (
                    <TableCell key={role} className="text-center">
                      {on ? (
                        <Check className="mx-auto size-4 text-green-600" aria-hidden="true" />
                      ) : (
                        <X className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </TableCell>
                  ))}
                  {CHANNELS.map((c) => (
                    <TableCell key={c} className="text-center">
                      <Checkbox
                        checked={n[c]}
                        disabled={n.status !== "active"}
                        onCheckedChange={() => toggleChannel(n.id, c)}
                        aria-label={`${n.event} ${channelLabel(c)}`}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        patch(n.id, { status: n.status === "active" ? "inactive" : "active" });
                        toast.success(t("toastUpdated"));
                      }}
                    >
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold", n.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(n.status)}
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SaveBar onSave={save} />
    </div>
  );
}
