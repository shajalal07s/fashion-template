"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  LayoutGrid,
  Package,
  Search,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  InventoryTable,
  type InventoryRow,
} from "@/components/admin/products/InventoryTable";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StockFilter = "all" | InventoryRow["status"];

const FILTERS: Array<{ key: StockFilter; icon: LucideIcon; color: string }> = [
  { key: "all", icon: LayoutGrid, color: "#1a0d00" },
  { key: "instock", icon: CheckCircle2, color: "#16a34a" },
  { key: "low", icon: AlertTriangle, color: "#ff8000" },
  { key: "outofstock", icon: XCircle, color: "#dc2626" },
  { key: "backorder", icon: Truck, color: "#f8ac0c" },
];

export default function DashboardInventoryPage() {
  const t = useTranslations("Dashboard.admin");
  const fields = useAdminProductsStore((s) => s.fields);
  const activeMap = useAdminProductsStore((s) => s.active);
  const deleted = useAdminProductsStore((s) => s.deleted);
  const purged = useAdminProductsStore((s) => s.purged);
  const custom = useAdminProductsStore((s) => s.custom);
  const galleryMap = useAdminProductsStore((s) => s.gallery);
  const softDelete = useAdminProductsStore((s) => s.softDelete);
  const upsertFields = useAdminProductsStore((s) => s.upsertFields);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo<InventoryRow[]>(() => {
    const seen = new Set<string>();
    return [...custom, ...products]
      .map((p) => {
        const override = fields[p.id] ?? {};
        const stock = override.stock ?? p.stock;
        const threshold = override.lowStockThreshold ?? 10;
        const manual = override.stockStatus;
        const status: InventoryRow["status"] = manual
          ? manual === "instock"
            ? "instock"
            : manual === "outofstock"
              ? "outofstock"
              : "backorder"
          : stock <= 0
            ? "outofstock"
            : stock < threshold
              ? "low"
              : "instock";
        return {
          id: p.id,
          name: override.name ?? p.name,
          image: (galleryMap[p.id] ?? p.images)[0] ?? "",
          sku: p.sku ?? "",
          category: p.category ?? "Women",
          slug: p.slug,
          stock,
          status,
          threshold,
          active: activeMap[p.id] ?? p.isActive,
          trashed: deleted.includes(p.id),
        };
      })
      .filter((r) => {
        if (purged.includes(r.id) || seen.has(r.id)) return false;
        seen.add(r.id);
        return !r.trashed && r.active;
      });
  }, [custom, fields, activeMap, galleryMap, deleted, purged]);

  const counts = useMemo(() => {
    const map = new Map<StockFilter, number>([["all", rows.length]]);
    for (const r of rows) map.set(r.status, (map.get(r.status) ?? 0) + 1);
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (filter === "all" ? rows : rows.filter((r) => r.status === filter)).filter((r) => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  const handleStockUpdate = (id: string, stock: number) => {
    upsertFields(id, { stock });
    toast.success(t("inventory.toastStockUpdated"));
  };

  const handleBulkDelete = (ids: string[]) => {
    softDelete(ids);
    toast.success(t("inventory.toastDeleted", { count: ids.length }));
  };

  const stats = useMemo(() => {
    const totalUnits = rows.reduce((n, r) => n + r.stock, 0);
    const low = rows.filter((r) => r.status === "low").length;
    const out = rows.filter((r) => r.status === "outofstock").length;
    return [
      { label: t("products.title"), value: rows.length, icon: Package, iconClassName: "bg-primary/15 text-secondary" },
      { label: t("inventory.colStock"), value: totalUnits, icon: Boxes, iconClassName: "bg-secondary/15 text-secondary" },
      { label: t("inventory.lowStock"), value: low, icon: AlertTriangle, iconClassName: "bg-secondary/15 text-secondary" },
      { label: t("inventory.outOfStock"), value: out, icon: XCircle, iconClassName: "bg-destructive/10 text-destructive" },
    ];
  }, [rows, t]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("inventory.title")}
        description={t("inventory.subtitle", { count: rows.length })}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className="font-heading truncate text-2xl font-bold text-foreground md:text-3xl">
                  {s.value}
                </p>
              </div>
              <span className={`flex size-11 shrink-0 items-center justify-center ${s.iconClassName}`}>
                <s.icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="border-border bg-card pt-5 lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-1 p-3 pt-0">
            <p className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("inventory.filterTitle")}
            </p>
            <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {FILTERS.map(({ key, icon: Icon, color }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 border px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:w-full",
                      active
                        ? "border-secondary bg-secondary font-semibold text-white"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      style={active ? undefined : { color }}
                      aria-hidden="true"
                    />
                    {key === "all"
                      ? t("inventory.all")
                      : t(
                          `inventory.${key === "low" ? "lowStock" : key === "instock" ? "inStock" : key === "outofstock" ? "outOfStock" : "backorder"}`
                        )}
                    <Badge
                      className={cn(
                        "ml-auto font-bold",
                        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {counts.get(key) ?? 0}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) || 10)}
            >
              <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label="Rows per page">
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
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("inventory.searchPlaceholder")}
                className="bg-card pl-9"
              />
            </div>
          </div>
          <InventoryTable rows={filtered} onStockUpdate={handleStockUpdate} onBulkDelete={handleBulkDelete} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
