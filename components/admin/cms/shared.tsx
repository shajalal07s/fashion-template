"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CmsStatus } from "@/features/admin/cms";

const STATUS_CLASS: Record<CmsStatus, string> = {
  active: "bg-green-600/10 text-green-700",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-600/10 text-green-700",
  scheduled: "bg-primary/20 text-[#8a5a00]",
  archived: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
};

export function CmsStatusBadge({ status }: { status: CmsStatus }) {
  const t = useTranslations("Dashboard.cms");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}
