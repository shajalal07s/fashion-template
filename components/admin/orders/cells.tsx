"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminOrder, AdminOrderItem, AdminOrderStatus } from "@/features/admin/analytics";

export const ORDER_STATUSES: AdminOrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export function useMoney() {
  const format = useFormatter();
  return (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
}

export function OrderIdCell({ id }: { id: string }) {
  return (
    <span className="font-mono text-xs font-semibold whitespace-nowrap">{id}</span>
  );
}

export function CustomerCell({
  name,
  phone,
  city,
}: {
  name: string;
  phone: string;
  city: string;
}) {
  return (
    <>
      <p className="text-sm font-medium whitespace-nowrap text-foreground">{name}</p>
      <p className="text-xs whitespace-nowrap text-muted-foreground">
        {phone} · {city}
      </p>
    </>
  );
}

export interface PreviewItem {
  productId: string;
  name: string;
  image: string;
  price: number;
}

export function ItemsCell({
  items,
  onPreview,
}: {
  items: AdminOrderItem[];
  onPreview: (item: PreviewItem) => void;
}) {
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className="flex items-center gap-2">
      <span className="flex -space-x-2">
        {items.slice(0, 3).map((item, idx) => (
          <button
            key={`${item.productId}-${idx}`}
            type="button"
            onClick={() =>
              onPreview({
                productId: item.productId,
                name: item.name,
                image: item.image,
                price: item.price,
              })
            }
            aria-label={`${item.name}`}
            className="relative block size-8 shrink-0 cursor-pointer overflow-hidden border border-white bg-muted shadow-sm transition-transform hover:scale-110 hover:ring-2 hover:ring-secondary"
          >
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="32px" className="object-cover" />
            ) : (
              <span className="font-heading flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                {(item.name[0] ?? "?").toUpperCase()}
              </span>
            )}
          </button>
        ))}
      </span>
      <span className="flex flex-col">
        <Badge variant="outline" className="w-fit font-semibold">
          {count}
        </Badge>
        <span className="max-w-28 truncate text-[11px] text-muted-foreground">
          {items[0]?.name ?? ""}
        </span>
      </span>
    </div>
  );
}

export function PaymentCell({ payment }: { payment: AdminOrder["payment"] }) {
  const t = useTranslations("Dashboard.admin");
  return (
    <span className="text-xs whitespace-nowrap text-muted-foreground">
      {t(`payment.${payment}`)}
    </span>
  );
}

export function TotalCell({ total }: { total: number }) {
  const money = useMoney();
  return (
    <span className="text-right font-bold whitespace-nowrap text-secondary">{money(total)}</span>
  );
}

export function StatusCell({
  status,
  editable,
  onChange,
}: {
  status: AdminOrderStatus;
  editable: boolean;
  onChange?: (status: AdminOrderStatus) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  if (!editable) return <StatusBadge status={status} />;
  return (
    <Select value={status} onValueChange={(v) => onChange?.(v as AdminOrderStatus)}>
      <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("orders.statusEditLabel")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {t(`status.${s}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateCell({ date }: { date: string }) {
  const format = useFormatter();
  return (
    <>
      <p className="text-xs font-medium whitespace-nowrap text-foreground">
        {format.dateTime(new Date(date), { day: "numeric", month: "short", year: "numeric" })}
      </p>
      <p className="text-[11px] whitespace-nowrap text-muted-foreground">
        {format.dateTime(new Date(date), { hour: "2-digit", minute: "2-digit" })}
      </p>
    </>
  );
}
