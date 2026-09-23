"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { ProductSaleSummary } from "@/features/admin/analytics";

export function ProductInvoiceDoc({ row }: { row: ProductSaleSummary }) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-5 bg-white p-2">
      <div className="flex items-start justify-between gap-4 border-b-2 border-secondary pb-4">
        <div>
          <p className="font-heading text-xl font-bold text-foreground">Fashion Store</p>
          <p className="text-xs text-muted-foreground">Dhaka, Bangladesh</p>
        </div>
        <p className="bg-secondary px-3 py-1 text-sm font-bold tracking-wide text-white uppercase">
          {t("pinvoices.invTitle")}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="relative block size-20 shrink-0 overflow-hidden bg-muted">
          {row.image ? (
            <Image src={row.image} alt={row.name} fill sizes="80px" className="object-cover" />
          ) : null}
        </span>
        <div>
          <p className="font-heading text-lg font-bold">{row.name}</p>
          <p className="text-sm text-muted-foreground">
            {t("pinvoices.colQty")}: {row.qty} · {t("pinvoices.colOrders")}: {row.orders}
          </p>
          <p className="font-heading text-xl font-bold text-secondary">{money(row.revenue)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {t("pinvoices.invSoldTo")}
        </p>
        <div className="flex flex-col divide-y divide-border border border-border">
          {row.customers.map((c) => (
            <div key={c.name} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="font-bold text-secondary">× {c.qty}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-xs font-medium text-secondary">{t("orders.invThanks")}</p>
    </div>
  );
}
