"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { AdminOrder } from "@/features/admin/analytics";

interface InvoiceDocProps {
  order: AdminOrder;
  kind: "delivery" | "packing";
  courier?: string;
}

export function InvoiceDoc({ order, kind, courier }: InvoiceDocProps) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
  const timeOf = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-5 bg-white p-2">
      <div className="flex items-start justify-between gap-4 border-b-2 border-secondary pb-4">
        <div>
          <p className="font-heading text-xl font-bold text-foreground">Fashion Store</p>
          <p className="text-xs text-muted-foreground">Dhaka, Bangladesh</p>
        </div>
        <div className="text-right">
          <p className="bg-secondary px-3 py-1 text-sm font-bold tracking-wide text-white uppercase">
            {kind === "delivery" ? t("orders.invDeliveryTitle") : t("orders.invPackingTitle")}
          </p>
          <p className="mt-1 font-mono text-xs font-semibold">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <p className="font-bold tracking-wider text-muted-foreground uppercase">
            {t("orders.invBillTo")}
          </p>
          <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
          <p className="text-muted-foreground">{order.customerPhone}</p>
          <p className="text-muted-foreground">{order.city}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="font-bold tracking-wider text-muted-foreground uppercase">
            {t("orders.tableDate")}
          </p>
          <p className="text-sm font-medium">
            {dateOf(order.date)} {timeOf(order.date)}
          </p>
          <p className="text-muted-foreground">{t(`payment.${order.payment}`)}</p>
          {courier ? <p className="font-semibold text-secondary">{courier}</p> : null}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2 font-semibold">{t("orders.detailsItems")}</th>
            <th className="px-3 py-2 text-center font-semibold">{t("orders.invQty")}</th>
            {kind === "delivery" ? (
              <>
                <th className="px-3 py-2 text-right font-semibold">{t("products.tablePrice")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("orders.detailsTotal")}</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-b [&_tr]:border-border">
          {order.items.map((item, idx) => (
            <tr key={`${item.productId}-${idx}`}>
              <td className="px-3 py-2 font-medium">{item.name}</td>
              <td className="px-3 py-2 text-center">{item.quantity}</td>
              {kind === "delivery" ? (
                <>
                  <td className="px-3 py-2 text-right">{money(item.price)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {money(item.price * item.quantity)}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {kind === "delivery" ? (
        <div className="ml-auto flex w-56 flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("orders.detailsSubtotal")}</span>
            <span className="font-medium">{money(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("orders.detailsShipping")}</span>
            <span className="font-medium">{money(order.shipping)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1">
            <span className="font-bold">{t("orders.detailsTotal")}</span>
            <span className="font-bold text-secondary">{money(order.total)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-6 pt-6 text-xs">
        <div className="flex flex-1 flex-col items-center gap-6">
          <span className="h-px w-full bg-border" aria-hidden="true" />
          <span className="font-semibold text-muted-foreground">{t("orders.invSignAuth")}</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-6">
          <span className="h-px w-full bg-border" aria-hidden="true" />
          <span className="font-semibold text-muted-foreground">{t("orders.invSignCustomer")}</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-secondary">{t("orders.invThanks")}</p>
    </div>
  );
}
