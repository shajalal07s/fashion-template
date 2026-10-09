"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Copy, Download, MapPin, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorShippingZonesPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const store = useVendorStore();
  const zones = store.shippingZones;
  const rates = store.shippingRates;

  const num = (v: number) => format.number(v);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...zones].sort((a, b) => a.priority - b.priority);
    if (fStatus !== "all") list = list.filter((z) => (fStatus === "active") === z.active);
    if (needle) list = list.filter((z) => `${z.name} ${z.countries.join(" ")} ${z.regions.join(" ")}`.toLowerCase().includes(needle));
    return list;
  }, [zones, q, fStatus]);

  const methodsOf = (zoneId: string) => rates.filter((r) => r.zoneId === zoneId && r.active).length;
  const activeRatesOf = (zoneId: string) => rates.filter((r) => r.zoneId === zoneId && r.active).length;

  const move = (id: string, dir: -1 | 1) => {
    const ordered = [...zones].sort((a, b) => a.priority - b.priority);
    const idx = ordered.findIndex((z) => z.id === id);
    const other = ordered[idx + dir];
    if (!other) return;
    const target = ordered[idx];
    store.patchShippingZone(target.id, { priority: other.priority });
    store.patchShippingZone(other.id, { priority: target.priority });
    toast.success(t("toastSaved"));
  };

  const remove = (id: string) => {
    if (rates.some((r) => r.zoneId === id && r.active)) {
      toast.error(t("shZoneDeleteWarn"));
      return;
    }
    store.removeShippingZone(id);
    store.notifyVendor(`Shipping zone ${id} deleted.`, "info");
    setDeleting(null);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shZones")} subtitle={`${num(zones.length)} · ${t("shSubtitle")}`}
        highlightLabel={t("shActiveZones")} highlightValue={num(zones.filter((z) => z.active).length)} highlightIcon={MapPin}
      >
        <Link href="/vendor/shipping/zones/create" className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("shCreateZone")}
        </Link>
        <button
          type="button"
          onClick={() => {
            downloadCsv("zones.csv", ["name", "countries", "priority", "active"], zones.map((z) => [z.name, z.countries.join("|"), z.priority, String(z.active)]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
      </AccountingHero>

      <ShipTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("shTotalZones")} value={num(zones.length)} href="/vendor/shipping/zones" accent />
        <EarnStatCard label={t("shActiveZones")} value={num(zones.filter((z) => z.active).length)} href="/vendor/shipping/zones" />
        <EarnStatCard label={t("shInactive")} value={num(zones.filter((z) => !z.active).length)} href="/vendor/shipping/zones" />
        <EarnStatCard label={t("shCountries")} value={num(new Set(zones.flatMap((z) => z.countries)).size)} href="/vendor/shipping/zones" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("tStatus")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("eAll")}</SelectItem>
            <SelectItem value="active">{t("seOn")}</SelectItem>
            <SelectItem value="inactive">{t("seOff")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("shPriority")}</TableHead>
                  <TableHead>{t("shZoneName")}</TableHead>
                  <TableHead>{t("shCountries")}</TableHead>
                  <TableHead className="text-right">{t("shMethods")}</TableHead>
                  <TableHead className="text-right">{t("shActiveRates")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-44">{t("cpActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <span className="bg-secondary/10 px-2 py-0.5 font-mono text-xs font-bold text-secondary">{z.priority}</span>
                        <button type="button" onClick={() => move(z.id, -1)} className="px-1 font-bold hover:text-secondary" aria-label="Move up">↑</button>
                        <button type="button" onClick={() => move(z.id, 1)} className="px-1 font-bold hover:text-secondary" aria-label="Move down">↓</button>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/vendor/shipping/zones/${z.id}`} className="text-sm font-bold hover:text-secondary hover:underline">{z.name}</Link>
                      <p className="max-w-40 truncate text-[11px] text-muted-foreground">{z.description}</p>
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-xs">{z.countries.join(", ")}{z.regions.length > 0 ? ` · ${z.regions.join(", ")}` : ""}</TableCell>
                    <TableCell className="text-right font-bold">{num(methodsOf(z.id))}</TableCell>
                    <TableCell className="text-right font-bold text-green-700">{num(activeRatesOf(z.id))}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => { store.patchShippingZone(z.id, { active: !z.active }); toast.success(t("toastSaved")); }}
                        className={z.active ? "bg-green-600/10 px-2 py-0.5 text-[11px] font-bold text-green-700" : "bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground"}
                      >
                        {z.active ? t("seOn") : t("seOff")}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Link href={`/vendor/shipping/zones/${z.id}`}>
                          <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${z.name}`}><Pencil className="size-4" aria-hidden="true" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          const src = zones.find((x) => x.id === z.id);
                          if (!src) return;
                          store.addShippingZone({ ...src, id: `sz-${Date.now()}`, name: `${src.name} (Copy)`, priority: Math.max(1, ...zones.map((x) => x.priority)) + 1, active: false });
                          toast.success(t("toastSaved"));
                        }} aria-label={`${t("cpDuplicate")} ${z.name}`} title={t("cpDuplicate")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.patchShippingZone(z.id, { active: !z.active }); toast.success(t("toastSaved")); }} aria-label={`${t("poDisable")} ${z.name}`} title={t("poDisable")}>
                          <Power className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(z.id)} aria-label={`${t("poDelete")} ${z.name}`} title={t("poDelete")}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={MapPin} title={t("cpEmpty")} description={t("emptyDescription")} />
              <Link href="/vendor/shipping/zones/create"><Button size="sm">{t("shCreateZone")}</Button></Link>
            </div>
          )}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {filtered.length > 0 ? filtered.map((z) => (
            <div key={z.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <Link href={`/vendor/shipping/zones/${z.id}`} className="font-bold">{z.name}</Link>
                <span className="bg-secondary/10 px-2 py-0.5 font-mono text-xs font-bold text-secondary">#{z.priority}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{z.countries.join(", ")}</p>
              <p className="text-xs">{num(methodsOf(z.id))} {t("shMethods")} · {z.active ? t("seOn") : t("seOff")}</p>
              <Link href={`/vendor/shipping/zones/${z.id}`} className="border-t border-border pt-2 text-xs font-bold text-secondary hover:underline">{t("shManageRates")}</Link>
            </div>
          )) : <EmptyState icon={MapPin} title={t("cpEmpty")} description={t("emptyDescription")} />}
        </CardContent>
      </Card>

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poDelete")}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("shZoneDeleteWarn")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button size="sm" onClick={() => deleting && remove(deleting)}>{t("poDelete")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
