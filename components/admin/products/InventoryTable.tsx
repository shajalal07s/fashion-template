"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Eye, PackagePlus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

export interface InventoryRow {
  id: string;
  name: string;
  image: string;
  sku: string;
  category: string;
  slug: string;
  stock: number;
  status: "instock" | "low" | "outofstock" | "backorder";
  threshold: number;
}

const PAGE_SIZES = [10, 20, 50, 100];

const STATUS_LABEL: Record<InventoryRow["status"], "inStock" | "lowStock" | "outOfStock" | "backorder"> = {
  instock: "inStock",
  low: "lowStock",
  outofstock: "outOfStock",
  backorder: "backorder",
};

export function InventoryStatusBadge({ status }: { status: InventoryRow["status"] }) {
  const t = useTranslations("Dashboard.admin");
  return (
    <Badge
      className={cn(
        "font-semibold whitespace-nowrap",
        status === "instock" && "bg-green-600/10 text-green-700",
        status === "low" && "bg-secondary/15 text-secondary",
        status === "outofstock" && "bg-destructive/10 text-destructive",
        status === "backorder" && "bg-primary/20 text-[#8a5a00]"
      )}
    >
      {t(`inventory.${STATUS_LABEL[status]}`)}
    </Badge>
  );
}

export function InventoryTable({
  rows,
  onStockUpdate,
  onBulkDelete,
  pageSize: controlledPageSize,
  onPageSizeChange,
}: {
  rows: InventoryRow[];
  onStockUpdate?: (id: string, stock: number) => void;
  onBulkDelete?: (ids: string[]) => void;
  pageSize?: number;
  onPageSizeChange?: (n: number) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const [page, setPage] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState<number>(10);
  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = (n: number) => {
    if (onPageSizeChange) onPageSizeChange(n);
    else setInternalPageSize(n);
    setPage(0);
  };
  const [viewId, setViewId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<{ id: string; value: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const maxStock = useMemo(() => Math.max(1, ...rows.map((r) => r.stock)), [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => rows.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [rows, safePage, pageSize]
  );

  const viewed = viewId ? rows.find((r) => r.id === viewId) ?? null : null;
  const editing = editStock ? rows.find((r) => r.id === editStock.id) ?? null : null;

  const resultStatus = (stock: number, threshold: number): InventoryRow["status"] =>
    stock <= 0 ? "outofstock" : stock < threshold ? "low" : "instock";

  const openUpdate = (id: string, value: number) => {
    setViewId(null);
    setEditStock({ id, value });
  };

  const activeSelected = useMemo(
    () => [...selected].filter((id) => rows.some((r) => r.id === id)),
    [selected, rows]
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

  const handleExport = () => {
    const list = activeSelected.length > 0 ? rows.filter((r) => selected.has(r.id)) : rows;
    if (list.length === 0) return;
    const lines = [
      ["id", "name", "sku", "stock", "status", "threshold"].join(","),
      ...list.map((r) =>
        [r.id, r.name, r.sku, r.stock, r.status, r.threshold].map(csvEscape).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("products.exportSuccess", { count: list.length }));
  };

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
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5" onClick={handleExport}>
              <Download className="size-3.5" aria-hidden="true" />
              {t("products.exportBtn")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={() => {
                onBulkDelete?.(activeSelected);
                setSelected(new Set());
              }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("products.bulkDelete")}
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
              <TableHead>{t("inventory.colProduct")}</TableHead>
              <TableHead>{t("inventory.colSku")}</TableHead>
              <TableHead>{t("inventory.colStock")}</TableHead>
              <TableHead>{t("inventory.colStatus")}</TableHead>
              <TableHead className="text-right">{t("inventory.colThreshold")}</TableHead>
              <TableHead className="w-24">{t("inventory.colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
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
                    <span className="max-w-48 truncate text-sm font-semibold text-foreground">
                      {row.slug ? (
                        <Link
                          href={`/products/${(row.category || "Women").toLowerCase()}/${row.slug}`}
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
                <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {row.sku || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex min-w-36 flex-col gap-1.5">
                    <span className="text-sm font-bold text-secondary">{row.stock}</span>
                    <div className="h-1.5 w-full bg-muted">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${Math.min(100, (row.stock / maxStock) * 100)}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <InventoryStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right font-semibold">{row.threshold}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewId(row.id)}
                      aria-label={`${t("inventory.viewTitle")} ${row.name}`}
                      title={t("inventory.viewTitle")}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditStock({ id: row.id, value: row.stock })}
                      aria-label={`${t("inventory.updateTitle")} ${row.name}`}
                      title={t("inventory.updateTitle")}
                    >
                      <PackagePlus className="size-4 text-secondary" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v) || 10);
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs font-medium text-muted-foreground">
            {t("orders.pageOf", { page: safePage + 1, pages: pageCount })}
          </p>
        </div>
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold">
                  {t("inventory.viewTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <span className="relative block size-20 shrink-0 overflow-hidden bg-muted">
                  {viewed.image ? (
                    <Image src={viewed.image} alt={viewed.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="font-heading flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                      {(viewed.name[0] ?? "?").toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-bold text-foreground">{viewed.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{viewed.sku || "—"}</p>
                  <InventoryStatusBadge status={viewed.status} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-border bg-card p-3">
                  <p className="font-heading text-xl font-bold text-secondary">{viewed.stock}</p>
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {t("inventory.colStock")}
                  </p>
                </div>
                <div className="border border-border bg-card p-3">
                  <p className="font-heading text-xl font-bold">{viewed.threshold}</p>
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {t("inventory.colThreshold")}
                  </p>
                </div>
                <div className="border border-border bg-card p-3">
                  <p className="font-heading text-xl font-bold">
                    {Math.max(0, viewed.stock - viewed.threshold)}
                  </p>
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {t("inventory.inStock")}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${Math.min(100, (viewed.stock / maxStock) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>
                  {t("orders.detailsClose")}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => openUpdate(viewed.id, viewed.stock)}>
                  <PackagePlus className="size-3.5" aria-hidden="true" />
                  {t("inventory.updateTitle")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditStock(null)}>
        <DialogContent className="sm:max-w-md">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold">
                  {t("inventory.updateTitle")} · {editing.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-4 border border-border bg-card px-3 py-2.5">
                <span className="relative block size-12 shrink-0 overflow-hidden bg-muted">
                  {editing.image ? (
                    <Image src={editing.image} alt={editing.name} fill sizes="48px" className="object-cover" />
                  ) : null}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-semibold">{editing.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("inventory.colThreshold")}: {editing.threshold}
                  </p>
                </div>
                <InventoryStatusBadge status={editing.status} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setEditStock((s) => (s ? { ...s, value: Math.max(0, s.value - 1) } : s))
                  }
                  aria-label="-1"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={editStock?.value ?? 0}
                  onChange={(e) =>
                    setEditStock((s) => (s ? { ...s, value: Number(e.target.value) || 0 } : s))
                  }
                  className="bg-card text-center font-mono font-bold"
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setEditStock((s) => (s ? { ...s, value: s.value + 1 } : s))}
                  aria-label="+1"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex items-center justify-between border border-dashed border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium text-muted-foreground">
                  {t("inventory.colStatus")}
                </span>
                <InventoryStatusBadge
                  status={resultStatus(editStock?.value ?? 0, editing.threshold)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditStock(null)}>
                  {t("orders.detailsClose")}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (editStock) onStockUpdate?.(editStock.id, editStock.value);
                    setEditStock(null);
                  }}
                >
                  <PackagePlus className="size-3.5" aria-hidden="true" />
                  {t("inventory.updateTitle")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
