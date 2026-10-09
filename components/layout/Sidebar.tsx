"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Calculator,
  ChartColumn,
  ChevronDown,
  Globe,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  Package,
  PhoneCall,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Undo2,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";

interface SidebarLink {
  key: string;
  href: string;
  icon: LucideIcon;
  children?: Array<{ key: string; href: string }>;
}

const MAIN_LINKS: SidebarLink[] = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "orders", href: "/dashboard/orders", icon: ShoppingCart },
  {
    key: "products",
    href: "/dashboard/products",
    icon: Package,
    children: [
      { key: "allProducts", href: "/dashboard/products" },
      { key: "attributes", href: "/dashboard/products/attributes-size" },
      { key: "colors", href: "/dashboard/products/colors" },
      { key: "inventory", href: "/dashboard/products/inventory" },
      { key: "invoices", href: "/dashboard/products/invoices" },
    ],
  },
  {
    key: "customers",
    href: "/dashboard/customers",
    icon: Users,
    children: [
      { key: "cusAll", href: "/dashboard/customers" },
      { key: "cusReviews", href: "/dashboard/customers/reviews" },
      { key: "cusWallet", href: "/dashboard/customers/wallet" },
      { key: "cusActivity", href: "/dashboard/customers/activity" },
      { key: "cusBlocked", href: "/dashboard/customers/blocked" },
    ],
  },
  { key: "coupons", href: "/dashboard/coupons", icon: Store },
  {
    key: "accounting",
    href: "/dashboard/accounting",
    icon: Calculator,
    children: [
      { key: "accOverview", href: "/dashboard/accounting" },
      { key: "accAccounts", href: "/dashboard/accounting/accounts" },
      { key: "accJournal", href: "/dashboard/accounting/journal" },
      { key: "accExpenses", href: "/dashboard/accounting/expenses" },
      { key: "accInvoices", href: "/dashboard/accounting/invoices" },
      { key: "accBank", href: "/dashboard/accounting/bank-cash" },
      { key: "accTax", href: "/dashboard/accounting/tax-settings" },
      { key: "accReports", href: "/dashboard/accounting/reports" },
    ],
  },
  {
    key: "autoCall",
    href: "/dashboard/calls",
    icon: PhoneCall,
    children: [
      { key: "callsOverview", href: "/dashboard/calls" },
      { key: "callsQueue", href: "/dashboard/calls/queue" },
      { key: "callsLog", href: "/dashboard/calls/call-log" },
      { key: "callsRecordings", href: "/dashboard/calls/recordings" },
      { key: "callsScripts", href: "/dashboard/calls/scripts" },
      { key: "callsSettings", href: "/dashboard/calls/settings" },
    ],
  },
  {
    key: "commission",
    href: "/dashboard/commission",
    icon: HandCoins,
    children: [
      { key: "comOverview", href: "/dashboard/commission" },
      { key: "comGlobal", href: "/dashboard/commission/global" },
      { key: "comVendors", href: "/dashboard/commission/vendors" },
      { key: "comCategories", href: "/dashboard/commission/categories" },
      { key: "comProducts", href: "/dashboard/commission/products" },
      { key: "comHistory", href: "/dashboard/commission/history" },
      { key: "comReports", href: "/dashboard/commission/reports" },
      { key: "comRules", href: "/dashboard/commission/rules" },
      { key: "comAdjust", href: "/dashboard/commission/adjustments" },
      { key: "comRefunds", href: "/dashboard/commission/refunds" },
      { key: "comSettings", href: "/dashboard/commission/settings" },
    ],
  },
  {
    key: "marketing",
    href: "/dashboard/marketing",
    icon: Megaphone,
    children: [
      { key: "mktOverview", href: "/dashboard/marketing" },
      { key: "mktCoupons", href: "/dashboard/marketing/coupons" },
      { key: "mktRules", href: "/dashboard/marketing/discount-rules" },
      { key: "mktFlash", href: "/dashboard/marketing/flash-sale" },
      { key: "mktCampaigns", href: "/dashboard/marketing/campaigns" },
      { key: "mktPromos", href: "/dashboard/marketing/promotions" },
      { key: "mktProductOffers", href: "/dashboard/marketing/product-offers" },
      { key: "mktVendorOffers", href: "/dashboard/marketing/vendor-offers" },
      { key: "mktBanners", href: "/dashboard/marketing/banners" },
      { key: "mktFeatured", href: "/dashboard/marketing/featured" },
      { key: "mktNewsletter", href: "/dashboard/marketing/newsletter" },
    ],
  },
  {
    key: "reviews",
    href: "/dashboard/reviews",
    icon: Star,
    children: [
      { key: "revOverview", href: "/dashboard/reviews" },
      { key: "revProducts", href: "/dashboard/reviews/products" },
      { key: "revVendors", href: "/dashboard/reviews/vendors" },
      { key: "revPending", href: "/dashboard/reviews/pending" },
      { key: "revReported", href: "/dashboard/reviews/reported" },
      { key: "revModeration", href: "/dashboard/reviews/moderation" },
    ],
  },
  {
    key: "shipping",
    href: "/dashboard/shipping",
    icon: Truck,
    children: [
      { key: "shipOverview", href: "/dashboard/shipping" },
      { key: "shipZones", href: "/dashboard/shipping/zones" },
      { key: "shipMethods", href: "/dashboard/shipping/methods" },
      { key: "shipRates", href: "/dashboard/shipping/rates" },
      { key: "shipVendors", href: "/dashboard/shipping/vendor-shipping" },
      { key: "shipDelivery", href: "/dashboard/shipping/delivery-settings" },
      { key: "shipProviders", href: "/dashboard/shipping/providers" },
    ],
  },
  {
    key: "tracking",
    href: "/dashboard/tracking",
    icon: Package,
    children: [
      { key: "trkOverview", href: "/dashboard/tracking" },
      { key: "trkShipments", href: "/dashboard/tracking/shipments" },
      { key: "trkIssues", href: "/dashboard/tracking/issues" },
      { key: "trkHistory", href: "/dashboard/tracking/history" },
    ],
  },
  {
    key: "returns",
    href: "/dashboard/returns",
    icon: Undo2,
    children: [
      { key: "retOverview", href: "/dashboard/returns" },
      { key: "retRequests", href: "/dashboard/returns/requests" },
      { key: "retRefunds", href: "/dashboard/returns/refunds" },
      { key: "retApproved", href: "/dashboard/returns/approved" },
      { key: "retRejected", href: "/dashboard/returns/rejected" },
      { key: "retHistory", href: "/dashboard/returns/refund-history" },
      { key: "retReasons", href: "/dashboard/returns/reasons" },
      { key: "retPolicy", href: "/dashboard/returns/policy" },
      { key: "retAnalytics", href: "/dashboard/returns/analytics" },
    ],
  },
  {
    key: "reports",
    href: "/dashboard/reports",
    icon: ChartColumn,
    children: [
      { key: "repOverview", href: "/dashboard/reports" },
      { key: "repSales", href: "/dashboard/reports/sales" },
      { key: "repRevenue", href: "/dashboard/reports/revenue" },
      { key: "repOrders", href: "/dashboard/reports/orders" },
      { key: "repProducts", href: "/dashboard/reports/products" },
      { key: "repVendors", href: "/dashboard/reports/vendors" },
      { key: "repCustomers", href: "/dashboard/reports/customers" },
      { key: "repCommission", href: "/dashboard/reports/commission" },
      { key: "repPayout", href: "/dashboard/reports/payout" },
      { key: "repTax", href: "/dashboard/reports/tax" },
      { key: "repRefund", href: "/dashboard/reports/refund" },
      { key: "repInventory", href: "/dashboard/reports/inventory" },
      { key: "repGeo", href: "/dashboard/reports/geography" },
    ],
  },
  {
    key: "cms",
    href: "/dashboard/cms",
    icon: Globe,
    children: [
      { key: "cmsOverview", href: "/dashboard/cms" },
      { key: "cmsHomepage", href: "/dashboard/cms/homepage" },
      { key: "cmsBanners", href: "/dashboard/cms/banners" },
      { key: "cmsPages", href: "/dashboard/cms/pages" },
      { key: "cmsBlog", href: "/dashboard/cms/blog" },
      { key: "cmsMenus", href: "/dashboard/cms/menus" },
      { key: "cmsFooter", href: "/dashboard/cms/footer" },
      { key: "cmsFaq", href: "/dashboard/cms/faq" },
      { key: "cmsContact", href: "/dashboard/cms/contact" },
      { key: "cmsSeo", href: "/dashboard/cms/seo" },
      { key: "cmsMedia", href: "/dashboard/cms/media" },
    ],
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    icon: Settings,
    children: [
      { key: "setOverview", href: "/dashboard/settings" },
      { key: "setGeneral", href: "/dashboard/settings/general" },
      { key: "setStore", href: "/dashboard/settings/store" },
      { key: "setCurrency", href: "/dashboard/settings/currency" },
      { key: "setTax", href: "/dashboard/settings/tax" },
      { key: "setPayments", href: "/dashboard/settings/payments" },
      { key: "setShipping", href: "/dashboard/settings/shipping" },
      { key: "setCommission", href: "/dashboard/settings/commission" },
      { key: "setEmail", href: "/dashboard/settings/email" },
      { key: "setNotifications", href: "/dashboard/settings/notifications" },
      { key: "setSecurity", href: "/dashboard/settings/security" },
      { key: "setRoles", href: "/dashboard/settings/roles" },
      { key: "setAdmins", href: "/dashboard/settings/admins" },
      { key: "setActivity", href: "/dashboard/settings/activity-logs" },
    ],
  },
];

