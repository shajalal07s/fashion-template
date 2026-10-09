"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SHIP_TABS = [
  { key: "overview", href: "/vendor/shipping", labelKey: "shOverview" },
  { key: "settings", href: "/vendor/shipping/settings", labelKey: "shSettings" },
  { key: "zones", href: "/vendor/shipping/zones", labelKey: "shZones" },
  { key: "rates", href: "/vendor/shipping/rates", labelKey: "shRates" },
  { key: "delivery", href: "/vendor/shipping/delivery", labelKey: "shDelivery" },
];

const SETTING_TABS = [
  { key: "overview", href: "/vendor/settings", labelKey: "seOverview" },
  { key: "profile", href: "/vendor/settings/profile", labelKey: "seProfile" },
  { key: "password", href: "/vendor/settings/password", labelKey: "sePassword" },
  { key: "kyc", href: "/vendor/settings/kyc", labelKey: "seKyc" },
  { key: "payment", href: "/vendor/settings/payment-account", labelKey: "sePayment" },
  { key: "notifications", href: "/vendor/settings/notifications", labelKey: "seNotif" },
  { key: "store", href: "/vendor/settings/store", labelKey: "seStore" },
];

function Tabs({ tabs, label }: { tabs: typeof SHIP_TABS; label: string }) {
  const t = useTranslations("Dashboard.Vendor");
  const pathname = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active =
          tab.href === "/vendor/shipping" || tab.href === "/vendor/settings"
            ? pathname === tab.href
            : pathname.includes(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href as "/vendor/shipping"}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
              active
                ? "border-secondary bg-secondary text-white"
                : "border-border bg-card text-muted-foreground hover:border-secondary hover:text-foreground"
            )}
          >
            {t(tab.labelKey as "shOverview")}
          </Link>
        );
      })}
    </div>
  );
}

export function ShipTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={SHIP_TABS} label={t("shTitle")} />;
}

export function SettingTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={SETTING_TABS} label={t("seTitle")} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const t = useTranslations("Dashboard.Vendor");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 border transition-colors",
        checked ? "border-secondary bg-secondary" : "border-border bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 bg-white transition-all",
          checked ? "left-[22px]" : "left-[3px]"
        )}
      />
      <span className="sr-only">{checked ? t("seOn") : t("seOff")}</span>
    </button>
  );
}
