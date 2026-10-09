"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductInvoiceDoc } from "@/components/admin/products/ProductInvoiceDoc";
import { products } from "@/features/shop/products";
import { toast } from "sonner";
import type { ProductSaleSummary } from "@/features/admin/analytics";
import { printInvoiceDoc } from "@/components/admin/print-invoice";

type SortKey = "name" | "qty" | "orders" | "revenue";

export function InvoicesTable({
  rows,
  pageSize: controlledPageSize,
}: {
  rows: ProductSaleSummary[];
  pageSize?: number;
  onPageSizeChange?: (n: number) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const [page, setPage] = useState(0);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const pageSize = controlledPageSize ?? 10;

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "qty") return (a.qty - b.qty) * dir;
      if (sortKey === "orders") return (a.orders - b.orders) * dir;
      if (sortKey === "revenue") return (a.revenue - b.revenue) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
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

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.id));

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
      for (const r of visible) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportRows = (list: ProductSaleSummary[]) => {
    if (list.length === 0) return;
    const lines = [
      ["product", "qty", "orders", "revenue"].join(","),
      ...list.map((r) => [r.name, r.qty, r.orders, r.revenue].map(csvEscape).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("products.exportSuccess", { count: list.length }));
  };

  const selectedRow = invoiceId ? rows.find((r) => r.id === invoiceId) ?? null : null;
  const productIdOf = (name: string) => products.find((p) => p.name === name)?.id;

  return (
    <Card className="border-border bg-card">
      {selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t("products.bulkSelected", { count: selectedRows.length })}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setBulkOpen(true)}>
              <Printer className="size-3.5" aria-hidden="true" />
              {t("orders.invPrint")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-card"
              onClick={() => exportRows(selectedRows)}
            >
              <Download className="size-3.5 text-secondary" aria-hidden="true" />
              {t("products.exportBtn")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setSelected(new Set())}
            >
              {t("products.bulkClear")}
            </Button>
          </div>
        </div>
      ) : null}
      <CardContent className="overflow-x-auto p-0">
        <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={!allVisibleSelected && someVisibleSelected}
                  onCheckedChange={(v) => toggleAllVisible(v === true)}
                  aria-label={t("products.bulkSelected", { count: visible.length })}
                />
              </TableHead>
              {sortableHead("name", t("pinvoices.colProduct"))}
              {sortableHead("qty", t("pinvoices.colQty"), "text-center")}
              {sortableHead("orders", t("pinvoices.colOrders"), "text-center")}
              {sortableHead("revenue", t("pinvoices.colRevenue"), "text-right")}
              <TableHead className="w-28">{t("pinvoices.colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const pid = products.find((p) => p.id === row.id)?.id ?? productIdOf(row.name);
              const detailsProduct = products.find((p) => p.id === row.id);
              const detailsHref = detailsProduct
                ? `/products/${(detailsProduct.category ?? "Women").toLowerCase()}/${detailsProduct.slug}`
                : undefined;
              return (
                <TableRow key={row.id} className={selected.has(row.id) ? "bg-secondary/5" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(v) => toggleOne(row.id, v === true)}
                      aria-label={row.name}
                    />
                  </TableCell>
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
                        {detailsHref ? (
                          <Link
                            href={detailsHref}
                            className="hover:text-secondary hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{row.qty}</TableCell>
                  <TableCell className="text-center font-semibold">{row.orders}</TableCell>
                  <TableCell className="text-right font-bold text-secondary">{money(row.revenue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setInvoiceId(row.id)}
                        aria-label={`${t("pinvoices.viewInvoice")} ${row.name}`}
                        title={t("pinvoices.viewInvoice")}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                      {pid ? (
                        <Link
                          href={`/dashboard/products/${pid}/edit`}
                          aria-label={`${t("products.editAction")} ${row.name}`}
                          title={t("products.editAction")}
                          className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setInvoiceId(row.id)}
                        aria-label={`${t("orders.invPrint")} ${row.name}`}
                        title={t("orders.invPrint")}
                      >
                        <Printer className="size-4 text-secondary" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t("orders.pageOf", { page: safePage + 1, pages: pageCount })}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 bg-card"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            {t("orders.prevPage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 bg-card"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            {t("orders.nextPage")}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setInvoiceId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedRow ? (
            <>
              <div id="invoice-print">
                <ProductInvoiceDoc row={selectedRow} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setInvoiceId(null)}>
                  {t("orders.detailsClose")}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => printInvoiceDoc()}>
                  <Printer className="size-3.5" aria-hidden="true" />
                  {t("orders.invPrint")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <div id="invoice-print" className="flex flex-col gap-8">
            {selectedRows.map((row) => (
              <div key={row.id} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <ProductInvoiceDoc row={row} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>
              {t("orders.detailsClose")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => printInvoiceDoc()}>
              <Printer className="size-3.5" aria-hidden="true" />
              {t("orders.invPrint")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
