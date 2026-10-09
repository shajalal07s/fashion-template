"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Package,
  ShoppingCart,
  Star,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { lowStockProducts } from "@/features/admin/analytics";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { useProductReviews, useReviewReports } from "@/store/reviews.store";
import { useReturnRequests, useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";

interface NotifItem {
  key: string;
  icon: LucideIcon;
  text: string;
  sub: string;
  href: string;
}

const READ_KEY = "admin-notif-read";

function loadRead(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function AdminNotifications() {
  const t = useTranslations("Dashboard.admin");
  const orders = useAdminOrders();
  const productReviews = useProductReviews();
  const reports = useReviewReports();
  const returns = useReturnRequests();
  const shipments = useReturnsStore((s) => s.shipments);

  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : loadRead()
  );

  const items: NotifItem[] = useMemo(() => {
    const list: NotifItem[] = [];
    const pendingOrders = orders.filter((o) => o.status === "pending");
    if (pendingOrders.length > 0) {
      list.push({
        key: "pending-orders",
        icon: ShoppingCart,
        text: `${pendingOrders.length} pending orders`,
        sub: "Needs processing",
        href: "/dashboard/orders",
      });
    }
    const pendingReviews = productReviews.filter((r) => r.status === "pending");
    if (pendingReviews.length > 0) {
      list.push({
        key: "pending-reviews",
        icon: Star,
        text: `${pendingReviews.length} reviews awaiting publish`,
        sub: "Review moderation",
        href: "/dashboard/reviews/pending",
      });
    }
    const openReports = reports.filter((r) => r.status === "open" || r.status === "under_review");
    if (openReports.length > 0) {
      list.push({
        key: "open-reports",
        icon: AlertTriangle,
        text: `${openReports.length} reported reviews`,
        sub: "Needs attention",
        href: "/dashboard/reviews/reported",
      });
    }
    const pendingReturns = returns.filter((r) => r.status === "pending" || r.status === "awaiting" || r.status === "review");
    if (pendingReturns.length > 0) {
      list.push({
        key: "pending-returns",
        icon: Undo2,
        text: `${pendingReturns.length} return requests`,
        sub: "Awaiting decision",
        href: "/dashboard/returns/requests",
      });
    }
    const delayed = shipments.filter((s) => s.status === "delayed");
    if (delayed.length > 0) {
      list.push({
        key: "delayed-shipments",
        icon: Package,
        text: `${delayed.length} delayed shipments`,
        sub: "Tracking issues",
        href: "/dashboard/tracking/issues",
      });
    }
    for (const p of lowStockProducts(3)) {
      list.push({
        key: `low-${p.id}`,
        icon: Package,
        text: `${p.name} low stock (${p.stock})`,
        sub: "Restock soon",
        href: "/dashboard/products/inventory",
      });
    }
    return list.slice(0, 9);
  }, [orders, productReviews, reports, returns, shipments]);

  const unread = items.filter((i) => !read.includes(i.key));

  const markAllRead = () => {
    const keys = items.map((i) => i.key);
    setRead(keys);
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify(keys));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={t("topbar.notif.title")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
          >
            <Bell className="size-4" aria-hidden="true" />
            {unread.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center bg-secondary px-1 text-[10px] font-bold text-white">
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            ) : null}
          </button>
        }
      />
      <PopoverContent align="end" sideOffset={4} className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-heading text-sm font-bold">{t("topbar.notif.title")}</p>
          {unread.length > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-bold text-secondary hover:underline"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              {t("topbar.notif.markRead")}
            </button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {items.map((item) => {
              const seen = read.includes(item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href as "/dashboard/orders"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50",
                    !seen && "bg-secondary/5"
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center bg-secondary/10">
                    <item.icon className="size-4 text-secondary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">
                      {!seen ? <span className="mr-1.5 inline-block size-1.5 rounded-full bg-secondary" aria-hidden="true" /> : null}
                      {item.text}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">{item.sub}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6">
            <EmptyState icon={Bell} title={t("topbar.notif.empty")} description={t("topbar.notif.emptyDesc")} />
          </div>
        )}
        <div className="border-t border-border p-2">
          <Link href="/dashboard/settings/activity-logs" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="h-8 w-full text-xs">
              {t("topbar.notif.viewAll")}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
