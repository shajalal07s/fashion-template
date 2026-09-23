"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Printer,
  Star,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { InvoiceDoc } from "@/components/admin/orders/InvoiceDoc";
import {
  CustomerCell,
  DateCell,
  ItemsCell,
  OrderIdCell,
  PaymentCell,
  StatusCell,
  TotalCell,
} from "@/components/admin/orders/cells";
import { Link } from "@/i18n/navigation";
import { productPath } from "@/features/shop/categories";
import { products } from "@/features/shop/products";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AdminOrder, AdminOrderStatus } from "@/features/admin/analytics";

type SortKey = "date" | "customer" | "total";

const STATUSES: AdminOrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

type PaymentMethod = AdminOrder["payment"];

const PAYMENTS: PaymentMethod[] = ["cod", "bkash", "nagad", "card"];

const COURIERS = ["Pathao", "RedX", "eCourier", "Steadfast", "Sundarban"];

const PAGE_SIZE = 10;

interface OrdersTableProps {
  orders: AdminOrder[];
  /** compact: slim read-only table for dashboard widgets */
  mode?: "full" | "compact";
  limit?: number;
  onStatusChange?: (id: string, status: AdminOrderStatus) => void;
  onPaymentChange?: (id: string, payment: PaymentMethod) => void;
  onBulkStatus?: (ids: string[], status: AdminOrderStatus) => void;
  onBulkDelete?: (ids: string[]) => void;
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
}

