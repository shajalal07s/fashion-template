"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { TxnStatus, TxnType } from "@/features/vendor/earnings";

export function EarnStatCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href as "/vendor/earnings"}
      aria-label={label}
      className={cn(
        "block border bg-card p-3 text-left transition-colors hover:border-secondary focus-visible:outline-2 focus-visible:outline-secondary",
        accent ? "border-secondary/60" : "border-border"
      )}
    >
      <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-heading text-xl font-bold", accent && "text-secondary")}>{value}</p>
      {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
    </Link>
  );
}

export function TxnTypeBadge({ type }: { type: TxnType }) {
  const t = useTranslations("Dashboard.Vendor");
  const label =
    type === "sale" ? t("eSale")
    : type === "commission" ? t("commission")
    : type === "refund" ? t("refunds")
    : type === "payout" ? t("payoutsTitle")
    : type === "adjustment" ? t("eAdjustment")
    : type === "bonus" ? t("eBonus")
    : type === "penalty" ? t("ePenalty")
    : type === "withdrawal" ? t("eWithdrawal")
    : t("eChargeback");
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      type === "sale" ? "bg-green-600/10 text-green-700"
      : type === "refund" || type === "chargeback" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {label}
    </span>
  );
}

export function TxnStatusBadge({ status }: { status: TxnStatus }) {
  const t = useTranslations("Dashboard.Vendor");
  const label =
    status === "completed" ? t("completed")
    : status === "pending" ? t("pending")
    : status === "processing" ? t("processing")
    : status === "failed" ? t("eFailed")
    : status === "cancelled" ? t("cancelled")
    : t("eReversed");
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      status === "completed" ? "bg-green-600/10 text-green-700"
      : status === "failed" || status === "cancelled" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {label}
    </span>
  );
}

const TABS: Array<{ key: string; href: string; labelKey: string }> = [
  { key: "overview", href: "/vendor/earnings", labelKey: "earnOverview" },
  { key: "available", href: "/vendor/earnings/available", labelKey: "availBalance" },
  { key: "pending", href: "/vendor/earnings/pending", labelKey: "pendingBalance" },
  { key: "commission", href: "/vendor/earnings/commission", labelKey: "commission" },
  { key: "transactions", href: "/vendor/earnings/transactions", labelKey: "eTxnTitle" },
  { key: "orders", href: "/vendor/earnings/orders", labelKey: "eOrdersEarn" },
  { key: "products", href: "/vendor/earnings/products", labelKey: "eProductsEarn" },
  { key: "balance", href: "/vendor/earnings/balance", labelKey: "eBalanceHist" },
  { key: "reports", href: "/vendor/earnings/reports", labelKey: "eReports" },
];

export function EarnTabs() {
  const t = useTranslations("Dashboard.Vendor");
  const pathname = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t("eTitle")}>
      {TABS.map((tab) => {
        const active =
          tab.href === "/vendor/earnings"
            ? pathname === "/vendor/earnings" || pathname.endsWith("/earnings")
            : pathname.includes(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href as "/vendor/earnings"}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
              active
                ? "border-secondary bg-secondary text-white"
                : "border-border bg-card text-muted-foreground hover:border-secondary hover:text-foreground"
            )}
          >
            {t(tab.labelKey as "eTitle")}
          </Link>
        );
      })}
    </div>
  );
}

export function EarnIconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center bg-secondary/10">
      <Icon className="size-4 text-secondary" aria-hidden="true" />
    </span>
  );
}
