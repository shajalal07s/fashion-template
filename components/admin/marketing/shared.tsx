"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MktStatus } from "@/features/admin/marketing";

const STATUS_CLASS: Record<MktStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/20 text-[#8a5a00]",
  active: "bg-green-600/10 text-green-700",
  paused: "bg-primary/20 text-[#8a5a00]",
  expired: "bg-muted text-muted-foreground",
  completed: "bg-secondary/15 text-secondary",
  disabled: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  sending: "bg-secondary/15 text-secondary",
  sent: "bg-green-600/10 text-green-700",
};

export function MarketingStatusBadge({ status }: { status: MktStatus }) {
  const t = useTranslations("Dashboard.marketing");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function useCountdown(endsAt: number): { days: number; hours: number; minutes: number; seconds: number; over: boolean } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, endsAt - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    over: diff <= 0,
  };
}

export function Countdown({ endsAt }: { endsAt: number }) {
  const t = useTranslations("Dashboard.marketing");
  const { days, hours, minutes, seconds } = useCountdown(endsAt);
  const cells = [
    { v: pad(days), l: t("days") },
    { v: pad(hours), l: t("hours") },
    { v: pad(minutes), l: t("minutes") },
    { v: pad(seconds), l: t("seconds") },
  ];
  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label={`${days}d ${hours}h ${minutes}m ${seconds}s`}>
      {cells.map((c, i) => (
        <span key={c.l} className="flex items-center gap-1.5">
          <span className="flex min-w-14 flex-col items-center bg-[#1a0d00] px-2 py-1.5">
            <span className="font-heading text-lg leading-none font-bold text-white tabular-nums">{c.v}</span>
            <span className="text-[10px] font-semibold tracking-wider text-white/70 uppercase">{c.l}</span>
          </span>
          {i < cells.length - 1 ? <span className="font-bold text-secondary">:</span> : null}
        </span>
      ))}
    </div>
  );
}
