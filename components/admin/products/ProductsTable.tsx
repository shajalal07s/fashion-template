"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  PackageSearch,
  Pencil,
  Power,
  Printer,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Link } from "@/i18n/navigation";
import {
  CategoryCell,
  PriceCell,
  ProductCell,
  ProductStatusCell,
  RatingCell,
  StockCell,
} from "@/components/admin/products/cells";
import { ProductInvoiceDoc } from "@/components/admin/products/ProductInvoiceDoc";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { productSalesSummary } from "@/features/admin/analytics";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { printInvoiceDoc } from "@/components/admin/print-invoice";

export interface ProductEditPatch {
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  category: string;
  isActive: boolean;
}

type SortKey = "name" | "price" | "stock" | "date";

const PAGE_SIZE = 10;

interface ProductsTableProps {
  items: Product[];
  view?: "active" | "trash";
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  onToggleActive?: (ids: string[], active: boolean) => void;
  onDelete?: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  onPurge?: (ids: string[]) => void;
}

export function ProductsTable({
  items,
  view = "active",
  selected: controlledSelected,
  onSelectionChange,
  onToggleActive,
  onDelete,
  onRestore,
  onPurge,
}: ProductsTableProps) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const orders = useAdminOrders();

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const selected = controlledSelected ?? internalSelected;
  const setSelected = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const next = typeof value === "function" ? value(selected) : value;
    if (onSelectionChange) onSelectionChange(next);
    else setInternalSelected(next);
  };

  const salesMap = useMemo(
    () => new Map(productSalesSummary(orders).map((s) => [s.id, s])),
    [orders]
  );

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
  const timeOf = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });

  const sorted = useMemo(() => {
    const list = [...items];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "price") return (a.price - b.price) * dir;
      if (sortKey === "stock") return (a.stock - b.stock) * dir;
      if (sortKey === "date") return (+new Date(a.createdAt) - +new Date(b.createdAt)) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return list;
  }, [items, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => items.some((p) => p.id === id)),
    [selected, items]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const someVisibleSelected = visible.some((p) => selected.has(p.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
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
      for (const p of visible) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
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

  const invoiceRow = invoiceId ? salesMap.get(invoiceId) ?? null : null;
  const isTrash = view === "trash";

  return (
    <Card className="border-border bg-card">
      {activeSelected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelected(new Set())}
            aria-label={t("products.bulkClear")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          <p className="text-sm font-semibold text-foreground">
            {t("products.bulkSelected", { count: activeSelected.length })}
          </p>
          {isTrash ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  onRestore?.(activeSelected);
                  setSelected(new Set());
                }}
              >
                {t("products.restoreAction")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => {
                  onPurge?.(activeSelected);
                  setSelected(new Set());
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("products.purgeAction")}
              </Button>
            </div>
          ) : (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                onToggleActive?.(activeSelected, true);
                setSelected(new Set());
              }}
            >
              {t("products.bulkPublish")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 bg-card"
              onClick={() => {
                onToggleActive?.(activeSelected, false);
                setSelected(new Set());
              }}
            >
              {t("products.bulkDraft")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={() => {
                onDelete?.(activeSelected);
                setSelected(new Set());
              }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("products.bulkDelete")}
            </Button>
          </div>
          )}
        </div>
      ) : null}

      <CardContent className="overflow-x-auto p-0">
        {visible.length > 0 ? (
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
                {sortableHead("name", t("products.tableProduct"))}
                {sortableHead("price", t("products.tablePrice"), "text-right")}
                {sortableHead("stock", t("products.tableStock"))}
                <TableHead>{t("products.tableCategory")}</TableHead>
                <TableHead className="text-center">{t("products.tableRating")}</TableHead>
                <TableHead>{t("products.tableStatus")}</TableHead>
                {sortableHead("date", t("products.colDate"), "text-right")}
                <TableHead className="w-28">{t("products.colAction")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => (
                <TableRow
                  key={product.id}
                  className={cn(selected.has(product.id) && "bg-secondary/5")}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={(v) => toggleOne(product.id, v === true)}
                      aria-label={product.name}
                    />
                  </TableCell>
                  <TableCell>
                    <ProductCell product={product} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PriceCell price={product.price} compareAtPrice={product.compareAtPrice} />
                  </TableCell>
                  <TableCell>
                    <StockCell stock={product.stock} />
                  </TableCell>
                  <TableCell>
                    <CategoryCell category={product.category} />
                  </TableCell>
                  <TableCell>
                    <RatingCell rating={product.rating} />
                  </TableCell>
                  <TableCell>
                    <ProductStatusCell active={product.isActive} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <p className="text-xs font-medium text-foreground">{dateOf(product.createdAt)}</p>
                    <p className="text-[11px] text-muted-foreground">{timeOf(product.createdAt)}</p>
                  </TableCell>
                  <TableCell>
                    {isTrash ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRestore?.([product.id])}
                          aria-label={`${t("products.restoreAction")} ${product.name}`}
                        >
                          <Undo2 className="size-4 text-green-600" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onPurge?.([product.id])}
                          aria-label={`${t("products.purgeAction")} ${product.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t("products.editAction")} ${product.name}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!salesMap.has(product.id)}
                        onClick={() => setInvoiceId(product.id)}
                        aria-label={`${t("products.invoiceAction")} ${product.name}`}
                      >
                        <FileText className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleActive?.([product.id], !product.isActive)}
                        aria-label={`${product.isActive ? t("products.draftAction") : t("products.publishAction")} ${product.name}`}
                      >
                        <Power
                          className={cn("size-4", product.isActive ? "text-green-600" : "text-muted-foreground")}
                          aria-hidden="true"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete?.([product.id])}
                        aria-label={`${t("products.deleteAction")} ${product.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8">
            <EmptyState
              icon={PackageSearch}
              title={t("products.emptyTitle")}
              description={t("products.emptyDescription")}
            />
          </div>
        )}
      </CardContent>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
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
      ) : null}

      <Dialog open={!!invoiceRow} onOpenChange={(open) => !open && setInvoiceId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {invoiceRow ? (
            <>
              <div id="invoice-print">
                <ProductInvoiceDoc row={invoiceRow} />
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
    </Card>
  );
}
