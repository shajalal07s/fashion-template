"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export const heroPillClassName =
  "flex items-center gap-1.5 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25";

export function AccountingHero({
  eyebrow,
  title,
  subtitle,
  highlightLabel,
  highlightValue,
  highlightIcon: HighlightIcon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  highlightLabel: string;
  highlightValue: string;
  highlightIcon: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border py-0">
      <div className="flex flex-col gap-5 bg-gradient-to-r from-[#1a0d00] via-[#b35400] to-secondary px-5 py-7 md:px-8 md:py-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">{eyebrow}</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-white/80">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-3 backdrop-blur">
            <span className="flex size-10 items-center justify-center bg-white/15">
              <HighlightIcon className="size-5 text-white" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                {highlightLabel}
              </span>
              <span className="font-heading text-xl font-bold text-white">{highlightValue}</span>
            </span>
          </div>
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </Card>
  );
}
