"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ArrowDownToLine,
  BarChart3,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Ticket,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { VendorHeader } from "@/components/vendor/VendorHeader";

interface VendorLink {
  key: string;
  href: string;
  icon: LucideIcon;
}

const LINKS: VendorLink[] = [
  { key: "overview", href: "/vendor", icon: LayoutDashboard },
  { key: "orders", href: "/vendor/orders", icon: ShoppingCart },
  { key: "products", href: "/vendor/products", icon: Package },
  { key: "earnings", href: "/vendor/earnings", icon: Wallet },
  { key: "payouts", href: "/vendor/payouts", icon: ArrowDownToLine },
  { key: "coupons", href: "/vendor/coupons", icon: Ticket },
  { key: "customers", href: "/vendor/customers", icon: Users },
  { key: "reviews", href: "/vendor/reviews", icon: Star },
  { key: "analytics", href: "/vendor/analytics", icon: BarChart3 },
  { key: "store", href: "/vendor/store", icon: Store },
  { key: "shipping", href: "/vendor/shipping", icon: Truck },
  { key: "settings", href: "/vendor/settings", icon: Settings },
  { key: "support", href: "/vendor/support", icon: LifeBuoy },
];

function VendorSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Dashboard.Vendor");
  const pathname = usePathname();

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
          "fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 border-r border-border bg-card transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Vendor navigation">
            <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Seller Central
            </p>
            <div className="flex flex-col gap-2">
              {LINKS.map((link) => {
                const isActive =
                  link.href === "/vendor" ? pathname === link.href : pathname.startsWith(link.href);
                const cls = cn(
                  "flex items-center gap-3 border px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-secondary bg-secondary font-semibold text-white"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                );
                return (
                  <Link key={link.key} href={link.href} onClick={onClose} aria-current={isActive ? "page" : undefined} className={cls}>
                    <link.icon className="size-4 shrink-0" aria-hidden="true" />
                    {t(`nav_${link.key}` as "nav_overview")}
                    {isActive ? <span className="ml-auto size-1.5 rounded-full bg-white" /> : null}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="border-t border-border p-3">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 bg-primary/15 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/25"
            >
              <Store className="size-4 text-secondary" aria-hidden="true" />
              View Store
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-muted/40">
      <VendorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <VendorHeader onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
