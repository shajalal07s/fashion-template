"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deliveryWindowText } from "@/features/vendor/shipping";
import { useVendorStore } from "@/store/vendor.store";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";

export default function VendorZoneDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ zoneId: string }>();
  const id = params.zoneId;
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const zone = useMemo(() => store.shippingZones.find((z) => z.id === id), [store.shippingZones, id]);
  const methods = useMemo(() => store.shippingRates.filter((r) => r.zoneId === id), [store.shippingRates, id]);

  if (!zone) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero eyebrow={t("nav_shipping")} title={t("shZones")} subtitle={id} highlightLabel={t("tStatus")} highlightValue="—" highlightIcon={MapPin}>
          <Link href="/vendor/shipping/zones" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("shZones")}
          </Link>
        </AccountingHero>
        <EmptyState icon={MapPin} title={t("emptyTitle")} description={t("emptyDescription")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={zone.name} subtitle={zone.description || t("shZones")}
        highlightLabel={t("shPriority")} highlightValue={`#${zone.priority}`} highlightIcon={MapPin}
      >
        <Link href="/vendor/shipping/zones" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("shZones")}
        </Link>
        <Link href={`/vendor/shipping/rates/create`} className={heroPillClassName}>
          {t("shCreateRate")}
        </Link>
      </AccountingHero>

      <ShipTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shZoneName")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-4 pb-4 text-sm">
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shZoneName")}</span><span className="font-bold">{zone.name}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shCountries")}</span><span className="text-right font-semibold">{zone.countries.join(", ")}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shRegions")}</span><span className="text-right font-semibold">{zone.regions.join(", ") || "—"}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shCity")}</span><span className="text-right font-semibold">{zone.cities.join(", ") || "—"}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shPostal")}</span><span className="font-mono text-xs font-bold">{zone.postals.join(", ") || "—"}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("shPriority")}</span><span className="font-mono font-bold">#{zone.priority}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("tStatus")}</span><span className="font-bold">{zone.active ? t("seOn") : t("seOff")}</span></div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shMethods")} · {methods.length}</CardTitle>
            <Link href="/vendor/shipping/rates" className="text-xs font-bold text-secondary hover:underline">{t("shManageRates")}</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {methods.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("shRateName")}</TableHead>
                    <TableHead className="text-right">{t("shAmount")}</TableHead>
                    <TableHead>{t("shEtaCol")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-bold">{r.name}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">{r.calcType === "free" ? money(0) : money(r.baseRate)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{deliveryWindowText(r)}</TableCell>
                      <TableCell>
                        <span className={r.active ? "bg-green-600/10 px-2 py-0.5 text-[11px] font-bold text-green-700" : "bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground"}>
                          {r.active ? t("seOn") : t("seOff")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8"><EmptyState icon={MapPin} title={t("emptyTitle")} description={t("emptyDescription")} /></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
