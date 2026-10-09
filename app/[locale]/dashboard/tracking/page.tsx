"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock3,
  Hourglass,
  Package,
  RotateCcw,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { TrackingStatusBadge } from "@/components/admin/returns/shared";
import { shipmentsTrend } from "@/features/admin/returns";
import { useDeliveryIssues, useShipments } from "@/store/returns.store";

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

export default function TrackingOverviewPage() {
  const t = useTranslations("Dashboard.tracking");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const shipments = useShipments();
  const issues = useDeliveryIssues();
  const num = (v: number) => format.number(v);
  const trend = useMemo(() => shipmentsTrend(), []);

  const byStatus = (s: string) => shipments.filter((x) => x.status === s).length;

  const statusSlices = useMemo(
    () => [
      { id: "Processing", label: t("processing"), value: byStatus("processing") },
      { id: "Picked", label: t("picked"), value: byStatus("picked") },
      { id: "Shipped", label: t("transit"), value: byStatus("transit") },
      { id: "Completed", label: t("delivered"), value: byStatus("delivered") },
      { id: "Missed", label: t("delayed"), value: byStatus("delayed") },
      { id: "Failed", label: t("failed"), value: byStatus("failed") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shipments]
  );
  const deliverySlices = useMemo(
    () => [
      { id: "Completed", label: t("onTime"), value: byStatus("delivered") + byStatus("picked") },
      { id: "Missed", label: t("delayed"), value: byStatus("delayed") },
      { id: "Failed", label: t("failed"), value: byStatus("failed") + byStatus("returned") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shipments]
  );

  const kpis = [
    { label: t("kpiTotal"), value: num(shipments.length), delta: 9, icon: Package, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiTransit"), value: num(byStatus("transit")), delta: 4, icon: Truck, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiOut"), value: num(byStatus("out")), delta: 12, icon: Bike, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiDelivered"), value: num(byStatus("delivered")), delta: 15, icon: CheckCircle2, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiDelayed"), value: num(byStatus("delayed")), delta: -6, icon: Clock3, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiFailed"), value: num(byStatus("failed")), delta: -2, icon: XCircle, tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiReturned"), value: num(byStatus("returned")), icon: RotateCcw, tile: "bg-purple-600/10 text-purple-700" },
    { label: t("kpiUnknown"), value: num(issues.filter((i) => i.status === "open").length), icon: Hourglass, tile: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("tracking")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("kpiDelivered")}
        highlightValue={num(byStatus("delivered"))}
        highlightIcon={Truck}
      >
        <Link href="/dashboard/tracking/shipments" className={heroPillClassName}>{t("sTitle")}</Link>
        <Link href="/dashboard/tracking/issues" className={heroPillClassName}>{t("iTitle")}</Link>
        <Link href="/dashboard/tracking/history" className={heroPillClassName}>{t("hTitle")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartTrend")}</CardTitle>
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
            <StatusPieChart data={deliverySlices} unitLabel={t("kpiTotal")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("chartStatus")}</CardTitle>
            <Link href="/dashboard/tracking/shipments">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusSlices} unitLabel={t("kpiTotal")} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("iTitle")}</CardTitle>
            <Link href="/dashboard/tracking/issues">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {issues.slice(0, 5).map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs font-bold">{i.tracking}</span>
                  <span className="block truncate text-xs text-muted-foreground">{i.customer} · {i.date}</span>
                </span>
                <TrackingStatusBadge status={i.issue === "delayed" ? "delayed" : i.issue === "failed" ? "failed" : "processing"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
