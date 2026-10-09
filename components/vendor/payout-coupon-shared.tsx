"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAYOUT_TABS = [
  { key: "overview", href: "/vendor/payouts", labelKey: "poOverview" },
  { key: "request", href: "/vendor/payouts/request", labelKey: "poRequest" },
  { key: "history", href: "/vendor/payouts/history", labelKey: "poHistory" },
  { key: "pending", href: "/vendor/payouts/pending", labelKey: "poPending" },
  { key: "completed", href: "/vendor/payouts/completed", labelKey: "poCompleted" },
  { key: "account", href: "/vendor/payouts/account", labelKey: "poAccount" },
];

const COUPON_TABS = [
  { key: "overview", href: "/vendor/coupons", labelKey: "cpOverview" },
  { key: "list", href: "/vendor/coupons/list", labelKey: "cpList" },
  { key: "create", href: "/vendor/coupons/create", labelKey: "cpCreate" },
  { key: "discount", href: "/vendor/coupons/product-discount", labelKey: "cpDiscount" },
  { key: "flash", href: "/vendor/coupons/flash-sale", labelKey: "cpFlash" },
  { key: "campaigns", href: "/vendor/coupons/campaigns", labelKey: "cpCampaigns" },
];

function Tabs({ tabs, label }: { tabs: typeof PAYOUT_TABS; label: string }) {
  const t = useTranslations("Dashboard.Vendor");
  const pathname = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active =
          tab.href === "/vendor/payouts" || tab.href === "/vendor/coupons"
            ? pathname === tab.href || pathname.endsWith("/payouts") || pathname.endsWith("/coupons")
            : pathname.includes(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href as "/vendor/payouts"}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
              active
                ? "border-secondary bg-secondary text-white"
                : "border-border bg-card text-muted-foreground hover:border-secondary hover:text-foreground"
            )}
          >
            {t(tab.labelKey as "poOverview")}
          </Link>
        );
      })}
    </div>
  );
}

export function PayoutTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={PAYOUT_TABS} label={t("poTitle")} />;
}

export function CouponTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={COUPON_TABS} label={t("cpTitle")} />;
}

export function PoStatusBadge({ status }: { status: string }) {
  const t = useTranslations("Dashboard.Vendor");
  const label =
    status === "completed" ? t("completed")
    : status === "pending" ? t("pending")
    : status === "processing" ? t("processing")
    : status === "failed" ? t("eFailed")
    : status === "cancelled" ? t("cancelled")
    : status;
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      status === "completed" ? "bg-green-600/10 text-green-700"
      : status === "failed" || status === "cancelled" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {label}
    </span>
  );
}

export function CpStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      status === "active" ? "bg-green-600/10 text-green-700"
      : status === "expired" || status === "disabled" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {status}
    </span>
  );
}
