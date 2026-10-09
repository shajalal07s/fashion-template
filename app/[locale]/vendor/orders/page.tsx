"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import type { VendorOrder, VendorOrderStatus } from "@/features/vendor/vendor";
import { useVendorOrders, useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highestVal" | "lowestVal" | "recentUpd" | "pendingFirst" | "delivery" | "customer";

const NEXT_STATUS: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed", "returned"],
  completed: ["refunded"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function PayKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold break-all">{value}</span>
    </div>
  );
}

export default function VendorOrdersPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const products = useVendorProducts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [ready, setReady] = useState(false);
  const [queryRaw, setQueryRaw] = useState("");
  const query = useDebounced(queryRaw);
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fStatus, setFStatus] = useState("all");
  const [fPayStatus, setFPayStatus] = useState("all");
  const [fPayMethod, setFPayMethod] = useState("all");
  const [fShip, setFShip] = useState("all");
  const [fDate, setFDate] = useState("all");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fProduct, setFProduct] = useState("");
  const [fCustomer, setFCustomer] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [payView, setPayView] = useState<string | null>(null);
  const [custView, setCustView] = useState<string | null>(null);
  const [prodView, setProdView] = useState<string | null>(null);
  const [printPreview, setPrintPreview] = useState<string[] | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  const shipStateOf = (o: VendorOrder): string => {
    if (o.status === "completed") return "delivered";
    if (o.status === "shipped") return "inTransit";
    if (o.status === "processing") return "preparing";
    if (o.status === "cancelled") return "failedDelivery";
    return "notShipped";
  };

  const counts = useMemo(() => {
    const c = (fn: (o: VendorOrder) => boolean) => orders.filter((o) => !o.archived && fn(o)).length;
    return {
      all: orders.filter((o) => !o.archived).length,
      pending: c((o) => o.status === "pending"),
      processing: c((o) => o.status === "processing"),
      shipped: c((o) => o.status === "shipped"),
      delivered: c((o) => o.status === "completed"),
      cancelled: c((o) => o.status === "cancelled"),
      returned: c((o) => o.status === "returned"),
      pendingPay: c((o) => o.payStatus === "pending"),
      completed: c((o) => o.status === "completed"),
      refunded: c((o) => o.payStatus === "refunded"),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = fMin === "" ? 0 : Number(fMin);
    const max = fMax === "" ? Infinity : Number(fMax);
    const cutoff = (() => {
      const now = +new Date("2026-09-26");
      if (fDate === "today") return now - 86400000;
      if (fDate === "yesterday") return now - 2 * 86400000;
      if (fDate === "7days") return now - 7 * 86400000;
      if (fDate === "30days" || fDate === "month") return now - 30 * 86400000;
      if (fDate === "lastMonth") return now - 60 * 86400000;
      return 0;
    })();
    let list = orders.filter((o) => !o.archived);
    if (cardFilter === "pending") list = list.filter((o) => o.status === "pending");
    else if (cardFilter === "processing") list = list.filter((o) => o.status === "processing");
    else if (cardFilter === "shipped") list = list.filter((o) => o.status === "shipped");
    else if (cardFilter === "delivered" || cardFilter === "completed") list = list.filter((o) => o.status === "completed");
    else if (cardFilter === "cancelled") list = list.filter((o) => o.status === "cancelled");
    else if (cardFilter === "returned") list = list.filter((o) => o.status === "returned");
    else if (cardFilter === "pendingPay") list = list.filter((o) => o.payStatus === "pending");
    else if (cardFilter === "refunded") list = list.filter((o) => o.payStatus === "refunded");
    if (fStatus !== "all") list = list.filter((o) => o.status === fStatus);
    if (fPayStatus !== "all") list = list.filter((o) => o.payStatus === fPayStatus);
    if (fPayMethod !== "all") list = list.filter((o) => o.payment === fPayMethod);
    if (fShip !== "all") list = list.filter((o) => shipStateOf(o) === fShip);
    if (cutoff > 0) list = list.filter((o) => +new Date(o.date) >= cutoff);
    if (fProduct.trim()) {
      const pq = fProduct.trim().toLowerCase();
      list = list.filter((o) => o.items.some((i) => i.name.toLowerCase().includes(pq) || i.sku.toLowerCase().includes(pq)));
    }
    if (fCustomer.trim()) {
      const cq = fCustomer.trim().toLowerCase();
      list = list.filter((o) => o.customer.toLowerCase().includes(cq) || o.email.toLowerCase().includes(cq));
    }
    list = list.filter((o) => o.total >= min && o.total <= max);
    if (q) {
      list = list.filter((o) => {
        const hay = `${o.id} ${o.customer} ${o.email} ${o.phone} ${o.tracking} ${o.items.map((i) => `${i.name} ${i.sku}`).join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const rank: Record<string, number> = { pending: 0, processing: 1, shipped: 2, completed: 3, cancelled: 4, returned: 5, refunded: 6 };
    switch (sort) {
      case "oldest":
        list = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
        break;
      case "highestVal":
        list = [...list].sort((a, b) => b.total - a.total);
        break;
      case "lowestVal":
        list = [...list].sort((a, b) => a.total - b.total);
        break;
      case "recentUpd":
        list = [...list].sort((a, b) => +new Date(b.updated) - +new Date(a.updated));
        break;
      case "pendingFirst":
        list = [...list].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
        break;
      case "delivery":
        list = [...list].sort((a, b) => (a.eta || "9999").localeCompare(b.eta || "9999"));
        break;
      case "customer":
        list = [...list].sort((a, b) => a.customer.localeCompare(b.customer));
        break;
      default:
        list = [...list].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
    return list;
  }, [orders, query, cardFilter, fStatus, fPayStatus, fPayMethod, fShip, fDate, fMin, fMax, fProduct, fCustomer, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => orders.some((o) => o.id === id)),
    [selected, orders]
  );

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (cardFilter) chips.push({ label: cardFilter, clear: () => setCardFilter(null) });
  if (fStatus !== "all") chips.push({ label: fStatus, clear: () => setFStatus("all") });
  if (fPayStatus !== "all") chips.push({ label: `pay:${fPayStatus}`, clear: () => setFPayStatus("all") });
  if (fPayMethod !== "all") chips.push({ label: fPayMethod, clear: () => setFPayMethod("all") });
  if (fShip !== "all") chips.push({ label: `ship:${fShip}`, clear: () => setFShip("all") });
  if (fDate !== "all") chips.push({ label: fDate, clear: () => setFDate("all") });
  if (fMin !== "" || fMax !== "") chips.push({ label: `${fMin || "0"}–${fMax || "∞"}`, clear: () => { setFMin(""); setFMax(""); } });
  if (fProduct.trim()) chips.push({ label: `prod:${fProduct.trim()}`, clear: () => setFProduct("") });
  if (fCustomer.trim()) chips.push({ label: `cust:${fCustomer.trim()}`, clear: () => setFCustomer("") });

  const clearFilters = () => {
    setQueryRaw(""); setCardFilter(null);
    setFStatus("all"); setFPayStatus("all"); setFPayMethod("all"); setFShip("all");
    setFDate("all"); setFMin(""); setFMax(""); setFProduct(""); setFCustomer("");
    setPage(0);
  };

  const setStatus = (o: VendorOrder, status: VendorOrderStatus) => {
    store.patchOrder(o.id, { status });
    store.logOrderEvent(o.id, "Status changed", `${o.status} → ${status}`);
    toast.success(t("toastOrder"));
  };

  const exportRows = (list: VendorOrder[]) => {
    const lines = [
      ["order", "date", "customer", "items", "total", "payment", "payStatus", "status", "earning"].join(","),
      ...list.map((o) => [o.id, o.date, o.customer, o.items.reduce((n, i) => n + i.qty, 0), o.total, o.payment, o.payStatus, o.status, o.earning].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exported"));
  };

  const printOrders = (ids: string[]) => {
    setPrintPreview(ids);
  };

  useEffect(() => {
    if (printPreview && printPreview.length > 0) {
      const id = window.setTimeout(() => {
        printInvoiceDoc("Vendor Orders");
        setPrintPreview(null);
      }, 150);
      return () => window.clearTimeout(id);
    }
  }, [printPreview]);

  const applyBulkStatus = () => {
    if (!bulkStatus) return;
    for (const id of activeSelected) {
      const o = orders.find((x) => x.id === id);
      if (o && NEXT_STATUS[o.status].includes(bulkStatus as VendorOrderStatus)) {
        store.patchOrder(id, { status: bulkStatus as VendorOrderStatus });
      }
    }
    setBulkStatus("");
    setSelected(new Set());
    toast.success(t("toastOrder"));
  };

  const bulkArchive = () => {
    for (const id of activeSelected) store.patchOrder(id, { archived: true });
    setSelected(new Set());
    toast.success(t("toastSaved"));
  };

  const payOrder = (id: string) => orders.find((o) => o.id === id) ?? null;
  const payViewed = payView ? payOrder(payView) : null;
  const custOrder = custView ? orders.find((o) => o.id === custView) ?? null : null;
  const prodOrder = prodView ? orders.find((o) => o.id === prodView) ?? null : null;

  const cards = [
    { key: "all", label: t("sAll"), value: counts.all },
    { key: "pending", label: t("kpiPending"), value: counts.pending },
    { key: "processing", label: t("sProcessing"), value: counts.processing },
    { key: "shipped", label: t("sShipped"), value: counts.shipped },
    { key: "delivered", label: t("sDelivered"), value: counts.delivered },
    { key: "cancelled", label: t("sCancelled"), value: counts.cancelled },
    { key: "returned", label: t("sReturned"), value: counts.returned },
    { key: "pendingPay", label: t("sPendingPay"), value: counts.pendingPay },
    { key: "completed", label: t("sCompleted"), value: counts.completed },
    { key: "refunded", label: t("sRefunded"), value: counts.refunded },
  ];

  const payBadge = (s: string) => (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      s === "paid" ? "bg-green-600/10 text-green-700"
      : s === "failed" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {t(s === "paid" ? "paid" : s === "pending" ? "pending" : s === "failed" ? "failedDelivery" : "refunded")}
    </span>
  );

  const statusBadge = (s: VendorOrderStatus) => (
    <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
      s === "completed" ? "bg-green-600/10 text-green-700"
      : s === "cancelled" ? "bg-destructive/10 text-destructive"
      : "bg-primary/20 text-[#8a5a00]")}>
      {t(s)}
    </span>
  );

  const rowActions = (o: VendorOrder) => (
    <>
      <Link href={`/vendor/orders/${o.id}`}>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${o.id}`} title={t("view")}>
          <Eye className="size-4" aria-hidden="true" />
        </Button>
      </Link>
      {o.status === "pending" ? (
        <Button variant="ghost" size="icon-sm" onClick={() => setStatus(o, "processing")} aria-label={`${t("process")} ${o.id}`} title={t("process")}>
          <Package className="size-4 text-secondary" aria-hidden="true" />
        </Button>
      ) : null}
      <Button variant="ghost" size="icon-sm" onClick={() => printOrders([o.id])} aria-label={`${t("printInvoice")} ${o.id}`} title={t("printInvoice")}>
        <Printer className="size-4" aria-hidden="true" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${t("moreTitle")} ${o.id}`} />}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/vendor/orders/${o.id}`} />}>{t("view")}</DropdownMenuItem>
          {o.status === "pending" ? (
            <DropdownMenuItem onClick={() => setStatus(o, "processing")}>{t("process")}</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => printOrders([o.id])}>{t("printInvoice")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => printOrders([o.id])}>{t("packSlip")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => printOrders([o.id])}>{t("shipLabel")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPayView(o.id)}>{t("payDetails")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCustView(o.id)}>{t("contactCustomer")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportRows([o])}>{t("exportOrder")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { store.patchOrder(o.id, { archived: true }); toast.success(t("toastSaved")); }}>
            {t("archiveOrder")}
          </DropdownMenuItem>
          {(o.status === "pending" || o.status === "processing") ? (
            <DropdownMenuItem onClick={() => setStatus(o, "cancelled")} className="text-destructive">
              {t("cancel")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_orders")}
        title={t("oTitle")}
        subtitle={t("oSubtitle", { count: filtered.length })}
        highlightLabel={t("kpiPending")}
        highlightValue={num(counts.pending)}
        highlightIcon={ShoppingCart}
      >
        <button type="button" onClick={() => setFiltersOpen(true)} className={heroPillClassName}>
          <Filter className="size-3.5" aria-hidden="true" />
          {t("advFilters")}
        </button>
        <button type="button" onClick={() => exportRows(filtered)} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <div className="flex gap-2" role="tablist" aria-label={t("oTitle")}>
        <Link
          href="/vendor/orders"
          aria-current="page"
          className="border border-secondary bg-secondary px-4 py-2 text-sm font-bold text-white"
        >
          {t("oTitle")}
        </Link>
        <Link
          href="/vendor/orders/returns"
          className="border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
        >
          {t("refunds")}
        </Link>
      </div>

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCardFilter(c.key === "all" ? null : c.key); setPage(0); }}
              aria-pressed={cardFilter === c.key || (c.key === "all" && !cardFilter)}
              className={cn("border bg-card p-3 text-left transition-colors hover:border-secondary",
                (cardFilter === c.key || (c.key === "all" && !cardFilter)) ? "border-secondary" : "border-border")}
            >
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</p>
              <p className="font-heading text-xl font-bold">{num(c.value)}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={queryRaw}
            onChange={(e) => { setQueryRaw(e.target.value); setPage(0); }}
            placeholder="Search by Order ID, customer, product, SKU or tracking number..."
            className="bg-card pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["newest", "oldest", "highestVal", "lowestVal", "recentUpd", "pendingFirst", "delivery", "customer"] as SortKey[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {t(s === "newest" ? "sortNewest" : s === "oldest" ? "sortOldest" : s === "highestVal" ? "sortHighestVal" : s === "lowestVal" ? "sortLowestVal" : s === "recentUpd" ? "sortRecentUpd" : s === "pendingFirst" ? "sortPendingFirst" : s === "delivery" ? "sortDelivery" : "sortCustomer")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <button key={i} type="button" onClick={c.clear} className="flex items-center gap-1 border border-secondary/50 bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary hover:bg-secondary/20" aria-label={`Clear ${c.label}`}>
              {c.label}
              <X className="size-3" aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="text-[11px] font-bold text-destructive hover:underline">
            Clear Filters
          </button>
        </div>
      ) : null}

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
              <p className="text-sm font-semibold">{activeSelected.length} selected</p>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v ?? "")}>
                  <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("updateStatus")}>
                    <SelectValue placeholder={t("updateStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["processing", "shipped", "completed", "cancelled"] as VendorOrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8" disabled={!bulkStatus} onClick={applyBulkStatus}>{t("updateStatus")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => printOrders(activeSelected)}>{t("printSelected")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => exportRows(orders.filter((o) => selected.has(o.id)))}>CSV</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card" onClick={bulkArchive}>{t("archiveOrder")}</Button>
              </div>
            </div>
          ) : null}
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            {visible.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={visible.length > 0 && visible.every((o) => selected.has(o.id))}
                        indeterminate={visible.some((o) => selected.has(o.id)) && !visible.every((o) => selected.has(o.id))}
                        onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          for (const o of visible) {
                            if (v === true) next.add(o.id);
                            else next.delete(o.id);
                          }
                          return next;
                        })} aria-label={t("oTitle")} />
                    </TableHead>
                    <TableHead>{t("tOrder")}</TableHead>
                    <TableHead>{t("tCustomer")}</TableHead>
                    <TableHead>{t("tProducts")}</TableHead>
                    <TableHead className="text-right">{t("tTotal")}</TableHead>
                    <TableHead>{t("tPayment2")}</TableHead>
                    <TableHead>{t("tFulfillment")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((o) => (
                    <TableRow key={o.id} className={cn("transition-colors hover:bg-muted/50", selected.has(o.id) && "bg-secondary/5")}>
                      <TableCell>
                        <Checkbox checked={selected.has(o.id)} onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(o.id);
                          else next.delete(o.id);
                          return next;
                        })} aria-label={o.id} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold whitespace-nowrap hover:text-secondary hover:underline">
                          #{o.id}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">{dateOf(o.date)} · {o.items.reduce((n, i) => n + i.qty, 0)} items</p>
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setCustView(o.id)} className="flex items-center gap-2 text-left">
                          <CustomerAvatar name={o.customer} size="sm" />
                          <span className="max-w-28 truncate text-sm font-semibold hover:text-secondary hover:underline" title={o.customer}>{o.customer}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setProdView(o.id)} className="flex items-center" aria-label={`${t("prodDrawer")} ${o.id}`}>
                          <span className="flex -space-x-2">
                            {o.items.slice(0, 3).map((item, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={item.image} alt={item.name} title={`${item.name} × ${item.qty}`} className="size-8 rounded-full border-2 border-card object-cover" loading="lazy" />
                            ))}
                          </span>
                          {o.items.length > 3 ? (
                            <span className="ml-1 bg-muted px-1.5 py-0.5 text-[10px] font-bold">+{o.items.length - 3}</span>
                          ) : (
                            <span className="ml-1 max-w-28 truncate text-xs" title={o.items[0]?.name}>{o.items[0]?.name}</span>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <button type="button" onClick={() => setPayView(o.id)} className="font-bold whitespace-nowrap hover:text-secondary hover:underline" title={t("payDetails")}>
                          {money(o.total)}
                        </button>
                        <p className="text-[10px] text-green-600">+{money(o.earning)}</p>
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setPayView(o.id)} title={t("payDetails")}>
                          {payBadge(o.payStatus)}
                        </button>
                        <p className="pt-0.5 text-[10px] uppercase text-muted-foreground">{o.payment}</p>
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-xs text-muted-foreground" title={o.tracking}>
                        {o.tracking ? (
                          <button type="button" onClick={() => { void navigator.clipboard.writeText(o.tracking); toast.success(t("copyTracking")); }} className="font-mono hover:text-secondary hover:underline" title={t("copyTracking")}>
                            {o.tracking}
                          </button>
                        ) : (
                          <span>{t("notShipped")}</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={o.status} onValueChange={(v) => {
                          const next = v as VendorOrderStatus;
                          if (NEXT_STATUS[o.status].includes(next)) setStatus(o, next);
                          else toast.error(t("toastOrder"));
                        }}>
                          <SelectTrigger size="sm" className="h-7 w-32 bg-card text-[11px] font-bold" aria-label={`${t("tStatus")} ${o.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[o.status, ...NEXT_STATUS[o.status]].map((s) => (
                              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">{rowActions(o)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={ShoppingCart} title={t("emptyTitle")} description={query || chips.length > 0 ? t("emptyDescription") : t("emptyOrders")} />
                {query || chips.length > 0 ? (
                  <Button variant="outline" size="sm" className="bg-card" onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Link href="/vendor/products">
                    <Button size="sm">{t("viewAll")}</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
          <CardContent className="grid gap-3 p-3 md:hidden">
            {visible.length > 0 ? visible.map((o) => (
              <div key={o.id} className={cn("flex flex-col gap-2 border bg-card p-3", selected.has(o.id) ? "border-secondary" : "border-border")}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={selected.has(o.id)} onCheckedChange={(v) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (v === true) next.add(o.id);
                    else next.delete(o.id);
                    return next;
                  })} aria-label={o.id} />
                  <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold">#{o.id}</Link>
                  <span className="ml-auto">{statusBadge(o.status)}</span>
                </div>
                <button type="button" onClick={() => setProdView(o.id)} className="flex items-center gap-2 text-left">
                  <span className="flex -space-x-2">
                    {o.items.slice(0, 3).map((item, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={item.image} alt={item.name} className="size-9 rounded-full border-2 border-card object-cover" loading="lazy" />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{o.items[0]?.name}</span>
                    {o.items.length > 1 ? <span className="text-xs text-muted-foreground">+{o.items.length - 1} more</span> : null}
                  </span>
                </button>
                <p className="truncate text-sm font-semibold">{o.customer}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-base font-bold text-secondary">{money(o.total)}</span>
                  {payBadge(o.payStatus)}
                </div>
                <p className="text-xs text-muted-foreground">{dateOf(o.date)}</p>
                <div className="flex items-center gap-0.5 border-t border-border pt-2">{rowActions(o)}</div>
              </div>
            )) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={ShoppingCart} title={t("emptyTitle")} description={t("emptyOrders")} />
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

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-heading text-base font-bold">{t("advFilters")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Field label={t("tStatus")}>
              <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(["pending", "processing", "shipped", "completed", "cancelled", "returned", "refunded"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fPayStatus")}>
              <Select value={fPayStatus} onValueChange={(v) => setFPayStatus(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["pending", "paid", "failed", "refunded"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fPayMethod")}>
              <Select value={fPayMethod} onValueChange={(v) => setFPayMethod(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["bKash", "Nagad", "COD", "Card", "Bank"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fShipStatus")}>
              <Select value={fShip} onValueChange={(v) => setFShip(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["notShipped", "preparing", "inTransit", "outDelivery", "delivered", "failedDelivery"].map((s) => (
                    <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDate")}>
              <Select value={fDate} onValueChange={(v) => setFDate(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["all", "All"], ["today", "Today"], ["yesterday", "Yesterday"], ["7days", "Last 7 Days"], ["30days", "Last 30 Days"], ["month", "This Month"], ["lastMonth", "Last Month"]].map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("fPrice2")}>
                <Input value={fMin} onChange={(e) => setFMin(e.target.value)} placeholder="Min" inputMode="decimal" className="bg-card" aria-label="Min" />
              </Field>
              <Field label="&nbsp;">
                <Input value={fMax} onChange={(e) => setFMax(e.target.value)} placeholder="Max" inputMode="decimal" className="bg-card" aria-label="Max" />
              </Field>
            </div>
            <Field label={t("fProduct")}>
              <Input value={fProduct} onChange={(e) => setFProduct(e.target.value)} placeholder="Name or SKU" className="bg-card" />
            </Field>
            <Field label={t("fCustomer")}>
              <Input value={fCustomer} onChange={(e) => setFCustomer(e.target.value)} placeholder="Name or location" className="bg-card" />
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-card" onClick={() => { clearFilters(); setFiltersOpen(false); }}>
                Clear Filters
              </Button>
              <Button className="flex-1" onClick={() => { setPage(0); setFiltersOpen(false); }}>
                {t("applyFilters")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!payViewed} onOpenChange={(open) => !open && setPayView(null)}>
        <DialogContent className="sm:max-w-md">
          {payViewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{t("payDetails")} · <span className="font-mono">{payViewed.id}</span></DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <PayKV label={t("fPayMethod")} value={payViewed.payment} />
                <PayKV label={t("fTxn")} value={payViewed.transactionId} />
                <PayKV label={t("fPayDate")} value={payViewed.payDate || "—"} />
                <PayKV label={t("fPayAmount")} value={money(payViewed.total)} />
                <PayKV label={t("tPayment2")} value={payViewed.payStatus} />
                <PayKV label={t("fRefundAmt")} value={money(payViewed.refunded)} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setPayView(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!custOrder} onOpenChange={(open) => !open && setCustView(null)}>
        <DialogContent className="sm:max-w-md">
          {custOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <CustomerAvatar name={custOrder.customer} />
                  {custOrder.customer}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <PayKV label="Email" value={custOrder.email} />
                <PayKV label="Phone" value={custOrder.phone} />
                <PayKV label={t("custOrders")} value={String(orders.filter((o) => o.email === custOrder.email).length)} />
                <PayKV label={t("custSpent")} value={money(orders.filter((o) => o.email === custOrder.email).reduce((n, o) => n + o.total, 0))} />
                <PayKV label={t("dShipping")} value={custOrder.address} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(custOrder.email); toast.success(t("copyEmail")); }}>
                  {t("copyEmail")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(custOrder.phone); toast.success(t("copyPhone")); }}>
                  {t("copyPhone")}
                </Button>
                <Button size="sm" onClick={() => setCustView(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!prodOrder} onOpenChange={(open) => !open && setProdView(null)}>
        <DialogContent className="sm:max-w-md">
          {prodOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{t("prodDrawer")} · <span className="font-mono">{prodOrder.id}</span></DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {prodOrder.items.map((item, i) => {
                  const match = products.find((p) => p.sku === item.sku);
                  const row = (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="size-12 shrink-0 object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{item.name}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">{item.sku} · Qty {item.qty}</span>
                      </span>
                      <span className="text-sm font-bold whitespace-nowrap">{money(item.price * item.qty)}</span>
                    </>
                  );
                  return match ? (
                    <Link key={i} href={`/vendor/products/${match.id}`} className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-secondary">
                      {row}
                    </Link>
                  ) : (
                    <div key={i} className="flex items-center gap-3 border border-border p-2">
                      {row}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setProdView(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <div id="invoice-print" className="hidden" aria-hidden="true">
        {printPreview?.map((id) => {
          const o = orders.find((x) => x.id === id);
          if (!o) return null;
          return (
            <div key={id} className="bg-white p-4 text-sm" style={{ pageBreakAfter: "always" }}>
              <p className="text-center font-heading text-xl font-bold">Ayesha Boutique — Invoice {o.id}</p>
              <p className="text-center">{o.customer} · {o.date} · {o.payment}</p>
              {o.items.map((item, i) => (
                <div key={i} className="flex justify-between border-b py-1">
                  <span>{item.name} × {item.qty}</span>
                  <span>{money(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span>Total</span>
                <span>{money(o.total)}</span>
              </div>
              <p>Vendor earning: {money(o.earning)} (commission {money(o.commission)})</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
