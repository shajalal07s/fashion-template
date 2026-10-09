"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const REVIEW_TABS = [
  { key: "overview", href: "/vendor/reviews", labelKey: "rwOverview" },
  { key: "products", href: "/vendor/reviews/products", labelKey: "rwProducts" },
  { key: "ratings", href: "/vendor/reviews/ratings", labelKey: "rwRatings" },
  { key: "feedback", href: "/vendor/reviews/feedback", labelKey: "rwFeedback" },
];

const STORE_TABS = [
  { key: "overview", href: "/vendor/store", labelKey: "smPreview" },
  { key: "profile", href: "/vendor/store/profile", labelKey: "smProfile" },
  { key: "logo", href: "/vendor/store/logo", labelKey: "smLogo" },
  { key: "banner", href: "/vendor/store/banner", labelKey: "smBanner" },
  { key: "desc", href: "/vendor/store/description", labelKey: "smDesc" },
  { key: "contact", href: "/vendor/store/contact", labelKey: "smContact" },
  { key: "address", href: "/vendor/store/address", labelKey: "smAddress" },
  { key: "social", href: "/vendor/store/social", labelKey: "smSocial" },
];

function Tabs({ tabs, label }: { tabs: typeof REVIEW_TABS; label: string }) {
  const t = useTranslations("Dashboard.Vendor");
  const pathname = usePathname();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active =
          tab.href === "/vendor/reviews" || tab.href === "/vendor/store"
            ? pathname === tab.href
            : pathname.includes(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href as "/vendor/reviews"}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
              active
                ? "border-secondary bg-secondary text-white"
                : "border-border bg-card text-muted-foreground hover:border-secondary hover:text-foreground"
            )}
          >
            {t(tab.labelKey as "rwOverview")}
          </Link>
        );
      })}
    </div>
  );
}

export function ReviewTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={REVIEW_TABS} label={t("nav_reviews")} />;
}

export function StoreTabs() {
  const t = useTranslations("Dashboard.Vendor");
  return <Tabs tabs={STORE_TABS} label={t("smTitle")} />;
}

export function StarsRow({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cn("size-3.5", i < Math.round(value) ? "fill-secondary text-secondary" : "fill-muted text-muted")}
          aria-hidden="true"
        >
          <path d="M12 2l2.9 6.26 6.6.7-4.9 4.5 1.35 6.54L12 16.77 6.05 20l1.35-6.54-4.9-4.5 6.6-.7L12 2z" />
        </svg>
      ))}
    </span>
  );
}
