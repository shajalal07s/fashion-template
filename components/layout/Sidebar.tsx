"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
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
      { key: "attributes", href: "/dashboard/products/attributes" },
      { key: "colors", href: "/dashboard/products/colors" },
      { key: "invoices", href: "/dashboard/products/invoices" },
    ],
  },
  { key: "customers", href: "/dashboard/customers", icon: Users },
  { key: "coupons", href: "/dashboard/coupons", icon: Store },
];

const STORE_LINKS: SidebarLink[] = [{ key: "profile", href: "/dashboard/profile", icon: User }];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("Dashboard.sidebar");
  const pathname = usePathname();
  const [productsOpen, setProductsOpen] = useState(
    pathname.startsWith("/dashboard/products")
  );

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
      const expanded = productsOpen || childActive;
      return (
        <div key={link.key} className="flex flex-col gap-2">
          <Link
            href={link.href}
            onClick={() => {
              setProductsOpen(true);
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
                setProductsOpen((v) => !v);
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
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
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

      <nav className="flex-1 overflow-y-auto p-3" aria-label={t("navAria")}>
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
          "fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 border-r border-border bg-card transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {body}
      </aside>
    </>
  );
}
