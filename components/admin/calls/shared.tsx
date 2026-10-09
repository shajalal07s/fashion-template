"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CallOutcome, Priority, QueueStatus } from "@/features/admin/calls";

const QUEUE_STYLES: Record<QueueStatus, string> = {
  waiting: "bg-secondary/15 text-secondary",
  calling: "bg-primary/20 text-[#8a5a00]",
  done: "bg-green-600/10 text-green-700",
};

const OUTCOME_STYLES: Record<CallOutcome, string> = {
  completed: "bg-green-600/10 text-green-700",
  missed: "bg-secondary/15 text-secondary",
  failed: "bg-destructive/10 text-destructive",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive",
  normal: "bg-primary/20 text-[#8a5a00]",
  low: "bg-muted text-muted-foreground",
};

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const t = useTranslations("Dashboard.calls");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", QUEUE_STYLES[status])}>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const t = useTranslations("Dashboard.calls");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", OUTCOME_STYLES[outcome])}>
      {t(`status.${outcome}`)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations("Dashboard.calls");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", PRIORITY_STYLES[priority])}>
      {t(`priority.${priority}`)}
    </Badge>
  );
}

export function useCallFormat() {
  const format = useFormatter();
  return {
    date: (iso: string) =>
      format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" }),
    time: (iso: string) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" }),
  };
}

export function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, header: string[], lines: Array<Array<string | number | boolean>>): void {
  const content = [header.join(","), ...lines.map((cells) => cells.map(csvEscape).join(","))].join(
    "\n"
  );
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
