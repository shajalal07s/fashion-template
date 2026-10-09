"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRef, useState } from "react";

export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const t = useTranslations("Dashboard.admin");
  const tp = useTranslations("Dashboard.profile");
  const { user, logout } = useAuth();
  const [popOpen, setPopOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openPop = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setPopOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setPopOpen(false);
    }, 200);
  };

  const initial = (user?.name ?? "A")[0].toUpperCase();

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
          <LanguageSwitcher variant="outline" className="h-10" />
          <ThemeToggle variant="outline" className="h-10 w-10" />
          <AdminNotifications />
          <Link href="/" className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="h-10 gap-1.5">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t("topbar.viewStore")}
            </Button>
          </Link>
          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  aria-label={tp("accountDetails")}
                  onMouseEnter={openPop}
                  onMouseLeave={scheduleClose}
                  onFocus={openPop}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-secondary text-sm font-bold text-white transition-colors hover:border-secondary"
                >
                  <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </span>
                </button>
              }
            />
            <PopoverContent
              align="end"
              sideOffset={4}
              className="w-64"
              onMouseEnter={openPop}
              onMouseLeave={scheduleClose}
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden bg-secondary text-lg font-bold text-white">
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{user?.name ?? tp("guest")}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user?.email ?? "—"}</span>
                    <span className="mt-0.5 inline-block bg-secondary/10 px-1.5 py-0.5 text-[10px] font-bold text-secondary uppercase">
                      {user?.role ?? tp("admin")}
                    </span>
                  </span>
                </div>
                <Link href="/dashboard/profile" className="w-full">
                  <Button size="sm" className="h-9 w-full gap-1.5">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    {tp("viewDetails")}
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 bg-card" onClick={() => logout()}>
                  <LogOut className="size-3.5" aria-hidden="true" />
                  {tp("logout")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
