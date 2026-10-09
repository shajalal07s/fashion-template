"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { VendorProduct, VendorProductStatus } from "@/features/vendor/vendor";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "best" | "highPrice" | "lowPrice" | "rated" | "lowStock" | "updated";
type StockFilter = "all" | "in" | "low" | "out" | "back";

const STATUSES: VendorProductStatus[] = ["active", "draft", "pending", "inactive", "out", "rejected", "archived"];

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function stockOf(p: VendorProduct): "in" | "low" | "out" | "back" {
  if (p.stock <= 0) return p.backorder ? "back" : "out";
  if (p.stock <= p.lowThreshold) return "low";
  return "in";
}

export default function VendorProductsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const router = useRouter();
  const products = useVendorProducts();
  const store = useVendorStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [ready, setReady] = useState(false);
  const [queryRaw, setQueryRaw] = useState("");
  const query = useDebounced(queryRaw);
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [fCategory, setFCategory] = useState("all");
  const [fBrand, setFBrand] = useState("all");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fStock, setFStock] = useState<StockFilter>("all");
  const [fMinPrice, setFMinPrice] = useState("");
  const [fMaxPrice, setFMaxPrice] = useState("");
  const [fRating, setFRating] = useState("all");
  const [fFeatured, setFFeatured] = useState(false);
  const [fDiscount, setFDiscount] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [bulkKind, setBulkKind] = useState<null | "status" | "category" | "price" | "stock" | "discount">(null);
  const [bulkValue, setBulkValue] = useState("");
  const [discountId, setDiscountId] = useState<string | null>(null);
  const [discountPct, setDiscountPct] = useState(10);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Array<{ name: string; sku: string; price: number; stock: number; category: string; valid: boolean }>>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);
  const types = useMemo(() => [...new Set(products.map((p) => p.type))], [products]);

  const counts = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
    pending: products.filter((p) => p.status === "pending").length,
    low: products.filter((p) => stockOf(p) === "low").length,
    out: products.filter((p) => stockOf(p) === "out").length,
  }), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minP = fMinPrice === "" ? 0 : Number(fMinPrice);
    const maxP = fMaxPrice === "" ? Infinity : Number(fMaxPrice);
    const minR = fRating === "all" ? 0 : Number(fRating);
    let list = products.filter((p) => {
      if (cardFilter === "active" && p.status !== "active") return false;
      if (cardFilter === "draft" && p.status !== "draft") return false;
      if (cardFilter === "pending" && p.status !== "pending") return false;
      if (cardFilter === "low" && stockOf(p) !== "low") return false;
      if (cardFilter === "out" && stockOf(p) !== "out") return false;
      if (fCategory !== "all" && p.category !== fCategory) return false;
      if (fBrand !== "all" && p.brand !== fBrand) return false;
      if (fType !== "all" && p.type !== fType) return false;
      if (fStatus !== "all" && p.status !== fStatus) return false;
      if (fStock !== "all" && stockOf(p) !== fStock) return false;
      if (p.price < minP || p.price > maxP) return false;
      if (p.rating < minR) return false;
      if (fFeatured && !p.featured) return false;
      if (fDiscount && !(p.salePrice > 0)) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.id} ${p.brand} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (sort) {
      case "oldest":
        list = [...list].sort((a, b) => +new Date(a.created) - +new Date(b.created));
        break;
      case "best":
        list = [...list].sort((a, b) => b.sold - a.sold);
        break;
      case "highPrice":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "lowPrice":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "rated":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "lowStock":
        list = [...list].sort((a, b) => a.stock - b.stock);
        break;
      case "updated":
        list = [...list].sort((a, b) => +new Date(b.updated) - +new Date(a.updated));
        break;
      default:
        list = [...list].sort((a, b) => +new Date(b.created) - +new Date(a.created));
    }
    return list;
  }, [products, query, cardFilter, fCategory, fBrand, fType, fStatus, fStock, fMinPrice, fMaxPrice, fRating, fFeatured, fDiscount, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => products.some((p) => p.id === id)),
    [selected, products]
  );

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (cardFilter) chips.push({ label: cardFilter, clear: () => setCardFilter(null) });
  if (fCategory !== "all") chips.push({ label: fCategory, clear: () => setFCategory("all") });
  if (fBrand !== "all") chips.push({ label: fBrand, clear: () => setFBrand("all") });
  if (fType !== "all") chips.push({ label: fType, clear: () => setFType("all") });
  if (fStatus !== "all") chips.push({ label: fStatus, clear: () => setFStatus("all") });
  if (fStock !== "all") chips.push({ label: `stock:${fStock}`, clear: () => setFStock("all") });
  if (fMinPrice !== "" || fMaxPrice !== "") chips.push({ label: `${fMinPrice || "0"}–${fMaxPrice || "∞"}`, clear: () => { setFMinPrice(""); setFMaxPrice(""); } });
  if (fRating !== "all") chips.push({ label: `${fRating}★+`, clear: () => setFRating("all") });
  if (fFeatured) chips.push({ label: "featured", clear: () => setFFeatured(false) });
  if (fDiscount) chips.push({ label: "discount", clear: () => setFDiscount(false) });

  const resetFilters = () => {
    setQueryRaw(""); setCardFilter(null);
    setFCategory("all"); setFBrand("all"); setFType("all"); setFStatus("all"); setFStock("all");
    setFMinPrice(""); setFMaxPrice(""); setFRating("all");
    setFFeatured(false); setFDiscount(false);
    setPage(0);
  };

  const detailHref = (id: string) => `/vendor/products/${id}`;
  const editHref = (id: string) => `/vendor/products/${id}/edit`;

  const doDuplicate = (p: VendorProduct, goEdit: boolean) => {
    const id = store.duplicateProduct(p.id);
    if (id) {
      toast.success(t("dupDone"));
      if (goEdit) router.push(editHref(id));
    }
  };

  const copyLink = async (p: VendorProduct) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${p.slug}`);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("linkCopied"));
    }
  };

  const applyDiscount = () => {
    const p = products.find((x) => x.id === discountId);
    if (!p) return;
    const pct = Math.max(1, Math.min(90, discountPct));
    store.patchProduct(p.id, { salePrice: Math.round(p.price * (1 - pct / 100)), updated: "2026-09-26" });
    setDiscountId(null);
    toast.success(t("toastSaved"));
  };

  const bulkApply = () => {
    if (bulkKind === "status") {
      const v = bulkValue as VendorProductStatus;
      for (const id of activeSelected) store.patchProduct(id, { status: v, updated: "2026-09-26" });
    } else if (bulkKind === "category") {
      for (const id of activeSelected) store.patchProduct(id, { category: bulkValue, updated: "2026-09-26" });
    } else if (bulkKind === "price") {
      const v = Number(bulkValue) || 0;
      for (const id of activeSelected) store.patchProduct(id, { price: Math.max(0, v), updated: "2026-09-26" });
    } else if (bulkKind === "stock") {
      const v = Math.max(0, Number(bulkValue) || 0);
      for (const id of activeSelected) {
        const p = products.find((x) => x.id === id);
        if (p) store.adjustStock(id, v - p.stock, "Bulk update");
      }
    } else if (bulkKind === "discount") {
      const pct = Math.max(1, Math.min(90, Number(bulkValue) || 10));
      for (const id of activeSelected) {
        const p = products.find((x) => x.id === id);
        if (p) store.patchProduct(id, { salePrice: Math.round(p.price * (1 - pct / 100)), updated: "2026-09-26" });
      }
    }
    setBulkKind(null);
    setBulkValue("");
    setSelected(new Set());
    toast.success(t("toastSaved"));
  };

  const bulkFeature = () => {
    for (const id of activeSelected) {
      const p = products.find((x) => x.id === id);
      if (p) store.patchProduct(id, { featured: !p.featured });
    }
    toast.success(t("featOn"));
  };

  const bulkDuplicate = () => {
    for (const id of activeSelected) store.duplicateProduct(id);
    setSelected(new Set());
    toast.success(t("dupDone"));
  };

  const bulkArchive = () => {
    for (const id of activeSelected) store.patchProduct(id, { status: "archived", updated: "2026-09-26" });
    setSelected(new Set());
    toast.success(t("archiveDone"));
  };

  const exportRows = (list: VendorProduct[]) => {
    const lines = [
      ["name", "sku", "price", "stock", "category"].join(","),
      ...list.map((p) => [p.name, p.sku, p.price, p.stock, p.category].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-products.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportDone"));
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("empty");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const col = (row: string[], ...names: string[]) => {
        for (const name of names) {
          const i = headers.indexOf(name);
          if (i >= 0 && row[i]) return row[i].replace(/^"|"$/g, "").trim();
        }
        return "";
      };
      const parsed = lines.slice(1).map((line) => {
        const row = line.split(",");
        const name = col(row, "name", "product");
        const price = Number(col(row, "price")) || 0;
        return {
          name,
          sku: col(row, "sku"),
          price,
          stock: Number(col(row, "stock")) || 0,
          category: col(row, "category") || "Women",
          valid: name.length > 0 && price > 0,
        };
      });
      setImportRows(parsed);
      setImportOpen(true);
    } catch {
      toast.error(t("importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmImport = () => {
    const valid = importRows.filter((r) => r.valid);
    valid.forEach((r, i) => {
      store.addProduct({
        id: `vp-import-${products.length + i + 1}`,
        name: r.name, sku: r.sku || `SKU-IMP-${i + 1}`,
        image: "/images/women/women-1.jpg", gallery: [],
        category: r.category, subCategory: "", brand: "Ayesha Boutique", type: "Simple", tags: [],
        shortDesc: "", description: "", price: r.price, salePrice: 0, costPrice: 0,
        saleStart: "", saleEnd: "", stock: r.stock, lowThreshold: 10,
        manageStock: true, backorder: false, weight: 0, length: 0, width: 0, height: 0,
        shipClass: "Standard", attributes: [], variations: [],
        seoTitle: "", seoDesc: "", slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), keywords: "",
        featured: false, visibility: "Public", allowReviews: true, purchaseLimit: 5,
        sold: 0, views: 0, carts: 0, rating: 5, reviews: 0, revenue: 0,
        status: "draft", created: "2026-09-26", updated: "2026-09-26",
        activity: [], stockHistory: [],
      });
    });
    setImportOpen(false);
    setImportRows([]);
    toast.success(t("imported", { count: valid.length }));
  };

  const statusBadge = (s: VendorProductStatus) => (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      s === "active" ? "bg-green-600/10 text-green-700"
      : s === "pending" ? "bg-primary/20 text-[#8a5a00]"
      : s === "rejected" ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground")}>
      {s}
    </span>
  );

  const cards = [
    { key: "total", label: t("sTotal"), value: counts.total, filter: null as string | null },
    { key: "active", label: t("sActive"), value: counts.active, filter: "active" },
    { key: "draft", label: t("sDraft"), value: counts.draft, filter: "draft" },
    { key: "pending", label: t("sPending"), value: counts.pending, filter: "pending" },
    { key: "low", label: t("sLow"), value: counts.low, filter: "low" },
    { key: "out", label: t("sOut"), value: counts.out, filter: "out" },
  ];

  const rowActions = (p: VendorProduct) => (
    <>
      <Link href={detailHref(p.id)}>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${p.name}`} title={t("view")}>
          <Eye className="size-4" aria-hidden="true" />
        </Button>
      </Link>
      <Link href={editHref(p.id)}>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("edit")} ${p.name}`} title={t("edit")}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      </Link>
      <Link href="/vendor/products/inventory">
        <Button variant="ghost" size="icon-sm" aria-label={`${t("iTitle")} ${p.name}`} title={t("iTitle")}>
          <Package className="size-4" aria-hidden="true" />
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${t("moreActions")} ${p.name}`} />}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={detailHref(p.id)} />}>{t("view")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={editHref(p.id)} />}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => doDuplicate(p, false)}>{t("bulkDuplicate")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/vendor/products/${p.id}/variations`} />}>{t("manageVariations")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/vendor/products/inventory" />}>{t("iTitle")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/vendor/products/${p.id}/analytics`} />}>{t("productAnalytics")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/vendor/products/reviews" />}>{t("productReviews")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setDiscountId(p.id); setDiscountPct(10); }}>{t("createDiscount")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void copyLink(p)}>{t("copyLink")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { store.patchProduct(p.id, { featured: !p.featured }); toast.success(p.featured ? t("featOff") : t("featOn")); }}>
            {t("featureProduct")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { store.patchProduct(p.id, { visibility: "Hidden" }); toast.success(t("hideDone")); }}>
            {t("hideProduct")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { store.patchProduct(p.id, { status: "inactive" }); toast.success(t("disableDone")); }}>
            {t("disableProduct")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { store.patchProduct(p.id, { status: "archived" }); toast.success(t("archiveDone")); }}>
            {t("archiveProduct")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmDelete([p.id])} className="text-destructive">
            {t("deleteProduct")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={t("mpTitle")}
        subtitle={t("mpSubtitle")}
        highlightLabel={t("sTotal")}
        highlightValue={num(counts.total)}
        highlightIcon={Package}
      >
        <Link href="/vendor/products/create" className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addProduct")}
        </Link>
        <button type="button" onClick={() => fileRef.current?.click()} className={heroPillClassName}>
          <Upload className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => exportRows(filtered)} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
      </AccountingHero>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-hidden="true" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); }} />

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCardFilter(c.filter); setPage(0); }}
              aria-pressed={cardFilter === c.filter}
              className={cn("overflow-hidden border bg-card text-left transition-colors hover:border-secondary", cardFilter === c.filter ? "border-secondary" : "border-border")}
            >
              <CardContent className="p-4">
                <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</p>
                <p className="font-heading text-2xl font-bold">{num(c.value)}</p>
              </CardContent>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={queryRaw} onChange={(e) => { setQueryRaw(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={fCategory} onValueChange={(v) => { setFCategory(v ?? "all"); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fCategory")}>
                <SelectValue placeholder={t("fCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("fCategory")}: All</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fBrand} onValueChange={(v) => { setFBrand(v ?? "all"); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fBrand")}>
                <SelectValue placeholder={t("fBrand")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("fBrand")}: All</SelectItem>
                {brands.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={(v) => { setFStatus(v ?? "all"); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fStatus")}>
                <SelectValue placeholder={t("fStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStock} onValueChange={(v) => { setFStock((v as StockFilter) ?? "all"); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fStock")}>
                <SelectValue placeholder={t("fStock")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in">{t("stIn")}</SelectItem>
                <SelectItem value="low">{t("stLow")}</SelectItem>
                <SelectItem value="out">{t("stOut")}</SelectItem>
                <SelectItem value="back">{t("stBack")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
              <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["newest", "oldest", "best", "highPrice", "lowPrice", "rated", "lowStock", "updated"] as SortKey[]).map((s) => (
                  <SelectItem key={s} value={s}>{t(`sort${s[0].toUpperCase()}${s.slice(1)}` as "sortNewest")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fType} onValueChange={(v) => { setFType(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fType")}>
              <SelectValue placeholder={t("fType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("fType")}: All</SelectItem>
              {types.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fRating} onValueChange={(v) => { setFRating(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("fRating")}>
              <SelectValue placeholder={t("fRating")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("fRating")}: All</SelectItem>
              <SelectItem value="3">3★+</SelectItem>
              <SelectItem value="4">4★+</SelectItem>
              <SelectItem value="4.5">4.5★+</SelectItem>
            </SelectContent>
          </Select>
          <Input value={fMinPrice} onChange={(e) => { setFMinPrice(e.target.value); setPage(0); }} placeholder={t("minPrice")} inputMode="decimal" className="h-8 w-28 bg-card" aria-label={t("minPrice")} />
          <Input value={fMaxPrice} onChange={(e) => { setFMaxPrice(e.target.value); setPage(0); }} placeholder={t("maxPrice")} inputMode="decimal" className="h-8 w-28 bg-card" aria-label={t("maxPrice")} />
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <Checkbox checked={fFeatured} onCheckedChange={(v) => { setFFeatured(v === true); setPage(0); }} aria-label={t("fFeatured")} />
            {t("fFeatured")}
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <Checkbox checked={fDiscount} onCheckedChange={(v) => { setFDiscount(v === true); setPage(0); }} aria-label={t("fDiscount")} />
            {t("fDiscount")}
          </label>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => window.location.reload()}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t("refresh")}
          </Button>
          {chips.length > 0 ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-destructive hover:text-destructive" onClick={resetFilters}>
              <X className="size-3.5" aria-hidden="true" />
              {t("resetFilters")} ({chips.length})
            </Button>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <button key={i} type="button" onClick={c.clear} className="flex items-center gap-1 border border-secondary/50 bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary hover:bg-secondary/20" aria-label={`Clear ${c.label}`}>
                {c.label}
                <X className="size-3" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!ready ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <Card className="overflow-hidden border-border bg-card py-0">
          {activeSelected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("resetFilters")}>
                <X className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-sm font-semibold">{t("selectedCount", { count: activeSelected.length })}</p>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <Select value={bulkKind ?? ""} onValueChange={(v) => setBulkKind((v as typeof bulkKind) ?? null)}>
                  <SelectTrigger size="sm" className="h-8 w-32 bg-card">
                    <SelectValue placeholder={t("edit")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["status", "category", "price", "stock", "discount"] as const).map((k) => (
                      <SelectItem key={k} value={k}>{t(`bulk${k[0].toUpperCase()}${k.slice(1)}` as "bulkStatus")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bulkKind ? (
                  <>
                    <Input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder={t("bulkStatus")} className="h-8 w-32 bg-card" aria-label={t("bulkStatus")} />
                    <Button size="sm" className="h-8" onClick={bulkApply}>{t("saveBtn")}</Button>
                  </>
                ) : null}
                <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={bulkFeature}>{t("bulkFeature")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={bulkDuplicate}>{t("bulkDuplicate")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={bulkArchive}>{t("bulkArchive")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={() => exportRows(products.filter((p) => selected.has(p.id)))}>{t("bulkExport")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(activeSelected)}>{t("bulkDelete")}</Button>
              </div>
            </div>
          ) : null}
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            {visible.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="w-10">
                      <Checkbox checked={visible.length > 0 && visible.every((p) => selected.has(p.id))} indeterminate={visible.some((p) => selected.has(p.id)) && !visible.every((p) => selected.has(p.id))}
                        onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          for (const p of visible) {
                            if (v === true) next.add(p.id);
                            else next.delete(p.id);
                          }
                          return next;
                        })} aria-label={t("mpTitle")} />
                    </TableHead>
                    <TableHead>{t("tProduct")}</TableHead>
                    <TableHead>{t("tSku")}</TableHead>
                    <TableHead>{t("tCategory")}</TableHead>
                    <TableHead className="text-right">{t("tPrice")}</TableHead>
                    <TableHead className="text-right">{t("tStock")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="text-right">{t("tSales")}</TableHead>
                    <TableHead>{t("tRating")}</TableHead>
                    <TableHead className="text-right">{t("tUpdated")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow key={p.id} className={cn("transition-colors hover:bg-muted/50", selected.has(p.id) && "bg-secondary/5")}>
                      <TableCell>
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(p.id);
                          else next.delete(p.id);
                          return next;
                        })} aria-label={p.name} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Link href={detailHref(p.id)} aria-label={`${t("view")} ${p.name}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} className="size-11 shrink-0 object-cover transition-opacity hover:opacity-80" loading="lazy" />
                          </Link>
                          <div className="min-w-0">
                            <Link href={detailHref(p.id)} className="block max-w-44 truncate text-sm font-semibold hover:text-secondary hover:underline" title={p.name}>
                              {p.name}
                            </Link>
                            <p className="max-w-44 truncate text-xs text-muted-foreground" title={p.shortDesc}>{p.shortDesc}</p>
                            <p className="flex flex-wrap items-center gap-1 pt-0.5">
                              <span className="font-mono text-[10px] text-muted-foreground">{p.sku}</span>
                              {(p.variations ?? []).length > 0 ? <span className="bg-muted px-1 text-[10px] font-bold">{(p.variations ?? []).length} var</span> : null}
                              {p.featured ? <span className="bg-primary/20 px-1 text-[10px] font-bold text-[#8a5a00]">{t("featuredBadge")}</span> : null}
                              {p.salePrice > 0 ? <span className="bg-destructive/10 px-1 text-[10px] font-bold text-destructive">{t("saleBadge")}</span> : null}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={detailHref(p.id)} className="font-mono text-xs hover:text-secondary hover:underline">{p.sku}</Link>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-right">
                        <Link href={editHref(p.id)} className="font-bold whitespace-nowrap hover:text-secondary hover:underline" title={t("edit")}>
                          {p.salePrice > 0 ? (
                            <span className="flex flex-col items-end">
                              <span className="text-secondary">{money(p.salePrice)}</span>
                              <span className="text-[11px] font-normal text-muted-foreground line-through">{money(p.price)}</span>
                            </span>
                          ) : money(p.price)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href="/vendor/products/inventory" className={cn("font-bold hover:underline", p.stock === 0 ? "text-destructive" : p.stock <= p.lowThreshold ? "text-[#8a5a00]" : "")} title={t("iTitle")}>
                          {num(p.stock)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v) => {
                          store.patchProduct(p.id, { status: (v as VendorProductStatus) ?? p.status, updated: "2026-09-26" });
                          toast.success(t("toastSaved"));
                        }}>
                          <SelectTrigger size="sm" className="h-7 w-28 bg-card text-[11px] font-bold" aria-label={`${t("tStatus")} ${p.name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/vendor/products/${p.id}/analytics`} className="font-semibold hover:text-secondary hover:underline" title={t("productAnalytics")}>
                          {num(p.sold)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href="/vendor/products/reviews" className="inline-flex items-center gap-1 hover:text-secondary" title={t("productReviews")}>
                          <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                          <span className="text-xs font-bold">{p.rating}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">{p.updated}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">{rowActions(p)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={Package} title={t("emptyTitle")} description={query || chips.length > 0 ? t("emptyDescription") : t("emptyProducts")} />
                {query || chips.length > 0 ? (
                  <Button variant="outline" size="sm" className="bg-card" onClick={resetFilters}>{t("resetFilters")}</Button>
                ) : (
                  <Link href="/vendor/products/create">
                    <Button size="sm">{t("addProduct")}</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
          <CardContent className="grid gap-3 p-3 md:hidden">
            {visible.length > 0 ? visible.map((p) => (
              <div key={p.id} className={cn("flex flex-col gap-2 border bg-card p-3", selected.has(p.id) ? "border-secondary" : "border-border")}>
                <div className="flex items-center gap-2.5">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (v === true) next.add(p.id);
                    else next.delete(p.id);
                    return next;
                  })} aria-label={p.name} />
                  <Link href={detailHref(p.id)} className="flex min-w-0 flex-1 items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="size-12 shrink-0 object-cover" loading="lazy" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{p.name}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">SKU: {p.sku}</span>
                    </span>
                  </Link>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-heading text-base font-bold text-secondary">
                    {p.salePrice > 0 ? money(p.salePrice) : money(p.price)}
                  </span>
                  <span className={cn("font-bold", p.stock === 0 ? "text-destructive" : "")}>
                    {num(p.stock)} Stock
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs">
                    {statusBadge(p.status)}
                    <span className="inline-flex items-center gap-0.5 font-bold">
                      <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                      {p.rating}
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5">{rowActions(p)}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyProducts")} />
                <Link href="/vendor/products/create">
                  <Button size="sm">{t("addProduct")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
                <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {num(filtered.length)}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </Button>
              <span className="px-2 text-xs font-medium text-muted-foreground">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!discountId} onOpenChange={(open) => !open && setDiscountId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("discountTitle")}</DialogTitle>
          </DialogHeader>
          <Field label={t("discountPct")}>
            <Input type="number" min={1} max={90} value={discountPct} onChange={(e) => setDiscountPct(Math.max(1, Math.min(90, Number(e.target.value) || 10)))} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDiscountId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={applyDiscount}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("deleteDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirmDelete) store.removeProducts(confirmDelete);
              setConfirmDelete(null);
              setSelected(new Set());
              toast.success(t("toastSaved"));
            }}>
              {t("deleteBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("importTitle")} · {t("importPreview")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            {importRows.map((r, i) => (
              <div key={i} className={cn("flex items-center gap-2 border px-2 py-1.5 text-xs", r.valid ? "border-border" : "border-destructive/50 bg-destructive/5")}>
                <span className="min-w-0 flex-1 truncate font-semibold">{r.name || "—"} <span className="font-mono text-muted-foreground">{r.sku}</span></span>
                <span className={cn("px-1.5 py-0.5 text-[10px] font-bold", r.valid ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive")}>
                  {r.valid ? t("importValid") : t("importInvalid")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={confirmImport}>{t("importConfirm")} ({importRows.filter((r) => r.valid).length})</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
