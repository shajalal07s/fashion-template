"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CommissionStatus, TimelineEvent } from "@/features/admin/commission";

const STATUS_CLASS: Record<CommissionStatus, string> = {
  pending: "bg-primary/20 text-[#8a5a00]",
  approved: "bg-secondary/15 text-secondary",
  paid: "bg-green-600/10 text-green-700",
  refunded: "bg-purple-600/10 text-purple-700",
  reversed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  adjusted: "bg-sky-600/10 text-sky-700",
};

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  const t = useTranslations("Dashboard.commission");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

export function CommissionTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, idx) => {
        const done = idx < events.length - 1;
        return (
          <li key={idx} className="flex gap-3">
            <span className="flex flex-col items-center">
              {done ? (
                <CheckCircle2 className="size-5 shrink-0 text-green-600" aria-hidden="true" />
              ) : (
                <CircleDot className="size-5 shrink-0 text-secondary" aria-hidden="true" />
              )}
              {idx < events.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
            </span>
            <div className="flex flex-col gap-0.5 pb-5">
              <p className="text-sm font-bold text-foreground">{e.event}</p>
              <p className="text-xs text-muted-foreground">
                {e.date} · {e.time} · {e.user}
              </p>
              <p className="text-xs text-muted-foreground">{e.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
