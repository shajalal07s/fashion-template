"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useVendorNotifications, useVendorProfile, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  open: "bg-green-500",
  closed: "bg-destructive",
  vacation: "bg-primary",
};

export function VendorHeader({ onMenu }: { onMenu: () => void }) {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const notifications = useVendorNotifications();
  const setStoreStatus = useVendorStore((s) => s.setStoreStatus);
  const markRead = useVendorStore((s) => s.markNotificationsRead);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Menu" className="lg:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <div className="relative hidden w-full max-w-md md:block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input placeholder={t("searchPh")} className="h-10 bg-muted pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <DropdownMenu open={notifOpen} onOpenChange={(o) => {
            setNotifOpen(o);
            if (!o) markRead();
          }}>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={t("notifications")} className="relative" />
              }
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread > 0 ? (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center bg-destructive text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.slice(0, 6).map((n) => (
                <DropdownMenuItem key={n.id} className={cn(!n.read && "bg-secondary/5")}>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold">{n.text}</span>
                    <span className="text-[11px] text-muted-foreground">{n.date}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageSwitcher />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" aria-label={t("storeStatus")} />
              }
            >
              <span className={cn("size-2 rounded-full", STATUS_DOT[profile.status])} aria-hidden="true" />
              {t(`status_${profile.status}` as "status_open")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["open", "closed", "vacation"] as const).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStoreStatus(s)}>
                  <span className={cn("size-2 rounded-full", STATUS_DOT[s])} aria-hidden="true" />
                  {t(`status_${s}` as "status_open")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={profile.name} className="overflow-hidden" />
              }
            >
              <span aria-hidden="true" className="flex size-8 items-center justify-center bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                {profile.name[0]}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-bold">{profile.store}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/vendor/store" />}>{t("ddStore")}</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/vendor/store" />}>{t("ddSettings")}</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/vendor/support" />}>{t("ddHelp")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/" />}>{t("ddLogout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
