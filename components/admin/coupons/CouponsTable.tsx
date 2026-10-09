"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Pencil,
  Printer,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { PackageSearch } from "lucide-react";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Coupon } from "@/store/coupons.store";

type SortKey = "code" | "discount" | "used" | "expiry";

export function CouponsTable({
  rows,
  pageSize: controlledPageSize,
  onPageSizeChange,
  onBulkDelete,
}: {
  rows: Coupon[];
  pageSize?: number;
  onPageSizeChange?: (n: number) => void;
  onBulkDelete?: (codes: string[]) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const tc = useTranslations("Dashboard.calls");
  const [page, setPage] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [viewCode, setViewCode] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = (n: number) => {
    if (onPageSizeChange) onPageSizeChange(n);
    else setInternalPageSize(n);
    setPage(0);
  };

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "discount") return a.discount.localeCompare(b.discount) * dir;
      if (sortKey === "used") return (a.used - b.used) * dir;
      if (sortKey === "expiry") return a.expiry.localeCompare(b.expiry) * dir;
      return a.code.localeCompare(b.code) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  );

  const activeSelected = useMemo(
    () => [...selected].filter((code) => rows.some((r) => r.code === code)),
    [selected, rows]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.code));
  const someVisibleSelected = visible.some((r) => selected.has(r.code));

  const toggleOne = (code: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (checked) next.add(r.code);
        else next.delete(r.code);
      }
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
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

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(tc("copied"));
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(tc("copied"));
    }
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? rows.filter((r) => selected.has(r.code)) : rows;
    if (list.length === 0) return;
    const lines = [
      ["code", "discount", "used", "limit", "status", "expiry"].join(","),
      ...list.map((r) => [r.code, r.discount, r.used, r.limit, r.status, r.expiry].map(csvEscape).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coupons-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("coupons.exportSuccess", { count: list.length }));
  };

  const viewed = viewCode ? rows.find((r) => r.code === viewCode) ?? null : null;
  const usagePct = (c: Coupon) => Math.min(100, Math.round((c.used / Math.max(1, c.limit)) * 100));

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
                {sortableHead("code", t("coupons.tableCode"))}
                {sortableHead("discount", t("coupons.tableDiscount"))}
                <TableHead>{t("coupons.tableUsage")}</TableHead>
                <TableHead>{t("coupons.tableStatus")}</TableHead>
                {sortableHead("expiry", t("coupons.tableExpiry"), "text-right")}
                <TableHead className="w-32">{t("coupons.colAction")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((coupon) => (
                <TableRow key={coupon.code} className={cn(selected.has(coupon.code) && "bg-secondary/5")}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(coupon.code)}
                      onCheckedChange={(v) => toggleOne(coupon.code, v === true)}
                      aria-label={coupon.code}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 bg-muted px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-foreground">
                      <Scissors className="size-3.5 text-secondary" aria-hidden="true" />
                      {coupon.code}
                      <button
                        type="button"
                        onClick={() => void copyCode(coupon.code)}
                        aria-label={coupon.code}
                        className="flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-secondary"
                      >
                        {copied === coupon.code ? (
                          <Check className="size-3 text-green-600" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3" aria-hidden="true" />
                        )}
                      </button>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                    {coupon.discount}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-32 flex-col gap-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {coupon.used} / {coupon.limit}
                      </p>
                      <div className="h-1.5 w-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${usagePct(coupon)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-semibold whitespace-nowrap",
                        coupon.status === "active"
                          ? "bg-green-600/10 text-green-700"
                          : "bg-primary/20 text-[#8a5a00]"
                      )}
                    >
                      {t(`coupons.${coupon.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                    {coupon.expiry}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setViewCode(coupon.code)}
                        aria-label={`${t("coupons.viewTitle")} ${coupon.code}`}
                        title={t("coupons.viewTitle")}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                      <Link href={`/dashboard/coupons/${coupon.code}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t("coupons.editTitle")} ${coupon.code}`}
                          title={t("coupons.editTitle")}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setViewCode(coupon.code)}
                        aria-label={`${t("orders.invPrint")} ${coupon.code}`}
                        title={t("orders.invPrint")}
                      >
                        <Printer className="size-4 text-secondary" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              {[10, 20, 50, 100].map((n) => (
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewCode(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <Scissors className="size-4 text-secondary" aria-hidden="true" />
                  {t("coupons.viewTitle")} · <span className="font-mono">{viewed.code}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between border border-dashed border-secondary/40 bg-secondary/5 px-4 py-5 text-center">
                  <span className="w-full font-heading text-3xl font-bold tracking-widest text-secondary">
                    {viewed.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("coupons.tableDiscount")}</span>
                  <span className="font-bold text-secondary">{viewed.discount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("coupons.tableUsage")}</span>
                  <span className="font-medium">
                    {viewed.used} / {viewed.limit}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${usagePct(viewed)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("coupons.tableStatus")}</span>
                  <Badge
                    className={cn(
                      "font-semibold",
                      viewed.status === "active"
                        ? "bg-green-600/10 text-green-700"
                        : "bg-primary/20 text-[#8a5a00]"
                    )}
                  >
                    {t(`coupons.${viewed.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("coupons.tableExpiry")}</span>
                  <span className="font-medium">{viewed.expiry}</span>
                </div>
              </div>
              <div id="invoice-print" className="hidden">
                <CouponSlip coupon={viewed} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewCode(null)}>
                  {t("orders.detailsClose")}
                </Button>
                <Link href={`/dashboard/coupons/${viewed.code}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {t("coupons.editTitle")}
                  </Button>
                </Link>
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

function CouponSlip({ coupon }: { coupon: Coupon }) {
  return (
    <div className="flex flex-col gap-4 bg-white p-2 text-center">
      <p className="font-heading text-xl font-bold text-foreground">Fashion Store</p>
      <p className="mx-auto w-fit bg-secondary px-6 py-2 font-heading text-2xl font-bold tracking-[0.2em] text-white">
        {coupon.code}
      </p>
      <p className="font-heading text-4xl font-bold text-secondary">{coupon.discount}</p>
      <p className="text-xs text-muted-foreground">Valid till {coupon.expiry}</p>
    </div>
  );
}
