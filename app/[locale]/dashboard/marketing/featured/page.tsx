"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { MarketingStatusBadge } from "@/components/admin/marketing/shared";
import { Field } from "@/components/admin/products/edit/sections";
import type { FeaturedProduct, MktStatus } from "@/features/admin/marketing";
import { useMarketingStore, useMktFeatured } from "@/store/marketing.store";
import { toast } from "sonner";

const SECTIONS = ["Homepage Featured", "Trending Products", "Best Sellers", "New Arrivals", "Editor's Choice", "Recommended", "Category Featured", "Vendor Featured"];

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Star className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function FeaturedProductsPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const featured = useMktFeatured();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fProduct, setFProduct] = useState("");
  const [fVendor, setFVendor] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fPrice, setFPrice] = useState(2000);
  const [fSection, setFSection] = useState(SECTIONS[0]);
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return featured;
    return featured.filter((f) => f.product.toLowerCase().includes(q) || f.vendor.toLowerCase().includes(q));
  }, [featured, query]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => a.position - b.position), [filtered]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const byStatus = (s: MktStatus) => featured.filter((f) => f.status === s).length;
  const stats = [
    { label: t("sFtTotal"), value: num(featured.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sFtActive"), value: num(byStatus("active")), tile: "bg-green-600/10 text-green-700" },
    { label: t("sFtScheduled"), value: num(byStatus("scheduled")), tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("sFtExpired"), value: num(byStatus("expired")), tile: "bg-muted text-muted-foreground" },
  ];

  const move = (f: FeaturedProduct, dir: -1 | 1) => {
    const ordered = [...featured].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((x) => x.id === f.id);
    const swapWith = ordered[idx + dir];
    if (!swapWith) return;
    store.patchFeatured(f.id, { position: swapWith.position });
    store.patchFeatured(swapWith.id, { position: f.position });
  };

  const handleAdd = () => {
    if (!fProduct.trim()) return;
    const maxPos = featured.reduce((n, f) => Math.max(n, f.position), 0);
    store.addFeatured({
      id: `ft-${featured.length + 1}`,
      product: fProduct.trim(), image: "/images/women/women-1.jpg",
      vendor: fVendor.trim() || "—", category: fCategory.trim() || "—",
      price: fPrice, position: maxPos + 1, section: fSection,
      start: fStart, end: fEnd, status: "scheduled",
    });
    setDialogOpen(false);
    toast.success(t("toastCreated"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("ftTitle")}
        subtitle={t("ftSubtitle", { count: filtered.length })}
        highlightLabel={t("sFtActive")}
        highlightValue={num(byStatus("active"))}
        highlightIcon={Star}
      >
        <button type="button" onClick={() => setDialogOpen(true)} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addFeatured")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("ftSections")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const count = featured.filter((f) => f.section === s).length;
            return (
              <span key={s} className="flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-xs font-semibold">
                {s}
                <span className="bg-secondary/15 px-1.5 text-[11px] font-bold text-secondary">{count}</span>
              </span>
            );
          })}
        </CardContent>
      </Card>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="text-center">{t("tPosition")}</TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead>{t("tCategory")}</TableHead>
                  <TableHead className="text-right">{t("tPrice")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-0.5">
                        <button type="button" onClick={() => move(f, -1)} aria-label={`${t("moveUp")} ${f.product}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowUp className="size-3" aria-hidden="true" />
                        </button>
                        <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                          {f.position}
                        </span>
                        <button type="button" onClick={() => move(f, 1)} aria-label={`${t("moveDown")} ${f.product}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowDown className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm font-semibold" title={f.product}>{f.product}</p>
                      <p className="text-xs text-muted-foreground">{f.section} · {f.start} → {f.end}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{f.vendor}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{f.category}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(f.price)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={f.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {f.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchFeatured(f.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={f.product} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchFeatured(f.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={f.product} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeFeatured([f.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={f.product}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
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
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("addFeatured")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tProduct")}>
              <Input value={fProduct} onChange={(e) => setFProduct(e.target.value)} className="bg-card" placeholder="Printed Kurti" />
            </Field>
            <Field label={t("tVendor")}>
              <Input value={fVendor} onChange={(e) => setFVendor(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tCategory")}>
              <Input value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tPrice")}>
              <Input type="number" min={0} value={fPrice} onChange={(e) => setFPrice(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("ftSections")}>
              <Select value={fSection} onValueChange={(v) => setFSection(v ?? SECTIONS[0])}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("fStartDate")}>
                <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fEndDate")}>
                <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleAdd}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
