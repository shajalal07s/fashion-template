"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import {
  ChevronDown,
  Contact,
  Gift,
  Heart,
  Home,
  Images,
  Info,
  LayoutGrid,
  Newspaper,
  Search,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { MEGA_MENU_CATEGORIES } from "@/components/layout/header/nav";
import { products } from "@/features/shop/products";

interface MobileNavProps {
  onNavigate: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const t = useTranslations("Header");
  const format = useFormatter();
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState(false);

  const productBySlug = useMemo(() => {
    const map = new Map<string, (typeof products)[number]>();
    for (const product of products) map.set(product.slug, product);
    return map;
  }, []);

  const priceOf = (product: (typeof products)[number]) =>
    format.number(product.price, { style: "currency", currency: "BDT" });

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  const primaryLinks = [
    { key: "home", href: ROUTES.home, icon: Home },
    { key: "shop", href: "/shop", icon: Store },
    { key: "about", href: "/about", icon: Info },
    { key: "blog", href: "/blog", icon: Newspaper },
    { key: "gallery", href: "/gallery", icon: Images },
    { key: "contact", href: "/contact", icon: Contact },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="from-primary to-secondary flex shrink-0 items-center justify-between bg-gradient-to-r px-5 py-4 text-primary-foreground">
        <p className="text-sm font-semibold">{t("mobile.greeting")}</p>
        <Gift className="size-5" aria-hidden="true" />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label={t("mobileNav")}>
        <p className="text-muted-foreground px-3 pt-1 pb-2 text-xs font-bold tracking-wider uppercase">
          {t("mobile.menu")}
        </p>
        <div className="flex flex-col">
          {primaryLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.key}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
                  active
                    ? "text-foreground bg-muted/70"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <link.icon
                  className={cn("size-5", active ? "text-secondary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                {t(`nav.${link.key}`)}
                {active ? <span className="bg-secondary ml-auto size-1.5 rounded-full" /> : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpenCategories((v) => !v)}
            aria-expanded={openCategories}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
              pathname.startsWith("/products")
                ? "text-foreground bg-muted/70"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <LayoutGrid
              className={cn("size-5", pathname.startsWith("/products") ? "text-secondary" : "text-muted-foreground")}
              aria-hidden="true"
            />
            {t("nav.categories")}
            <ChevronDown
              className={cn("ml-auto size-4 transition-transform", openCategories && "rotate-180")}
              aria-hidden="true"
            />
          </button>

          {openCategories ? (
            <div className="mt-1 mb-2 flex flex-col">
              {MEGA_MENU_CATEGORIES.map((category) => (
                <div key={category.slug} className="mb-3">
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                      <category.icon className="text-secondary size-4" aria-hidden="true" />
                      {t(`categories.${category.slug}`)}
                    </span>
                    <Link
                      href={category.href}
                      onClick={onNavigate}
                      className="text-secondary text-xs font-semibold"
                    >
                      {t("megaMenu.viewAll")} →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {category.groups
                      .flatMap((g) => g.links)
                      .slice(0, 6)
                      .map((link) => {
                        const slug = link.href.split("/").pop() ?? "";
                        const product = productBySlug.get(slug);
                        const href = product
                          ? `/products/${product.category.toLowerCase()}/${product.slug}`
                          : link.href;
                        return (
                          <Link
                            key={link.href}
                            href={href}
                            onClick={onNavigate}
                            className="group/card flex flex-col gap-1 border border-border bg-white p-1 transition-colors hover:bg-section-2"
                          >
                            <span className="relative block h-20 w-full overflow-hidden bg-muted">
                              {product?.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product?.name ?? ""}
                                  fill
                                  sizes="100px"
                                  className="object-cover object-center transition-transform duration-500 group-hover/card:scale-110"
                                />
                              ) : (
                                <span className="text-primary font-heading flex h-full w-full items-center justify-center text-lg font-bold">
                                  {(product?.name ?? "?")[0]}
                                </span>
                              )}
                            </span>
                            <span className="text-foreground line-clamp-1 text-center text-[10px] font-medium">
                              {product?.name ?? t(link.labelKey)}
                            </span>
                            {product ? (
                              <span className="text-secondary text-center text-[11px] font-bold">
                                {priceOf(product)}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className="text-muted-foreground px-3 pt-4 pb-2 text-xs font-bold tracking-wider uppercase">
          {t("mobile.account")}
        </p>
        <div className="flex flex-col gap-1">
          <Link
            href="/wishlist"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Heart className="size-5" aria-hidden="true" />
            {t("mobile.wishlist")}
          </Link>
          <Link
            href="/cart"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {t("mobile.cart")}
          </Link>
          <Link
            href={ROUTES.login}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <User className="size-5" aria-hidden="true" />
            {t("mobile.profile")}
          </Link>
          <button
            type="button"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Search className="size-5" aria-hidden="true" />
            {t("mobile.search")}
          </button>
        </div>
      </nav>
    </div>
  );
}
