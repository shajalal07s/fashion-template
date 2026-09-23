import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminOrderStatus } from "@/features/admin/analytics";

const STATUS_STYLES: Record<AdminOrderStatus, string> = {
  delivered: "bg-green-600/10 text-green-700",
  shipped: "bg-secondary/15 text-secondary",
  processing: "bg-primary/20 text-[#8a5a00]",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  const t = useTranslations("Dashboard.admin");
  return (
    <Badge className={cn("font-semibold", STATUS_STYLES[status])}>
      {t(`status.${status}`)}
    </Badge>
  );
}
