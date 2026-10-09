"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileEdit, FileText, Package, Plus, Printer, Search, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductInvoiceDoc } from "@/components/admin/products/ProductInvoiceDoc";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { products } from "@/features/shop/products";
import { Link } from "@/i18n/navigation";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { productSalesSummary } from "@/features/admin/analytics";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printInvoiceDoc } from "@/components/admin/print-invoice";

export default function DashboardProductsPage() {
  const t = useTranslations("Dashboard.admin");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"publish" | "draft" | "delete">("publish");
  const [statusTab, setStatusTab] = useState<"all" | "published" | "draft" | "trash">("all");

  const fields = useAdminProductsStore((s) => s.fields);
  const activeMap = useAdminProductsStore((s) => s.active);
  const deleted = useAdminProductsStore((s) => s.deleted);
  const purged = useAdminProductsStore((s) => s.purged);
  const custom = useAdminProductsStore((s) => s.custom);
  const setActiveState = useAdminProductsStore((s) => s.setActiveState);
  const softDelete = useAdminProductsStore((s) => s.softDelete);
  const restore = useAdminProductsStore((s) => s.restore);
  const purge = useAdminProductsStore((s) => s.purge);
  const addProduct = useAdminProductsStore((s) => s.addProduct);
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkInvoiceOpen, setBulkInvoiceOpen] = useState(false);
  const orders = useAdminOrders();

  const salesMap = useMemo(
    () => new Map(productSalesSummary(orders).map((s) => [s.id, s])),
    [orders]
  );

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category ?? "Women"))],
    []
  );

  const visible = useMemo(() => {
    const seen = new Set<string>();
    return [...custom, ...products]
      .map((p) => ({
        ...p,
        ...(fields[p.id] ?? {}),
        isActive: activeMap[p.id] ?? p.isActive,
      }))
      .filter((p) => {
        if (purged.includes(p.id) || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [custom, fields, activeMap, purged]);

  const counts = useMemo(
    () => ({
      all: visible.filter((p) => !deleted.includes(p.id)).length,
      published: visible.filter((p) => !deleted.includes(p.id) && p.isActive).length,
      draft: visible.filter((p) => !deleted.includes(p.id) && !p.isActive).length,
      trash: visible.filter((p) => deleted.includes(p.id)).length,
    }),
    [visible, deleted]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((p) => {
      const trashed = deleted.includes(p.id);
      if (statusTab === "trash" && !trashed) return false;
      if (statusTab !== "trash" && trashed) return false;
      if (statusTab === "published" && !p.isActive) return false;
      if (statusTab === "draft" && p.isActive) return false;
      if (category !== "all" && (p.category ?? "Women") !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
    });
  }, [visible, query, category, statusTab, deleted]);

  const handleToggleActive = (ids: string[], active: boolean) => {
    setActiveState(ids, active);
    toast.success(
      active
        ? t("products.toastPublished", { count: ids.length })
        : t("products.toastDrafted", { count: ids.length })
    );
  };

  const handleDelete = (ids: string[]) => {
    softDelete(ids);
    toast.success(t("products.toastDeleted", { count: ids.length }));
  };

  const handleRestore = (ids: string[]) => {
    restore(ids);
    toast.success(t("products.toastRestored", { count: ids.length }));
  };

  const handlePurge = (ids: string[]) => {
    purge(ids);
    toast.success(t("products.toastPurged", { count: ids.length }));
  };

  const applyBulkAction = () => {
    const ids = [...selected].filter((id) => filtered.some((p) => p.id === id));
    if (ids.length === 0) {
      toast.error(t("products.toastNoSelection"));
      return;
    }
    if (statusTab === "trash") {
      if (bulkAction === "delete") {
        handlePurge(ids);
      } else {
        const active = bulkAction === "publish";
        restore(ids);
        setActiveState(ids, active);
        toast.success(
          active
            ? t("products.toastPublished", { count: ids.length })
            : t("products.toastDrafted", { count: ids.length })
        );
      }
    } else if (bulkAction === "publish") handleToggleActive(ids, true);
    else if (bulkAction === "draft") handleToggleActive(ids, false);
    else handleDelete(ids);
    setSelected(new Set());
  };

  const tabs = [
    { key: "all", label: t("products.tabAll"), count: counts.all },
    { key: "published", label: t("products.tabPublished"), count: counts.published },
    { key: "draft", label: t("products.tabDraft"), count: counts.draft },
    { key: "trash", label: t("products.tabTrash"), count: counts.trash },
  ] as const;

  const stats = [
    { label: t("products.tabAll"), value: counts.all, icon: Package, iconClassName: "bg-primary/15 text-secondary" },
    { label: t("products.tabPublished"), value: counts.published, icon: CheckCircle2, iconClassName: "bg-green-600/10 text-green-700" },
    { label: t("products.tabDraft"), value: counts.draft, icon: FileEdit, iconClassName: "bg-secondary/15 text-secondary" },
    { label: t("products.tabTrash"), value: counts.trash, icon: XCircle, iconClassName: "bg-destructive/10 text-destructive" },
  ];

  const selectedProducts = useMemo(
    () => filtered.filter((p) => selected.has(p.id)),
    [filtered, selected]
  );

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const rows = selected.size > 0 ? selectedProducts : filtered;
    if (rows.length === 0) {
      toast.error(t("products.noSelection"));
      return;
    }
    const header = ["id", "name", "sku", "price", "compareAtPrice", "stock", "category", "subcategory", "brand", "rating", "status"];
    const lines = [
      header.join(","),
      ...rows.map((p) =>
        [
          p.id,
          p.name,
          p.sku ?? "",
          p.price,
          p.compareAtPrice ?? "",
          p.stock,
          p.category ?? "",
          p.subcategory ?? "",
          p.brand ?? "",
          p.rating ?? "",
          p.isActive ? "active" : "inactive",
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("products.exportSuccess", { count: rows.length }));
  };

  const parseCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("empty");
      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const col = (row: string[], ...names: string[]) => {
        for (const name of names) {
          const i = headers.indexOf(name);
          if (i >= 0 && row[i]) return row[i];
        }
        return "";
      };
      const now = new Date().toISOString();
      let count = 0;
      lines.slice(1).forEach((line, i) => {
        const row = parseCsvLine(line);
        const name = col(row, "name", "title");
        if (!name) return;
        const id = col(row, "id") || `custom-${Date.now()}-${i}`;
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const category = col(row, "category") || "Women";
        addProduct({
          id,
          name,
          slug: `${slug}-${id.slice(-4)}`,
          sku: col(row, "sku") || `FS-CUS-${String(Date.now() + i).slice(-6)}`,
          description: col(row, "description") || "",
          price: Number(col(row, "price")) || 0,
          compareAtPrice: Number(col(row, "compareatprice", "compare")) || null,
          images: [],
          category,
          subcategory: col(row, "subcategory") || undefined,
          brand: col(row, "brand") || "Fashion Bangla",
          stock: Number(col(row, "stock")) || 0,
          rating: Number(col(row, "rating")) || undefined,
          isActive: col(row, "status").toLowerCase() !== "inactive",
          createdAt: now,
          updatedAt: now,
        });
        count++;
      });
      if (count === 0) throw new Error("empty");
      toast.success(t("products.importSuccess", { count }));
    } catch {
      toast.error(t("products.importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const openBulkInvoice = () => {
    const withSales = selectedProducts.filter((p) => salesMap.has(p.id));
    if (withSales.length === 0) {
      toast.error(t("products.noSelection"));
      return;
    }
    setBulkInvoiceOpen(true);
  };

  const bulkInvoiceRows = useMemo(
    () =>
      selectedProducts
        .map((p) => salesMap.get(p.id))
        .filter((s): s is NonNullable<typeof s> => !!s),
    [selectedProducts, salesMap]
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("products.title")}
        description={t("products.subtitle", { count: filtered.length })}
        actions={
          <Link href="/dashboard/products/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" aria-hidden="true" />
              {t("products.addProduct")}
            </Button>
          </Link>
        }
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            className="bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={bulkAction}
            onValueChange={(v) => setBulkAction((v ?? "publish") as typeof bulkAction)}
          >
            <SelectTrigger className="w-40 bg-card" aria-label={t("products.bulkAction")}>
              <SelectValue placeholder={t("products.bulkAction")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">{t("products.bulkPublish")}</SelectItem>
              <SelectItem value="draft">{t("products.bulkDraft")}</SelectItem>
              <SelectItem value="delete">{t("products.bulkDelete")}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8" onClick={applyBulkAction}>
            {t("products.bulkApply")}
          </Button>
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full bg-card sm:w-48">
            <SelectValue placeholder={t("products.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("products.allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" onClick={handleExport}>
            <Download className="size-3.5 text-secondary" aria-hidden="true" />
            {t("products.exportBtn")}
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 bg-card"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5 text-secondary" aria-hidden="true" />
            {t("products.importBtn")}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" onClick={openBulkInvoice}>
            <FileText className="size-3.5 text-secondary" aria-hidden="true" />
            {t("products.invoiceBtn")}
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {tabs.map((tab, i) => (
          <span key={tab.key} className="flex items-center gap-1">
            {i > 0 ? <span className="text-border" aria-hidden="true">|</span> : null}
            <button
              type="button"
              onClick={() => {
                setStatusTab(tab.key);
                setSelected(new Set());
              }}
              aria-current={statusTab === tab.key ? "true" : undefined}
              className={cn(
                "px-1 font-medium transition-colors",
                statusTab === tab.key ? "font-bold text-secondary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="text-muted-foreground"> ({tab.count})</span>
            </button>
          </span>
        ))}
      </div>

      <ProductsTable
        items={filtered}
        view={statusTab === "trash" ? "trash" : "active"}
        selected={selected}
        onSelectionChange={setSelected}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onPurge={handlePurge}
      />

      <Dialog open={bulkInvoiceOpen} onOpenChange={setBulkInvoiceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("products.bulkInvoiceTitle", { count: bulkInvoiceRows.length })}
            </DialogTitle>
          </DialogHeader>
          <div id="invoice-print" className="flex flex-col gap-8">
            {bulkInvoiceRows.map((row) => (
              <div key={row.id} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <ProductInvoiceDoc row={row} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkInvoiceOpen(false)}>
              {t("orders.detailsClose")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => printInvoiceDoc()}>
              <Printer className="size-3.5" aria-hidden="true" />
              {t("orders.invPrint")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