const STORE_LINKS: SidebarLink[] = [{ key: "profile", href: "/dashboard/profile", icon: User }];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("Dashboard.sidebar");
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    products: pathname.startsWith("/dashboard/products"),
    autoCall: pathname.startsWith("/dashboard/calls"),
    accounting: pathname.startsWith("/dashboard/accounting"),
    commission: pathname.startsWith("/dashboard/commission"),
    marketing: pathname.startsWith("/dashboard/marketing"),
    reviews: pathname.startsWith("/dashboard/reviews"),
    shipping: pathname.startsWith("/dashboard/shipping"),
    tracking: pathname.startsWith("/dashboard/tracking"),
    returns: pathname.startsWith("/dashboard/returns"),
    reports: pathname.startsWith("/dashboard/reports"),
    cms: pathname.startsWith("/dashboard/cms"),
    settings: pathname.startsWith("/dashboard/settings"),
    customers: pathname.startsWith("/dashboard/customers"),
  });

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 border px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "border-secondary bg-secondary font-semibold text-white"
        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  const renderLink = (link: SidebarLink) => {
    const isActive =
      link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);

    if (link.children) {
      const childActive = link.children.some((c) => pathname === c.href);
      const expanded = openMenus[link.key] || childActive;
      const setExpanded = (v: boolean) => setOpenMenus((prev) => ({ ...prev, [link.key]: v }));
      return (
        <div key={link.key} className="flex flex-col gap-2">
          <Link
            href={link.href}
            onClick={() => {
              setExpanded(true);
              onClose();
            }}
            aria-current={isActive ? "page" : undefined}
            className={linkClass(isActive)}
          >
            <link.icon className="size-4 shrink-0" aria-hidden="true" />
            {t(link.key)}
            <button
              type="button"
              aria-label={t(link.key)}
              aria-expanded={expanded}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="ml-auto flex size-6 items-center justify-center"
            >
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {isActive && !expanded ? (
              <span className="size-1.5 rounded-full bg-white" />
            ) : null}
          </Link>
          {expanded ? (
            <div className="ml-4 flex flex-col gap-2 border-l-2 border-secondary/30 pl-2">
              {link.children.map((child) => {
                const active = pathname === child.href;
                return (
                  <Link
                    key={child.key}
                    href={child.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 border px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "border-secondary bg-secondary/10 font-semibold text-secondary"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {t(child.key)}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <Link
        key={link.key}
        href={link.href}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={linkClass(isActive)}
      >
        <link.icon className="size-4 shrink-0" aria-hidden="true" />
        {t(link.key)}
        {isActive ? <span className="ml-auto size-1.5 rounded-full bg-white" /> : null}
      </Link>
    );
  };

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeMenu")}
          className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto p-3" aria-label={t("navAria")}>
        <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          {t("mainSection")}
        </p>
        <div className="flex flex-col gap-2">{MAIN_LINKS.map(renderLink)}</div>

        <p className="px-3 pt-5 pb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          {t("storeSection")}
        </p>
        <div className="flex flex-col gap-2">{STORE_LINKS.map(renderLink)}</div>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 bg-primary/15 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/25"
        >
          <Store className="size-4 text-secondary" aria-hidden="true" />
          {t("viewStore")}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 border-r border-border bg-card transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {body}
      </aside>
    </>
  );
}
