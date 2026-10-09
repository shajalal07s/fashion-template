"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, RefreshCw, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { deliveryWindowText } from "@/features/vendor/shipping";
import { useVendorOrders, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";

export default function VendorShippingPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const store = useVendorStore();
  const orders = useVendorOrders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const settings = store.shippingSettings;
  const zones = store.shippingZones;
  const rates = store.shippingRates;
  const delivery = store.deliverySettings;

  const [range, setRange] = useState("30D");

  const activeZones = zones.filter((z) => z.active);
  const activeRates = rates.filter((r) => r.active);
  const freeRates = activeRates.filter((r) => r.calcType === "free");
  const pendingShip = orders.filter((o) => !o.archived && ["pending", "processing"].includes(o.status));
  const readyShip = orders.filter((o) => !o.archived && o.status === "processing");

  const shipped = useMemo(
    () => orders.filter((o) => !o.archived && ["shipped", "completed"].includes(o.status)),
    [orders]
  );
  const shipRevenue = useMemo(() => shipped.reduce((n, o) => n + o.shipping, 0), [shipped]);

  const checklist = useMemo(() => {
    const items = [
      { label: t("shEnabled"), done: settings.enabled, href: "/vendor/shipping/settings" },
      { label: t("shOrigin"), done: settings.origin.city.trim().length > 1, href: "/vendor/shipping/settings" },
      { label: t("shZones"), done: activeZones.length > 0, href: "/vendor/shipping/zones" },
      { label: t("shRates"), done: activeRates.length > 0, href: "/vendor/shipping/rates" },
      { label: t("shDelivery"), done: delivery.pickupAddress.trim().length > 3, href: "/vendor/shipping/delivery" },
    ];
    const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
    return { items, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, activeZones.length, activeRates.length, delivery.pickupAddress]);

  const trend = useMemo(() => {
    const pts = shipped.map((o, i) => ({ x: o.date.slice(5), y: i + 1 }));
    if (range === "7D") return pts.slice(-3);
    return pts.length > 0 ? pts : [{ x: "—", y: 0 }];
  }, [shipped, range]);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")}
        title={t("shTitle")}
        subtitle={t("shSubtitle")}
        highlightLabel={t("shStatus")}
        highlightValue={settings.enabled ? t("seOn") : t("seOff")}
        highlightIcon={Truck}
      >
        <Link href="/vendor/shipping/settings" className={heroPillClassName}>
          {t("shSettings")}
        </Link>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <ShipTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("shStatus")} value={settings.enabled ? t("seOn") : t("seOff")} href="/vendor/shipping/settings" accent />
        <EarnStatCard label={t("shZones")} value={num(activeZones.length)} sub={`${num(zones.length)} total`} href="/vendor/shipping/zones" />
        <EarnStatCard label={t("shMethods")} value={num(activeRates.length)} href="/vendor/shipping/rates" />
        <EarnStatCard label={t("shFreeShip")} value={num(freeRates.length)} href="/vendor/shipping/rates" />
        <EarnStatCard label={t("shEta")} value={`${delivery.procMin + delivery.shipMin}–${delivery.procMax + delivery.shipMax}d`} href="/vendor/shipping/delivery" />
        <EarnStatCard label={t("shPendingShip")} value={num(pendingShip.length)} href="/vendor/orders" />
        <EarnStatCard label={t("shReadyShip")} value={num(readyShip.length)} href="/vendor/orders" />
        <EarnStatCard label={t("shShipRevenue")} value={money(shipRevenue)} href="/vendor/shipping/rates" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shChecklist")} · {checklist.pct}%</CardTitle>
            <Link href="/vendor/shipping/settings" className="text-xs font-bold text-secondary hover:underline">{t("shComplete")}</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 px-4 pb-4">
            <div className="h-2 w-full bg-muted" role="progressbar" aria-valuenow={checklist.pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-secondary transition-all" style={{ width: `${checklist.pct}%` }} />
            </div>
            {checklist.items.map((item) => (
              <Link key={item.label} href={item.href as "/vendor/shipping"} className="flex items-center gap-2 py-1 text-sm transition-colors hover:text-secondary">
                {item.done ? <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-hidden="true" /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shOrdersShipped")} · {range}</CardTitle>
            <Select value={range} onValueChange={(v) => setRange(v ?? "30D")}>
              <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label={t("eDateRange")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {["7D", "30D", "90D", "6M", "1Y"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("shMethods")}</CardTitle>
          <Link href="/vendor/shipping/rates" className="text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("shRateName")}</TableHead>
                <TableHead>{t("shZone")}</TableHead>
                <TableHead className="text-right">{t("shAmount")}</TableHead>
                <TableHead>{t("shEtaCol")}</TableHead>
                <TableHead>{t("tStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRates.slice(0, 5).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/vendor/shipping/rates`} className="text-sm font-bold hover:text-secondary hover:underline">{r.name}</Link>
                  </TableCell>
                  <TableCell className="text-xs">{zoneName(r.zoneId)}</TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">{r.calcType === "free" ? money(0) : money(r.baseRate)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{deliveryWindowText(r)}</TableCell>
                  <TableCell>
                    <span className="bg-green-600/10 px-2 py-0.5 text-[11px] font-bold text-green-700">{t("seOn")}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
