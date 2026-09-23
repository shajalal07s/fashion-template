"use client";

import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function StatCard({ label, value, delta, deltaSuffix, icon: Icon, iconClassName }: StatCardProps) {
  const positive = delta >= 0;
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-2xl font-bold text-foreground md:text-3xl">{value}</p>
          <p
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              positive ? "text-green-600" : "text-destructive"
            )}
          >
            {positive ? (
              <TrendingUp className="size-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden="true" />
            )}
            {positive ? "+" : ""}
            {delta}%{deltaSuffix ? ` ${deltaSuffix}` : null}
          </p>
        </div>
        <span className={cn("flex size-11 shrink-0 items-center justify-center", iconClassName ?? "bg-primary/15 text-secondary")}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
