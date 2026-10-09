"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Megaphone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { useCampaigns, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { CouponTabs } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorCampaignsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const campaigns = useCampaigns();
  const store = useVendorStore();

  const num = (v: number) => format.number(v);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={t("cpCampaigns")} subtitle={t("cpSubtitle")}
        highlightLabel={t("cpCampaigns")} highlightValue={num(campaigns.length)} highlightIcon={Megaphone}
      />

      <CouponTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <EarnStatCard label={t("cpCampaigns")} value={num(campaigns.length)} href="/vendor/coupons/campaigns" accent />
        <EarnStatCard label={t("cpApplied")} value={num(campaigns.filter((c) => ["applied", "review"].includes(c.status)).length)} href="/vendor/coupons/campaigns" />
        <EarnStatCard label={t("cpActive")} value={num(campaigns.filter((c) => ["approved", "active"].includes(c.status)).length)} href="/vendor/coupons/campaigns" />
        <EarnStatCard label={t("cpExpired")} value={num(campaigns.filter((c) => c.status === "completed").length)} href="/vendor/coupons/campaigns" />
      </div>

      {campaigns.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="overflow-hidden border-border bg-card py-0">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.banner} alt={c.name} className="h-36 w-full object-cover" loading="lazy" />
                <span className={cn("absolute top-2 left-2 px-2 py-0.5 text-[11px] font-bold",
                  c.status === "open" ? "bg-secondary text-white" : ["approved", "active"].includes(c.status) ? "bg-green-600 text-white" : "bg-card text-muted-foreground")}>
                  {c.status}
                </span>
              </div>
              <CardContent className="flex flex-col gap-1.5 p-4">
                <p className="truncate font-heading text-base font-bold">{c.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                <p className="text-xs text-muted-foreground">{c.start} → {c.end} · {t("cpDeadline")}: {c.deadline} · {t("cpRequired")}: {c.requiredDiscount}%</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Link href={`/vendor/coupons/campaigns/${c.id}`}>
                    <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]">{t("viewDetails")}</Button>
                  </Link>
                  {c.status === "open" ? (
                    <Button size="sm" className="h-7 text-[11px]" onClick={() => {
                      store.patchCampaign(c.id, { status: "applied", products: 2, note: "Application submitted." });
                      store.notifyVendor(`Campaign application submitted: ${c.name}.`, "info");
                      toast.success(t("toastSaved"));
                    }}>
                      {t("cpApplyBtn")}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card"><CardContent className="py-8"><EmptyState icon={Megaphone} title={t("cpEmpty")} description={t("cpEmptyDesc")} /></CardContent></Card>
      )}
    </div>
  );
}
