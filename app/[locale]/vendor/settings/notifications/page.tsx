"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { SETTINGS_CONFIG, type NotifyPref } from "@/features/vendor/settings";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs, Toggle } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorNotificationSettingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const saved = store.notifyPrefs;

  const [draft, setDraft] = useState<NotifyPref[]>(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const groups = useMemo(() => {
    const map = new Map<string, NotifyPref[]>();
    for (const p of draft) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    return [...map.entries()];
  }, [draft]);

  const set = (key: string, p: Partial<NotifyPref>) =>
    setDraft((prev) => prev.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const save = () => {
    for (const p of draft) store.patchNotifyPref(p.key, p);
    store.notifyVendor("Notification preferences changed.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("seNotif")} subtitle={`${draft.length} · ${t("seSubtitle")}`}
        highlightLabel={t("seNotif")} highlightValue={String(draft.filter((p) => p.inApp).length)} highlightIcon={Bell}
      />

      <SettingTabs />
      {dirty ? <p className="border border-secondary/50 bg-secondary/10 p-2.5 text-sm font-semibold text-secondary" role="alert">{t("smUnsaved")}</p> : null}

      {groups.map(([group, prefs]) => (
        <Card key={group} className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">
            {group === "Orders" ? t("seOrders")
              : group === "Payments" ? t("sePayments")
              : group === "Payouts" ? t("sePayouts")
              : group === "Products" ? t("seProducts")
              : group === "Store" ? t("seStoreG")
              : t("sePromos")}
          </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("seNotif")}</TableHead>
                  <TableHead className="w-24 text-center">{t("seEmail")}</TableHead>
                  <TableHead className="w-24 text-center">{t("seInApp")}</TableHead>
                  <TableHead className="w-24 text-center">{t("seSms")}</TableHead>
                  <TableHead className="w-36">{t("seFrequency")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prefs.map((p) => (
                  <TableRow key={p.key}>
                    <TableCell className="text-sm font-bold">{p.label}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex"><Toggle checked={p.email} onChange={(v) => set(p.key, { email: v })} label={`${p.label} email`} /></span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex"><Toggle checked={p.inApp} onChange={(v) => set(p.key, { inApp: v })} label={`${p.label} in-app`} /></span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex"><Toggle checked={p.sms} onChange={(v) => set(p.key, { sms: v })} label={`${p.label} sms`} /></span>
                    </TableCell>
                    <TableCell>
                      <Select value={p.frequency} onValueChange={(v) => set(p.key, { frequency: (v as NotifyPref["frequency"]) ?? "instant" })}>
                        <SelectTrigger size="sm" className="h-8 w-28 bg-card" aria-label={t("seFrequency")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">{t("seInstant")}</SelectItem>
                          <SelectItem value="daily">{t("seDaily")}</SelectItem>
                          <SelectItem value="weekly">{t("seWeekly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="bg-card" onClick={() => { store.resetNotifyPrefs(); setDraft(saved); }} disabled={!dirty}>{t("eReset")}</Button>
        <Button onClick={save} disabled={!dirty}>{t("seSavePrefs")}</Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("seOrders")} · {t("sePayments")} · {t("sePayouts")} · {t("seProducts")} · {t("seStoreG")} · {t("sePromos")} · {SETTINGS_CONFIG.notifyChannels.join(" / ")}
      </p>
    </div>
  );
}
