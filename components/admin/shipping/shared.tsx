"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShipStatus } from "@/features/admin/shipping";

const STATUS_CLASS: Record<ShipStatus, string> = {
  active: "bg-green-600/10 text-green-700",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/20 text-[#8a5a00]",
};

export function ShippingStatusBadge({ status }: { status: ShipStatus }) {
  const t = useTranslations("Dashboard.shipping");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}
