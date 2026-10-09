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
  Package,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Trophy,
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
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { products } from "@/features/shop/products";
import { useAdminProductsStore, slugifyName } from "@/store/admin-products.store";
import { useAuthStore } from "@/store/auth.store";
import { Field } from "@/components/admin/products/edit/sections";
import { toast } from "sonner";

export type AttributeRow = [
  name: string,
  info: {
    products: number;
    stock: number;
    slug: string;
    author: string;
    createdAt: string;
    updatedAt: string;
  },
];

const PAGE_SIZE = 10;

type DialogKind = "view" | "stock" | "top" | "colors" | null;

export function AddAttributePanel({
  title,
  placeholder,
  buttonLabel,
  onAdd,
  existing = [],
  showMeta = false,
}: {
  title: string;
  placeholder: string;
  buttonLabel: string;
  onAdd: (name: string) => void;
  existing?: string[];
  showMeta?: boolean;
}) {
  const t = useTranslations("Dashboard.admin");
  const adminName = useAuthStore((s) => s.user?.name ?? "Admin");
  const [value, setValue] = useState("");
  const slug = slugifyName(value.trim());
  const duplicate =
    value.trim().length > 0 &&
    existing.some((e) => e.toLowerCase() === value.trim().toLowerCase());
  const submit = () => {
    if (!value.trim()) return;
    if (duplicate) {
      toast.error(t("attributes.sizeExists"));
      return;
    }
    onAdd(value.trim());
    setValue("");
  };
  return (
    <Card className="border-border bg-card pt-5 lg:sticky lg:top-24">
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <p className="px-1 pt-1 text-sm font-bold text-foreground">{title}</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="bg-card"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {showMeta && value.trim() ? (
          <div className="flex flex-col gap-1.5 border border-dashed border-border bg-muted/40 p-2.5 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">Slug</span>
              <span className="font-mono font-semibold">{slug || "—"}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.colAuthor")}
              </span>
              <span className="font-semibold">{adminName}</span>
            </p>
            {duplicate ? (
              <p className="font-semibold text-destructive">{t("attributes.sizeExists")}</p>
            ) : null}
          </div>
        ) : null}
        <Button size="sm" className="w-full gap-1.5" onClick={submit}>
          <Plus className="size-3.5" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SizeAddPanel({
  existing,
  onAdd,
}: {
  existing: string[];
  onAdd: (items: Array<{ name: string; slug: string }>) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const adminName = useAuthStore((s) => s.user?.name ?? "Admin");
  const [value, setValue] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const names = value.split(",").map((s) => s.trim()).filter(Boolean);
  const autoSlug = slugifyName(names[0] ?? "");
  const shownSlug = slugTouched && slug !== null ? slug : autoSlug;
  const duplicates = names.filter((n) =>
    existing.some((e) => e.toLowerCase() === n.toLowerCase())
  );
  const fresh = names.filter(
    (n) => !existing.some((e) => e.toLowerCase() === n.toLowerCase())
  );

  const submit = () => {
    if (fresh.length === 0) {
      if (names.length > 0) toast.error(t("attributes.sizeExists"));
      return;
    }
    onAdd(
      fresh.map((n, i) => ({
        name: n,
        slug: slugTouched && i === 0 && fresh.length === 1 ? slug || slugifyName(n) : slugifyName(n),
      }))
    );
    setValue("");
    setSlug(null);
    setSlugTouched(false);
  };

  return (
    <Card className="border-border bg-card pt-5 lg:sticky lg:top-24">
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <p className="px-1 pt-1 text-sm font-bold text-foreground">{t("attributes.sizesTitle")}</p>
        <Field label={t("attributes.seName")}>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (!slugTouched) setSlug(null);
            }}
            placeholder={t("attributes.attrSizePlaceholder")}
            className="bg-card"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </Field>
        <Field label="Slug">
          <Input
            value={slugTouched && slug !== null ? slug : autoSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="bg-card font-mono text-xs"
          />
        </Field>
        <div className="flex flex-col gap-1.5 border border-dashed border-border bg-muted/40 p-2.5 text-xs">
          <p className="flex items-center justify-between gap-2">
            <span className="font-bold tracking-wider text-muted-foreground uppercase">Slug</span>
            <span className="font-mono font-semibold">{shownSlug || "—"}</span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="font-bold tracking-wider text-muted-foreground uppercase">
              {t("attributes.colAuthor")}
            </span>
            <span className="font-semibold">{adminName}</span>
          </p>
          {duplicates.length > 0 ? (
            <p className="font-semibold text-destructive">
              {t("attributes.sizeExists")}: {duplicates.join(", ")}
            </p>
          ) : null}
        </div>
        <p className="px-1 text-[11px] text-muted-foreground">{t("attributes.bulkHint")}</p>
        <Button size="sm" className="w-full gap-1.5" onClick={submit}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("attributes.attrAddSize")}
          {fresh.length > 1 ? ` (${fresh.length})` : ""}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AttributesTable({
  rows,
  onBulkDelete,
}: {
  rows: AttributeRow[];
  onBulkDelete?: (names: string[]) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const orders = useAdminOrders();
  const renames = useAdminProductsStore((s) => s.sizeRenames);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{ kind: Exclude<DialogKind, null>; size: string } | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "products" | "stock" | "time">("products");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "products") return (a[1].products - b[1].products) * dir;
      if (sortKey === "stock") return (a[1].stock - b[1].stock) * dir;
      if (sortKey === "time")
        return ((a[1].updatedAt || a[1].createdAt || "") > (b[1].updatedAt || b[1].createdAt || "") ? 1 : -1) * dir;
      return a[0].localeCompare(b[0]) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const visible = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [sorted, safePage]
  );

  const activeSelected = useMemo(
    () => [...selected].filter((name) => rows.some(([n]) => n === name)),
    [selected, rows]
  );
  const allVisibleSelected =
    visible.length > 0 && visible.every(([n]) => selected.has(n));
  const someVisibleSelected = visible.some(([n]) => selected.has(n));

  const toggleOne = (name: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const [n] of visible) {
        if (checked) next.add(n);
        else next.delete(n);
      }
      return next;
    });
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? rows.filter(([n]) => selected.has(n)) : rows;
    if (list.length === 0) return;
    const lines = [
      ["size", "products", "stock", "slug", "author", "createdAt", "updatedAt"].join(","),
      ...list.map(([n, info]) =>
        [n, info.products, info.stock, info.slug, info.author, info.createdAt, info.updatedAt]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sizes-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("attributes.exportSuccess", { count: list.length }));
  };

  const toggleSort = (key: "name" | "products" | "stock" | "time") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortIcon = (key: "name" | "products" | "stock" | "time") => {
    if (sortKey !== key) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5 text-white" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3.5 text-white" aria-hidden="true" />
    );
  };

  const sortableHead = (
    key: "name" | "products" | "stock" | "time",
    label: string,
    className?: string
  ) => (
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

  const resolveOriginal = (display: string) => {
    for (const [orig, renamed] of Object.entries(renames)) {
      if (renamed === display) return orig;
    }
    return display;
  };

  const sizeProducts = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const [size] of rows) {
      const original = resolveOriginal(size);
      map.set(
        size,
        products.filter((p) => (p.sizes ?? []).includes(original) || (p.sizes ?? []).includes(size))
      );
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, renames]);

  const topSellers = useMemo(() => {
    if (!dialog || dialog.kind !== "top") return [];
    const list = sizeProducts.get(dialog.size) ?? [];
    const ids = new Set(list.map((p) => p.id));
    const map = new Map<string, { name: string; image: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        if (!ids.has(item.productId)) continue;
        const entry = map.get(item.productId) ?? {
          name: item.name,
          image: item.image,
          qty: 0,
          revenue: 0,
        };
        entry.qty += item.quantity;
        entry.revenue += item.price * item.quantity;
        map.set(item.productId, entry);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [dialog, orders, sizeProducts]);

  const sizeColors = useMemo(() => {
    if (!dialog || dialog.kind !== "colors") return [];
    const map = new Map<string, number>();
    for (const p of sizeProducts.get(dialog.size) ?? []) {
      for (const c of p.colors ?? []) map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [dialog, sizeProducts]);

  const dialogTitle =
    dialog?.kind === "view"
      ? t("attributes.dlgView")
      : dialog?.kind === "stock"
        ? t("attributes.dlgStock")
        : dialog?.kind === "top"
          ? t("attributes.dlgTop")
          : dialog?.kind === "colors"
            ? t("attributes.dlgColors")
            : "";
  const dialogList = dialog ? (sizeProducts.get(dialog.size) ?? []) : [];
  const maxStock = Math.max(1, ...dialogList.map((p) => p.stock));

  const actions = [
    { kind: "view", icon: Eye, label: t("attributes.dlgView") },
    { kind: "stock", icon: Package, label: t("attributes.dlgStock") },
    { kind: "top", icon: Trophy, label: t("attributes.dlgTop") },
    { kind: "colors", icon: Palette, label: t("attributes.dlgColors") },
  ] as const;

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
                {sortableHead("name", t("attributes.colAttribute"))}
                {sortableHead("products", t("attributes.colProducts"), "text-center")}
                {sortableHead("stock", t("attributes.colStock"), "text-right")}
                {sortableHead("time", t("attributes.colTime"), "text-right")}
                <TableHead>{t("attributes.colAuthor")}</TableHead>
                <TableHead className="w-40">{t("attributes.colAction")}</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {visible.map(([name, info]) => (
              <TableRow key={name} className={selected.has(name) ? "bg-secondary/5" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(name)}
                    onCheckedChange={(v) => toggleOne(name, v === true)}
                    aria-label={name}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono font-bold">
                    {name}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-semibold">{info.products}</TableCell>
                <TableCell className="text-right font-bold text-secondary">{info.stock}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {info.updatedAt || info.createdAt ? (
                    <>
                      <p className="text-xs font-medium text-foreground">
                        {format.dateTime(new Date(info.updatedAt || info.createdAt), {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format.dateTime(new Date(info.updatedAt || info.createdAt), {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      aria-hidden="true"
                      className="flex size-6 items-center justify-center bg-secondary/15 text-[10px] font-bold text-secondary"
                    >
                      {(info.author === "__system__"
                        ? t("attributes.systemAuthor")
                        : info.author)[0].toUpperCase()}
                    </span>
                    <span className="text-xs font-medium">
                      {info.author === "__system__" ? t("attributes.systemAuthor") : info.author}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {actions.map(({ kind, icon: Icon, label }) => (
                      <Button
                        key={kind}
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDialog({ kind, size: name })}
                        aria-label={`${label} ${name}`}
                        title={label}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </Button>
                    ))}
                    <Link
                      href={`/dashboard/products/attributes-size/${encodeURIComponent(name)}/edit`}
                      aria-label={`${t("attributes.dlgRename")} ${name}`}
                      title={t("attributes.dlgRename")}
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {dialog ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialogTitle} · <span className="font-mono text-secondary">{dialog.size}</span>
                </DialogTitle>
              </DialogHeader>

              {dialog.kind === "colors" ? (
                <div className="flex flex-wrap gap-2">
                  {sizeColors.length > 0 ? (
                    sizeColors.map(([hex, count]) => (
                      <span
                        key={hex}
                        className="inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
                      >
                        <span
                          className="size-4 border border-black/10"
                          style={{ backgroundColor: hex }}
                          aria-hidden="true"
                        />
                        <span className="font-mono uppercase">{hex}</span>
                        <span className="font-bold text-secondary">× {count}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("products.emptyDescription")}</p>
                  )}
                </div>
              ) : dialog.kind === "top" ? (
                <div className="flex flex-col gap-2">
                  {topSellers.length > 0 ? (
                    topSellers.map((s, i) => (
                      <div
                        key={s.name}
                        className="flex items-center gap-3 border border-border bg-card px-3 py-2"
                      >
                        <span className="font-heading flex size-7 shrink-0 items-center justify-center bg-secondary/15 text-sm font-bold text-secondary">
                          {i + 1}
                        </span>
                        <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                          {s.image ? (
                            <Image src={s.image} alt={s.name} fill sizes="40px" className="object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {t("pinvoices.colQty")}: {s.qty}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-secondary">
                          {money(s.revenue)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("attributes.noSales")}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border border border-border">
                  {dialogList.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        {dialog.kind === "stock" ? (
                          <span className="mt-1 block h-1.5 w-full max-w-40 bg-muted">
                            <span
                              className="block h-full bg-gradient-to-r from-primary to-secondary"
                              style={{ width: `${Math.min(100, (p.stock / maxStock) * 100)}%` }}
                            />
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.category}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-secondary">{p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
