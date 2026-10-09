"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Package, Printer, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import type { VendorOrderStatus } from "@/features/vendor/vendor";
import { useVendorOrders, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NEXT_STATUS: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed", "returned"],
  completed: ["refunded"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", bold && "font-bold text-secondary")}>{value}</span>
    </div>
  );
}

export default function VendorOrderDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const orders = useVendorOrders();
  const store = useVendorStore();
  const [note, setNote] = useState("");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) => {
    if (!iso) return "—";
    return format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
  };

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_orders")}
          title={t("orderDetails")}
          subtitle={orderId}
          highlightLabel={t("tStatus")}
          highlightValue="—"
          highlightIcon={ShoppingCart}
        >
          <Link href="/vendor/orders" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("oTitle")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyOrders")} />
      </div>
    );
  }

  const setStatus = (status: VendorOrderStatus) => {
    store.patchOrder(order.id, { status });
    store.logOrderEvent(order.id, "Status changed", `${order.status} → ${status}`);
    toast.success(t("toastOrder"));
  };

  const submitNote = () => {
    const text = note.trim();
    if (!text) return;
    store.addOrderNote(order.id, text, "Ayesha");
    store.logOrderEvent(order.id, "Note added", text.slice(0, 80));
    setNote("");
    toast.success(t("noteAdded"));
  };

  const printDoc = () => {
    window.setTimeout(() => printInvoiceDoc(`Invoice ${order.id}`), 50);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_orders")}
        title={`${t("dOrder")} #${order.id}`}
        subtitle={`${order.customer} · ${dateOf(order.date)} · ${order.items.reduce((n, i) => n + i.qty, 0)} items`}
        highlightLabel={t("tStatus")}
        highlightValue={t(order.status)}
        highlightIcon={ShoppingCart}
      >
        <Link href="/vendor/orders" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("oTitle")}
        </Link>
        <button type="button" onClick={printDoc} className={heroPillClassName}>
          <Printer className="size-3.5" aria-hidden="true" />
          {t("printInvoice")}
        </button>
        <button
          type="button"
          onClick={() => { void navigator.clipboard.writeText(order.tracking || order.id); toast.success(t("copyTracking")); }}
          className={heroPillClassName}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {t("copyTracking")}
        </button>
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{t("updateStatus")}:</span>
        <Select
          value={order.status}
          onValueChange={(v) => {
            const next = v as VendorOrderStatus;
            if (next && (NEXT_STATUS[order.status].includes(next) || next === order.status)) {
              if (next !== order.status) setStatus(next);
            } else {
              toast.error(t("toastOrder"));
            }
          }}
        >
          <SelectTrigger className="h-9 w-44 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[order.status, ...NEXT_STATUS[order.status]].map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {order.status === "pending" ? (
          <Button size="sm" onClick={() => setStatus("processing")}>{t("process")}</Button>
        ) : null}
        {order.status === "processing" ? (
          <Button size="sm" onClick={() => setStatus("shipped")}>{t("ship")}</Button>
        ) : null}
        {(order.status === "pending" || order.status === "processing") ? (
          <Button size="sm" variant="outline" className="bg-card" onClick={() => setStatus("cancelled")}>
            {t("cancelBtn")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="border-b border-border px-4 py-3">
              <CardTitle className="font-heading text-base font-bold">
                {t("tProducts")} ({order.items.reduce((n, i) => n + i.qty, 0)})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tProducts")}</TableHead>
                    <TableHead className="text-right">{t("tTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} className="size-11 shrink-0 object-cover" loading="lazy" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{item.name}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                              {item.sku} · Qty {item.qty}{item.variation ? ` · ${item.variation}` : ""}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">{money(item.price * item.qty)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("dFinancial")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <KV label={t("subtotal")} value={money(order.subtotal)} />
              <KV label={t("discount")} value={money(order.discount + order.coupon)} />
              <KV label={t("shipping")} value={money(order.shipping)} />
              <KV label={t("tTotal")} value={money(order.total)} bold />
              <KV label={t("commission")} value={money(order.commission)} />
              <KV label={t("vendorEarning")} value={money(order.earning)} bold />
              <KV label={t("fRefundAmt")} value={money(order.refunded)} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("tNotes")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex gap-2">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePh")}
                  className="bg-card"
                  aria-label={t("addNote")}
                  onKeyDown={(e) => { if (e.key === "Enter") submitNote(); }}
                />
                <Button size="sm" className="h-9 shrink-0" onClick={submitNote} disabled={!note.trim()}>
                  {t("addNote")}
                </Button>
              </div>
              {(order.notes ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(order.notes ?? []).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 border border-border p-2.5">
                      <p className="min-w-0 flex-1 text-sm">
                        <span className="block font-semibold">{n.author} · {dateOf(n.date)}</span>
                        <span className="block text-muted-foreground">{n.text}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { store.deleteOrderNote(order.id, n.id); toast.success(t("noteDeleted")); }}
                        aria-label={`Delete note ${n.id}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
                <CustomerAvatar name={order.customer} size="sm" />
                {t("dCustomer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm font-bold">{order.customer}</p>
              <p className="truncate text-sm text-muted-foreground">{order.email}</p>
              <p className="text-sm text-muted-foreground">{order.phone}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card"
                  onClick={() => { void navigator.clipboard.writeText(order.email); toast.success(t("copyEmail")); }}
                >
                  {t("copyEmail")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card"
                  onClick={() => { void navigator.clipboard.writeText(order.phone); toast.success(t("copyPhone")); }}
                >
                  {t("copyPhone")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("payDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <KV label={t("fPayMethod")} value={order.payment} />
              <KV label={t("fTxn")} value={order.transactionId || "—"} />
              <KV label={t("fPayDate")} value={order.payDate || "—"} />
              <KV label={t("fPayAmount")} value={money(order.total)} bold />
              <KV label={t("tPayment2")} value={t(order.payStatus === "paid" ? "paid" : order.payStatus === "pending" ? "pending" : "refunded")} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("shipDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <KV label="Courier" value={order.courier || "—"} />
              <KV label={t("fShipDate")} value={order.shipDate || t("notShipped")} />
              <KV label="Tracking" value={order.tracking || t("notShipped")} />
              <KV label={t("dShipping")} value={order.address} />
              <KV label={t("deliveryStatus")} value={t(order.status)} bold />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("tTimeline")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(order.activity ?? []).length > 0 ? (
                <ol className="flex flex-col gap-3 border-l-2 border-secondary/30 pl-4">
                  {(order.activity ?? []).map((a, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-secondary" aria-hidden="true" />
                      <p className="font-bold">{a.event}</p>
                      <p className="text-xs text-muted-foreground">{dateOf(a.date)}</p>
                      <p className="text-muted-foreground">{a.detail}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div id="invoice-print" className="hidden" aria-hidden="true">
        <div className="bg-white p-4 text-sm">
          <p className="text-center font-heading text-xl font-bold">Ayesha Boutique — Invoice {order.id}</p>
          <p className="text-center">{order.customer} · {order.date} · {order.payment}</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between border-b py-1">
              <span>{item.name} × {item.qty}</span>
              <span>{money(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>{t("tTotal")}</span>
            <span>{money(order.total)}</span>
          </div>
          <p>{t("vendorEarning")}: {money(order.earning)} ({t("commission")} {money(order.commission)})</p>
        </div>
      </div>
    </div>
  );
}
