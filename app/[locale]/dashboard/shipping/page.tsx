"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bike,
  Package,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { shipmentsTrend } from "@/features/admin/shipping";
import {
  useShipMethods,
  useShipProviders,
  useShipRates,
  useShipVendors,
  useShipZones,
} from "@/store/shipping.store";

function Kpi({ label, value, delta, icon: Icon, tile}: { label: string; value: string; delta?: number; icon: LucideIcon; tile: string }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          {delta !== undefined ? (
            <span className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {positive ? "+" : ""}{delta}%
            </span>
          ) : null}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

const FLOW_KEYS = ["flowOrder", "flowZone", "flowMethod", "flowRate", "flowVendor", "flowProvider", "flowEta"] as const;
const PRIORITY_ROWS = ["Product Shipping Rule", "Vendor Shipping Rule", "Zone Shipping Rule", "Global Shipping Rule"];

export default function ShippingOverviewPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const zones = useShipZones();
  const methods = useShipMethods();
  const rates = useShipRates();
  const vendors = useShipVendors();
  const providers = useShipProviders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const trend = useMemo(() => shipmentsTrend(), []);
  const deliverySlices = useMemo(
    () => [
      { id: "Completed", label: t("onTime"), value: 7800 },
      { id: "Missed", label: t("delayed"), value: 1100 },
      { id: "Failed", label: t("failed"), value: 300 },
    ],
    [t]
  );

  const kpis = [
    { label: t("kpiZones"), value: num(zones.length), delta: 0, icon: Package, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiMethods"), value: num(methods.filter((m) => m.status === "active").length), delta: 12, icon: Truck, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiRates"), value: num(rates.length), delta: 8, icon: Package, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiVendors"), value: num(vendors.filter((v) => v.status === "active").length), delta: 5, icon: Store, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiProviders"), value: num(providers.length), delta: 0, icon: Bike, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiFree"), value: num(methods.filter((m) => m.freeShipping).length), delta: 20, icon: Package, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiAvg"), value: money(72), delta: -3, icon: Truck, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiPending"), value: num([...zones, ...methods].filter((x) => x.status === "scheduled" || x.status === "draft").length), icon: Package, tile: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("totalShipments")}
        highlightValue={num(9600)}
        highlightIcon={Truck}
      >
        <Link href="/dashboard/shipping/zones" className={heroPillClassName}>{t("zTitle")}</Link>
        <Link href="/dashboard/shipping/rates" className={heroPillClassName}>{t("rTitle")}</Link>
        <Link href="/dashboard/shipping/providers" className={heroPillClassName}>{t("spTitle")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartDelivery")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={deliverySlices} unitLabel={t("totalShipments")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartCost")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {[
              { l: t("shipRevenue"), v: money(576000) },
              { l: t("shipCost"), v: money(412000) },
              { l: t("freeOrders"), v: num(1840) },
              { l: t("avgCost"), v: money(72) },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted-foreground">{r.l}</span>
                <span className="font-bold text-secondary">{r.v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("configFlow")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-stretch gap-0">
            {FLOW_KEYS.map((k, i) => (
              <div key={k} className="flex flex-col items-center">
                <span className="w-full border border-border bg-card px-4 py-2 text-center text-sm font-semibold">
                  {i + 1}. {t(k)}
                </span>
                {i < FLOW_KEYS.length - 1 ? (
                  <ArrowDown className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("priorityTitle")}</CardTitle>
          <Link href="/dashboard/shipping/rates">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
              {t("viewAll")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-4">
          {PRIORITY_ROWS.map((r, i) => (
            <div key={r} className="flex items-center gap-2 border border-border bg-card px-3 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary font-heading text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="text-xs font-bold">{r}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
