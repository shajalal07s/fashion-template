"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductInvoiceDoc } from "@/components/admin/products/ProductInvoiceDoc";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { productSalesSummary } from "@/features/admin/analytics";

export default function DashboardProductInvoicesPage() {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const rows = useMemo(() => productSalesSummary(orders), [orders]);
  const selected = invoiceId ? rows.find((r) => r.id === invoiceId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("pinvoices.title")} description={t("pinvoices.subtitle")} />
      <Card className="border-border bg-card">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("pinvoices.colProduct")}</TableHead>
                <TableHead className="text-center">{t("pinvoices.colQty")}</TableHead>
                <TableHead className="text-center">{t("pinvoices.colOrders")}</TableHead>
                <TableHead className="text-right">{t("pinvoices.colRevenue")}</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">{t("pinvoices.viewInvoice")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="relative block size-11 shrink-0 overflow-hidden bg-muted">
                        {row.image ? (
                          <Image src={row.image} alt={row.name} fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="font-heading flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                            {(row.name[0] ?? "?").toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="max-w-56 truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{row.qty}</TableCell>
                  <TableCell className="text-center font-semibold">{row.orders}</TableCell>
                  <TableCell className="text-right font-bold text-secondary">{money(row.revenue)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setInvoiceId(row.id)}
                      aria-label={`${t("pinvoices.viewInvoice")} ${row.name}`}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setInvoiceId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <div id="invoice-print">
                <ProductInvoiceDoc row={selected} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setInvoiceId(null)}>
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
    </div>
  );
}
