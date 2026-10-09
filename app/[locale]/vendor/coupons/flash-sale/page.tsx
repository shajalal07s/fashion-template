"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Copy, Eye, Pause, Play, Plus, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { useFlashSales, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { CouponTabs } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorFlashSalePage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const flash = useFlashSales();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const stats = useMemo(() => ({
    live: flash.filter((f) => f.status === "live").length,
    upcoming: flash.filter((f) => f.status === "upcoming").length,
    done: flash.filter((f) => f.status === "completed").length,
    products: flash.reduce((n, f) => n + f.products, 0),
    revenue: flash.reduce((n, f) => n + f.revenue, 0),
    discount: flash.reduce((n, f) => n + Math.round(f.revenue * 0.2), 0),
  }), [flash]);

  const setStatus = (id: string, status: "live" | "upcoming" | "cancelled") => {
    useVendorStore.setState((s) => ({
      flashSales: s.flashSales.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
    store.notifyVendor(`Flash sale ${id} → ${status}.`, "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={t("cpFlash")} subtitle={t("cpSubtitle")}
        highlightLabel={t("cpFlash")} highlightValue={num(stats.live)} highlightIcon={Zap}
      >
        <button
          type="button"
          onClick={() => {
            useVendorStore.setState((s) => ({
              flashSales: [{ id: `fs-${Date.now()}`, name: "New Flash Campaign", banner: "/images/Banner/banner-1.jpg", start: "2026-10-10", end: "2026-10-12", products: 0, discount: "Up to 20%", sales: 0, revenue: 0, status: "upcoming" }, ...s.flashSales],
            }));
            toast.success(t("toastSaved"));
          }}
          className={heroPillClassName}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t("cpCreate")}
        </button>
      </AccountingHero>

      <CouponTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <EarnStatCard label={t("cpFlash")} value={num(flash.length)} href="/vendor/coupons/flash-sale" accent />
        <EarnStatCard label="Live" value={num(stats.live)} href="/vendor/coupons/flash-sale" />
        <EarnStatCard label="Upcoming" value={num(stats.upcoming)} href="/vendor/coupons/flash-sale" />
        <EarnStatCard label="Completed" value={num(stats.done)} href="/vendor/coupons/flash-sale" />
        <EarnStatCard label={t("cpRevenue")} value={money(stats.revenue)} href="/vendor/coupons/flash-sale" />
        <EarnStatCard label={t("cpDiscountGiven")} value={money(stats.discount)} href="/vendor/coupons/flash-sale" />
      </div>

      {flash.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flash.map((f) => (
            <Card key={f.id} className="overflow-hidden border-border bg-card py-0">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.banner} alt={f.name} className="h-36 w-full object-cover" loading="lazy" />
                <span className={cn("absolute top-2 left-2 px-2 py-0.5 text-[11px] font-bold",
                  f.status === "live" ? "bg-green-600 text-white" : f.status === "upcoming" ? "bg-secondary text-white" : "bg-card text-muted-foreground")}>
                  {f.status}
                </span>
              </div>
              <CardContent className="flex flex-col gap-1.5 p-4">
                <p className="truncate font-heading text-base font-bold">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.start} → {f.end} · {num(f.products)} {t("cpProducts")} · {f.discount}</p>
                <p className="text-sm">
                  <span className="font-bold text-green-700">{money(f.revenue)}</span>
                  <span className="text-muted-foreground"> · {num(f.sales)} {t("cpOrders")}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => toast.success(`${f.name} · ${num(f.sales)} ${t("cpOrders")} · ${money(f.revenue)}`)}>
                    <Eye className="size-3" aria-hidden="true" />
                    {t("cpAnalytics")}
                  </Button>
                  {f.status === "live" ? (
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => setStatus(f.id, "upcoming")}>
                      <Pause className="size-3" aria-hidden="true" />
                      {t("cpPause")}
                    </Button>
                  ) : null}
                  {f.status === "upcoming" ? (
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => setStatus(f.id, "live")}>
                      <Play className="size-3" aria-hidden="true" />
                      {t("cpResume")}
                    </Button>
                  ) : null}
                  {f.status !== "cancelled" && f.status !== "completed" ? (
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px] text-destructive" onClick={() => setStatus(f.id, "cancelled")}>
                      {t("poCancel")}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => {
                    useVendorStore.setState((s) => {
                      const src = s.flashSales.find((x) => x.id === f.id);
                      if (!src) return s;
                      return { flashSales: [{ ...src, id: `fs-${Date.now()}`, name: `${src.name} (Copy)`, status: "upcoming", sales: 0, revenue: 0 }, ...s.flashSales] };
                    });
                    toast.success(t("toastSaved"));
                  }}>
                    <Copy className="size-3" aria-hidden="true" />
                    {t("cpDuplicate")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card"><CardContent className="py-8"><EmptyState icon={Zap} title={t("cpEmpty")} description={t("cpEmptyDesc")} /></CardContent></Card>
      )}

      <p className="text-xs text-muted-foreground">
        <Link href="/vendor/coupons/campaigns" className="font-bold text-secondary hover:underline">{t("cpCampaigns")}</Link>
        {" · "}
        <Link href="/vendor/coupons/list" className="font-bold text-secondary hover:underline">{t("cpList")}</Link>
      </p>
    </div>
  );
}
