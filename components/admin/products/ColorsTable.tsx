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
  Pipette,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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
import { products } from "@/features/shop/products";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

export interface ColorRow {
  hex: string;
  productNames: string[];
  thumbs: string[];
  stock: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 10;

export const COLOR_NAMES: Array<{ name: string; hex: string }> = [
  { name: "red", hex: "#ff0000" },
  { name: "maroon", hex: "#800000" },
  { name: "burgundy", hex: "#800020" },
  { name: "pink", hex: "#ffc0cb" },
  { name: "hotpink", hex: "#ff69b4" },
  { name: "blush", hex: "#ffb6c1" },
  { name: "orange", hex: "#ffa500" },
  { name: "rust", hex: "#b7410e" },
  { name: "coral", hex: "#ff7f50" },
  { name: "gold", hex: "#ffd700" },
  { name: "mustard", hex: "#ffdb58" },
  { name: "yellow", hex: "#ffff00" },
  { name: "cream", hex: "#fffdd0" },
  { name: "beige", hex: "#f5f5dc" },
  { name: "khaki", hex: "#f0e68c" },
  { name: "peach", hex: "#ffe5b4" },
  { name: "olive", hex: "#808000" },
  { name: "green", hex: "#008000" },
  { name: "emerald", hex: "#50c878" },
  { name: "mint", hex: "#98ff98" },
  { name: "lime", hex: "#00ff00" },
  { name: "teal", hex: "#008080" },
  { name: "cyan", hex: "#00ffff" },
  { name: "skyblue", hex: "#87ceeb" },
  { name: "denim", hex: "#1560bd" },
  { name: "navy", hex: "#000080" },
  { name: "blue", hex: "#0000ff" },
  { name: "purple", hex: "#800080" },
  { name: "magenta", hex: "#ff00ff" },
  { name: "lavender", hex: "#e6e6fa" },
  { name: "brown", hex: "#a52a2a" },
  { name: "charcoal", hex: "#36454f" },
  { name: "gray", hex: "#808080" },
  { name: "silver", hex: "#c0c0c0" },
  { name: "white", hex: "#ffffff" },
  { name: "black", hex: "#000000" },
];

export const PRESET_COLORS = [
  "#f8ac0c",
  "#ff8000",
  "#ff962e",
  "#e11d48",
  "#0f766e",
  "#7c2d12",
  "#1a0d00",
  "#ffffff",
  "#000000",
  "#808080",
  "#ff0000",
  "#0000ff",
];

export function ColorAddPanel({
  existing,
  onAdd,
}: {
  existing: string[];
  onAdd: (hex: string) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const adminName = useAuthStore((s) => s.user?.name ?? "Admin");
  const [value, setValue] = useState("");
  const [picker, setPicker] = useState("#ff8000");

  const trimmed = value.trim();
  const isHexInput = trimmed.startsWith("#") || /^[0-9a-f]{3,6}$/i.test(trimmed);
  const normalized = trimmed.startsWith("#") ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`;
  const validHex = /^#[0-9a-f]{6}$/i.test(normalized);
  const duplicate =
    validHex && existing.some((e) => e.toLowerCase() === normalized);

  const suggestions = !isHexInput && trimmed.length > 0
    ? COLOR_NAMES.filter((c) => c.name.includes(trimmed.toLowerCase())).slice(0, 6)
    : [];

  const pick = (hex: string) => {
    setValue(hex);
    setPicker(hex);
  };

  const submit = () => {
    if (!validHex) {
      toast.error(t("colors.invalidHex"));
      return;
    }
    if (duplicate) {
      toast.error(t("attributes.sizeExists"));
      return;
    }
    onAdd(normalized);
    setValue("");
    setPicker("#ff8000");
  };

  return (
    <Card className="border-border bg-card pt-5 lg:sticky lg:top-24">
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <p className="px-1 pt-1 text-sm font-bold text-foreground">{t("colors.title")}</p>
        <div className="flex items-center gap-2">
          <label
            className="relative block size-10 shrink-0 cursor-pointer overflow-hidden border border-border"
            style={{ backgroundColor: validHex ? normalized : picker }}
            title={t("colors.addColor")}
          >
            <Pipette className="absolute inset-0 m-auto size-4 text-white drop-shadow" aria-hidden="true" />
            <input
              type="color"
              value={validHex ? normalized : picker}
              onChange={(e) => {
                setPicker(e.target.value);
                setValue(e.target.value);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t("colors.addColor")}
            />
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("colors.colorPlaceholder")}
            className="bg-card font-mono text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        {suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.hex}
                type="button"
                onClick={() => pick(s.hex)}
                className="inline-flex items-center gap-1.5 border border-border bg-card px-2 py-1 text-[11px] font-semibold transition-colors hover:border-secondary"
              >
                <span
                  className="size-3.5 border border-black/10"
                  style={{ backgroundColor: s.hex }}
                  aria-hidden="true"
                />
                {s.name}
                <span className="font-mono text-muted-foreground">{s.hex}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <p className="px-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {t("attributes.seColors")}
          </p>
          <div className="grid grid-cols-6 gap-1.5 px-1">
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => pick(hex)}
                aria-label={hex}
                title={hex}
                style={{ backgroundColor: hex }}
                className={`aspect-square border transition-transform hover:scale-110 ${
                  normalized === hex ? "border-secondary ring-2 ring-secondary" : "border-black/10"
                }`}
              />
            ))}
          </div>
        </div>
        {value.trim() ? (
          <div className="flex flex-col gap-1.5 border border-dashed border-border bg-muted/40 p-2.5 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">Slug</span>
              <span className="font-mono font-semibold">{normalized.replace("#", "") || "—"}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.colAuthor")}
              </span>
              <span className="font-semibold">{adminName}</span>
            </p>
            {!validHex && suggestions.length === 0 ? (
              <p className="font-semibold text-destructive">{t("colors.invalidHex")}</p>
            ) : null}
            {duplicate ? (
              <p className="font-semibold text-destructive">{t("attributes.sizeExists")}</p>
            ) : null}
          </div>
        ) : null}
        <Button size="sm" className="w-full gap-1.5" onClick={submit}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("colors.addColor")}
        </Button>
      </CardContent>
    </Card>
  );
}

type SortKey = "color" | "products" | "stock" | "time";

export function ColorsTable({
  rows,
  onBulkDelete,
}: {
  rows: ColorRow[];
  onBulkDelete?: (hexes: string[]) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("products");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewHex, setViewHex] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "products") return (a.productNames.length - b.productNames.length) * dir;
      if (sortKey === "stock") return (a.stock - b.stock) * dir;
      if (sortKey === "time")
        return ((a.updatedAt || a.createdAt || "") > (b.updatedAt || b.createdAt || "") ? 1 : -1) * dir;
      return a.hex.localeCompare(b.hex) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [sorted, safePage]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "color" ? "asc" : "desc");
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

  const viewed = viewHex ? rows.find((r) => r.hex === viewHex) ?? null : null;
  const viewedProducts = useMemo(() => {
    if (!viewed) return [];
    return products.filter((p) => (p.colors ?? []).includes(viewed.hex));
  }, [viewed]);

  const activeSelected = useMemo(
    () => [...selected].filter((hex) => rows.some((r) => r.hex === hex)),
    [selected, rows]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.hex));
  const someVisibleSelected = visible.some((r) => selected.has(r.hex));

  const toggleOne = (hex: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(hex);
      else next.delete(hex);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (checked) next.add(r.hex);
        else next.delete(r.hex);
      }
      return next;
    });
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? rows.filter((r) => selected.has(r.hex)) : rows;
    if (list.length === 0) return;
    const lines = [
      ["hex", "products", "stock", "author", "createdAt", "updatedAt"].join(","),
      ...list.map((r) =>
        [r.hex, r.productNames.length, r.stock, r.author, r.createdAt, r.updatedAt]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "colors-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("colors.exportSuccess", { count: list.length }));
  };

  const dateOf = (iso: string) =>
    iso
      ? format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" })
      : "—";
  const timeOf = (iso: string) =>
    iso ? format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" }) : "";

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
              {sortableHead("color", t("colors.colColor"))}
              {sortableHead("products", t("colors.colProducts"), "text-center")}
              {sortableHead("stock", t("colors.colStock"), "text-right")}
              {sortableHead("time", t("attributes.colTime"), "text-right")}
              <TableHead>{t("attributes.colAuthor")}</TableHead>
              <TableHead className="w-28">{t("attributes.colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.hex} className={selected.has(row.hex) ? "bg-secondary/5" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(row.hex)}
                    onCheckedChange={(v) => toggleOne(row.hex, v === true)}
                    aria-label={row.hex}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      className="block size-9 shrink-0 border border-black/10 shadow-sm"
                      style={{ backgroundColor: row.hex }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs font-bold uppercase">{row.hex}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex -space-x-2">
                      {row.thumbs.map((src, i) => (
                        <span
                          key={`${row.hex}-${i}`}
                          className="relative block size-8 shrink-0 overflow-hidden border border-white bg-muted shadow-sm"
                        >
                          <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                        </span>
                      ))}
                    </span>
                    <span className="text-sm font-semibold">
                      {row.productNames.length}{" "}
                      <span className="max-w-56 truncate font-normal text-muted-foreground">
                        · {row.productNames.slice(0, 2).join(", ")}
                        {row.productNames.length > 2 ? "…" : ""}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-secondary">{row.stock}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {row.updatedAt || row.createdAt ? (
                    <>
                      <p className="text-xs font-medium text-foreground">
                        {dateOf(row.updatedAt || row.createdAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {timeOf(row.updatedAt || row.createdAt)}
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
                      {(row.author === "__system__"
                        ? t("attributes.systemAuthor")
                        : row.author)[0].toUpperCase()}
                    </span>
                    <span className="text-xs font-medium">
                      {row.author === "__system__" ? t("attributes.systemAuthor") : row.author}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewHex(row.hex)}
                      aria-label={`${t("colors.viewTitle")} ${row.hex}`}
                      title={t("colors.viewTitle")}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                    <Link
                      href={`/dashboard/products/colors/${encodeURIComponent(row.hex)}/edit`}
                      aria-label={`${t("colors.editTitle")} ${row.hex}`}
                      title={t("colors.editTitle")}
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewHex(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("colors.viewTitle")} ·{" "}
                  <span className="font-mono text-secondary">{viewed.hex}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border border border-border">
                {viewedProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                    <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                      {p.images[0] ? (
                        <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.category}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-secondary">{p.stock}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