export function OrdersTable({
  orders,
  mode = "full",
  limit = 8,
  onStatusChange,
  onPaymentChange,
  onBulkStatus,
  onBulkDelete,
  selected: controlledSelected,
  onSelectionChange,
}: OrdersTableProps) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const compact = mode === "compact";
  const editable = !!onStatusChange && !compact;

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selected = controlledSelected ?? internalSelected;
  const setSelected = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const next = typeof value === "function" ? value(selected) : value;
    if (onSelectionChange) onSelectionChange(next);
    else setInternalSelected(next);
  };
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailSlide, setDetailSlide] = useState(0);
  const [quickView, setQuickView] = useState<{
    productId: string;
    name: string;
    image: string;
    price: number;
  } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<AdminOrderStatus>("processing");
  const [draftPayment, setDraftPayment] = useState<PaymentMethod>("cod");
  const [invoice, setInvoice] = useState<{ id: string; kind: "delivery" | "packing" } | null>(null);
  const [couriers, setCouriers] = useState<Record<string, string>>({});
  const [bulkStatus, setBulkStatus] = useState<AdminOrderStatus>("processing");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
  const timeOf = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });

  const sorted = useMemo(() => {
    const list = [...orders];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "total") return (a.total - b.total) * dir;
      if (sortKey === "customer") return a.customerName.localeCompare(b.customerName) * dir;
      return (+new Date(a.date) - +new Date(b.date)) * dir;
    });
    return list;
  }, [orders, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = compact ? sorted.slice(0, limit) : sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const visibleIds = useMemo(() => new Set(visible.map((o) => o.id)), [visible]);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => visibleIds.has(id) || orders.some((o) => o.id === id)),
    [selected, visibleIds, orders]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o.id));
  const someVisibleSelected = visible.some((o) => selected.has(o.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "customer" ? "asc" : "desc");
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const o of visible) {
        if (checked) next.add(o.id);
        else next.delete(o.id);
      }
      return next;
    });
  };

  const openDetails = (id: string) => {
    setDetailSlide(0);
    setDetailsId(id);
  };
  const detailsOrder = detailsId ? orders.find((o) => o.id === detailsId) ?? null : null;
  const quickProduct = quickView ? products.find((p) => p.id === quickView.productId) ?? null : null;
  const editOrder = editId ? orders.find((o) => o.id === editId) ?? null : null;
  const invoiceOrder = invoice ? orders.find((o) => o.id === invoice.id) ?? null : null;

  const openEdit = (order: AdminOrder) => {
    setDraftStatus(order.status);
    setDraftPayment(order.payment);
    setEditId(order.id);
  };

  const saveEdit = () => {
    if (!editId) return;
    onStatusChange?.(editId, draftStatus);
    onPaymentChange?.(editId, draftPayment);
    toast.success(t("orders.toastOrderUpdated"));
    setEditId(null);
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5 text-white" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3.5 text-white" aria-hidden="true" />
    );
  };

  const sortableHead = (key: SortKey, label: string, className?: string) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-white/80"
      >
        {label}
        {sortIcon(key)}
      </button>
    </TableHead>
  );

  return (
    <Card className="border-border bg-card">
      {!compact && activeSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelected(new Set())}
            aria-label={t("orders.bulkClear")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          <p className="text-sm font-semibold text-foreground">
            {t("orders.bulkSelected", { count: activeSelected.length })}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as AdminOrderStatus)}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("orders.statusEditLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                onBulkStatus?.(activeSelected, bulkStatus);
                setSelected(new Set());
              }}
            >
              {t("orders.bulkApply")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-destructive hover:text-destructive"
              onClick={() => {
                onBulkDelete?.(activeSelected);
                setSelected(new Set());
              }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("orders.bulkDelete")}
            </Button>
          </div>
        </div>
      ) : null}

      <CardContent className="overflow-x-auto p-0">
        {visible.length > 0 ? (
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                {!compact ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!allVisibleSelected && someVisibleSelected}
                      onCheckedChange={(v) => toggleAllVisible(v === true)}
                      aria-label={t("orders.bulkSelected", { count: visible.length })}
                    />
                  </TableHead>
                ) : null}
                <TableHead>{t("orders.tableId")}</TableHead>
                {compact || !editable ? (
                  <TableHead>{t("orders.tableCustomer")}</TableHead>
                ) : (
                  sortableHead("customer", t("orders.tableCustomer"))
                )}
                <TableHead className="text-center">{t("orders.tableItems")}</TableHead>
                <TableHead>{t("orders.tablePayment")}</TableHead>
                {compact ? (
                  <TableHead className="text-right">{t("orders.tableTotal")}</TableHead>
                ) : (
                  sortableHead("total", t("orders.tableTotal"), "text-right")
                )}
                <TableHead>{t("orders.tableStatus")}</TableHead>
                {compact ? (
                  <TableHead className="text-right">{t("orders.tableDate")}</TableHead>
                ) : (
                  sortableHead("date", t("orders.tableDate"), "text-right")
                )}
                <TableHead className="w-12">
                  <span className="sr-only">{t("orders.viewAction")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => {
                return (
                  <TableRow key={order.id} className={cn(selected.has(order.id) && "bg-secondary/5")}>
                    {!compact ? (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(order.id)}
                          onCheckedChange={(v) => toggleOne(order.id, v === true)}
                          aria-label={order.id}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <OrderIdCell id={order.id} />
                    </TableCell>
                    <TableCell>
                      <CustomerCell
                        name={order.customerName}
                        phone={order.customerPhone}
                        city={order.city}
                      />
                    </TableCell>
                    <TableCell>
                      <ItemsCell
                        items={order.items}
                        onPreview={(item) =>
                          setQuickView({
                            productId: item.productId,
                            name: item.name,
                            image: item.image,
                            price: item.price,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <PaymentCell payment={order.payment} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TotalCell total={order.total} />
                    </TableCell>
                    <TableCell>
                      <StatusCell
                        status={order.status}
                        editable={editable}
                        onChange={(status) => onStatusChange?.(order.id, status)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DateCell date={order.date} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDetails(order.id)}
                          aria-label={`${t("orders.viewAction")} ${order.id}`}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {!compact ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`${t("orders.moreActions")} ${order.id}`}
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-52">
                              <DropdownMenuItem onClick={() => openDetails(order.id)}>
                                <Eye className="size-4 text-secondary" aria-hidden="true" />
                                {t("orders.viewAction")}
                              </DropdownMenuItem>
                              {editable ? (
                                <DropdownMenuItem onClick={() => openEdit(order)}>
                                  <Pencil className="size-4 text-secondary" aria-hidden="true" />
                                  {t("orders.editOrder")}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setInvoice({ id: order.id, kind: "delivery" })}
                              >
                                <Truck className="size-4 text-secondary" aria-hidden="true" />
                                {t("orders.deliveryInvoice")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setInvoice({ id: order.id, kind: "packing" })}
                              >
                                <Printer className="size-4 text-secondary" aria-hidden="true" />
                                {t("orders.packingSlip")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.success(
                                    t("orders.toastInvoiceMailed", { email: order.customerEmail })
                                  )
                                }
                              >
                                <Mail className="size-4 text-secondary" aria-hidden="true" />
                                {t("orders.sendInvoiceMail")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Truck className="size-4 text-secondary" aria-hidden="true" />
                                  {t("orders.assignCourier")}
                                  {couriers[order.id] ? (
                                    <span className="ml-auto text-xs font-semibold text-secondary">
                                      {couriers[order.id]}
                                    </span>
                                  ) : null}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {COURIERS.map((courier) => (
                                    <DropdownMenuItem
                                      key={courier}
                                      onClick={() => {
                                        setCouriers((prev) => ({ ...prev, [order.id]: courier }));
                                        toast.success(
                                          t("orders.toastCourierAssigned", {
                                            courier,
                                            id: order.id,
                                          })
                                        );
                                      }}
                                    >
                                      {couriers[order.id] === courier ? (
                                        <Check className="size-4 text-secondary" aria-hidden="true" />
                                      ) : (
                                        <span className="size-4" aria-hidden="true" />
                                      )}
                                      {courier}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8">
            <EmptyState
              icon={PackageSearch}
              title={t("orders.emptyTitle")}
              description={t("orders.emptyDescription")}
            />
          </div>
        )}
      </CardContent>

      {!compact && pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("orders.pageOf", { page: safePage + 1, pages: pageCount })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              {t("orders.prevPage")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              {t("orders.nextPage")}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detailsOrder ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-mono text-base">{detailsOrder.id}</DialogTitle>
                  <StatusBadge status={detailsOrder.status} />
                </div>
                <DialogDescription>
                  {dateOf(detailsOrder.date)} · {timeOf(detailsOrder.date)} ·{" "}
                  {t(`payment.${detailsOrder.payment}`)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {t("orders.detailsCustomer")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{detailsOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground">{detailsOrder.customerEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {detailsOrder.customerPhone} · {detailsOrder.city}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {t("orders.detailsSummary")}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("orders.detailsSubtotal")}</span>
                    <span className="font-medium">{money(detailsOrder.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("orders.detailsShipping")}</span>
                    <span className="font-medium">{money(detailsOrder.shipping)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                    <span className="font-semibold">{t("orders.detailsTotal")}</span>
                    <span className="font-bold text-secondary">{money(detailsOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("orders.detailsItems")} ({detailsOrder.items.reduce((n, i) => n + i.quantity, 0)})
                </p>
                {(() => {
                  const items = detailsOrder.items;
                  const slide = Math.min(detailSlide, items.length - 1);
                  const item = items[slide];
                  return (
                    <div className="relative border border-border bg-card">
                      <div className="flex items-center gap-3 p-3">
                        <span className="relative block size-20 shrink-0 overflow-hidden bg-muted">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {money(item.price)} × {item.quantity}
                          </p>
                          <p className="text-sm font-bold text-secondary">
                            {money(item.price * item.quantity)}
                          </p>
                        </div>
                        <span className="bg-muted px-2 py-1 font-mono text-[11px] font-bold whitespace-nowrap">
                          {slide + 1} / {items.length}
                        </span>
                      </div>
                      {items.length > 1 ? (
                        <>
                          <div className="pointer-events-none absolute inset-y-0 left-1 flex items-center">
                            <button
                              type="button"
                              onClick={() => setDetailSlide((slide - 1 + items.length) % items.length)}
                              aria-label={t("orders.prevPage")}
                              className="pointer-events-auto flex size-8 items-center justify-center border border-border bg-white shadow-md transition-colors hover:bg-secondary hover:text-white"
                            >
                              <ChevronLeft className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
                            <button
                              type="button"
                              onClick={() => setDetailSlide((slide + 1) % items.length)}
                              aria-label={t("orders.nextPage")}
                              className="pointer-events-auto flex size-8 items-center justify-center border border-border bg-white shadow-md transition-colors hover:bg-secondary hover:text-white"
                            >
                              <ChevronRight className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 pb-2.5">
                            {items.map((dot, idx) => (
                              <button
                                key={`${dot.productId}-${idx}`}
                                type="button"
                                onClick={() => setDetailSlide(idx)}
                                aria-label={`${idx + 1} / ${items.length}`}
                                className={
                                  idx === slide
                                    ? "size-2 rounded-full bg-secondary"
                                    : "size-2 rounded-full bg-border transition-colors hover:bg-secondary/50"
                                }
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("orders.tableStatus")}
                </span>
                {editable ? (
                  <Select
                    value={detailsOrder.status}
                    onValueChange={(v) => onStatusChange?.(detailsOrder.id, v as AdminOrderStatus)}
                  >
                    <SelectTrigger size="sm" className="h-8 w-36 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={detailsOrder.status} />
                )}
                <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setDetailsId(null)}>
                    {t("orders.detailsClose")}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editOrder} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          {editOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("orders.editTitle")}{" "}
                  <span className="font-mono text-sm text-muted-foreground">{editOrder.id}</span>
                </DialogTitle>
                <DialogDescription>
                  {editOrder.customerName} · {dateOf(editOrder.date)} {timeOf(editOrder.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {t("orders.tableStatus")}
                  </span>
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as AdminOrderStatus)}>
                    <SelectTrigger className="w-full bg-card" aria-label={t("orders.statusEditLabel")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {t("orders.tablePayment")}
                  </span>
                  <Select value={draftPayment} onValueChange={(v) => setDraftPayment(v as PaymentMethod)}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(`payment.${p}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditId(null)}>
                  {t("orders.editCancel")}
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  {t("orders.editSave")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!invoiceOrder} onOpenChange={(open) => !open && setInvoice(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {invoiceOrder && invoice ? (
            <>
              <div id="invoice-print">
                <InvoiceDoc
                  order={invoiceOrder}
                  kind={invoice.kind}
                  courier={couriers[invoiceOrder.id]}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setInvoice(null)}>
                  {t("orders.detailsClose")}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
                  <Printer className="size-3.5" aria-hidden="true" />
                  {t("orders.invPrint")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!quickView} onOpenChange={(open) => !open && setQuickView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {quickProduct ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold">{quickProduct.name}</DialogTitle>
                <DialogDescription>
                  {quickProduct.brand ?? quickProduct.category ?? ""} · {quickProduct.sku ?? ""}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-2">
                <span className="relative block h-64 w-full overflow-hidden bg-muted sm:h-72">
                  {quickProduct.images[0] ? (
                    <Image
                      src={quickProduct.images[0]}
                      alt={quickProduct.name}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{quickProduct.category ?? "—"}</Badge>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                      {quickProduct.rating?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-bold text-secondary">
                      {money(quickProduct.price)}
                    </span>
                    {quickProduct.compareAtPrice && quickProduct.compareAtPrice > quickProduct.price ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {money(quickProduct.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-muted-foreground">{t("products.tableStock")}:</span>
                    <span className="font-bold">{quickProduct.stock}</span>
                  </div>
                  {(quickProduct.colors ?? []).length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {quickProduct.colors!.slice(0, 5).map((color) => (
                        <span
                          key={color}
                          className="size-4 border border-black/10"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  ) : null}
                  {(quickProduct.sizes ?? []).length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {quickProduct.sizes!.map((size) => (
                        <Badge key={size} variant="outline" className="text-[11px]">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {quickProduct.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Link
                      href={productPath(quickProduct.category ?? "Women", quickProduct.slug)}
                      onClick={() => setQuickView(null)}
                    >
                      <Button size="sm">{t("orders.viewInStore")}</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setQuickView(null)}>
                      {t("orders.detailsClose")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : quickView ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold">{quickView.name}</DialogTitle>
                <DialogDescription>{t("orders.detailsItems")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-2">
                <span className="from-primary/15 to-secondary/15 relative flex h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br sm:h-72">
                  {quickView.image ? (
                    <Image
                      src={quickView.image}
                      alt={quickView.name}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-heading text-6xl font-bold text-primary" aria-hidden="true">
                      {(quickView.name[0] ?? "?").toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-bold text-secondary">
                      {money(quickView.price)}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setQuickView(null)}>
                      {t("orders.detailsClose")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
