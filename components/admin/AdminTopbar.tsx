"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Menu, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const t = useTranslations("Dashboard.admin");
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenu}
          aria-label={t("topbar.openMenu")}
          className="lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <div className="relative hidden w-full max-w-md md:block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input placeholder={t("topbar.searchPlaceholder")} className="h-10 bg-muted pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/" className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t("topbar.viewStore")}
            </Button>
          </Link>
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center bg-secondary text-sm font-bold text-white"
          >
            {(user?.name ?? "A")[0].toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
