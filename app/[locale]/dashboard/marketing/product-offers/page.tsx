"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Power,
  Search,
  Tags,
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
import type { MktStatus, ProductOffer } from "@/features/admin/marketing";
import { useMarketingStore, useMktProductOffers } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductOffersPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const offers = useMktProductOffers();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [bulkPct, setBulkPct] = useState(10);
  const [fProduct, setFProduct] = useState("");
  const [fVendor, setFVendor] = useState("");
  const [fRegular, setFRegular] = useState(2000);
  const [fDiscount, setFDiscount] = useState(20);
  const [fStock, setFStock] = useState(50);
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => o.product.toLowerCase().includes(q) || o.vendor.toLowerCase().includes(q));
  }, [offers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => offers.some((o) => o.id === id)),
    [selected, offers]
  );

  const pct = (o: ProductOffer) => Math.round(((o.regular - o.offer) / Math.max(1, o.regular)) * 100);

  const openAdd = () => {
    setEditId(null);
    setFProduct(""); setFVendor("");
    setFRegular(2000); setFDiscount(20); setFStock(50);
    setFStart("2026-09-26"); setFEnd("2026-10-26");
    setDialogOpen(true);
  };

  const openEdit = (o: ProductOffer) => {
    setEditId(o.id);
    setFProduct(o.product); setFVendor(o.vendor);
    setFRegular(o.regular); setFDiscount(pct(o)); setFStock(o.stock);
    setFStart(o.start); setFEnd(o.end);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fProduct.trim()) return;
    const offer = Math.round(fRegular * (1 - fDiscount / 100));
    if (editId) {
      store.patchProductOffer(editId, { product: fProduct.trim(), vendor: fVendor.trim(), regular: fRegular, offer, stock: fStock, start: fStart, end: fEnd });
      toast.success(t("toastUpdated"));
    } else {
      store.addProductOffer({
        id: `po-${offers.length + 1}`,
        product: fProduct.trim(), image: "/images/women/women-1.jpg", vendor: fVendor.trim() || "—",
        regular: fRegular, offer, stock: fStock, start: fStart, end: fEnd, status: "scheduled",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const bulkDiscount = () => {
    for (const id of activeSelected) {
      const o = offers.find((x) => x.id === id);
      if (o) store.patchProductOffer(id, { offer: Math.round(o.regular * (1 - bulkPct / 100)) });
    }
    toast.success(t("toastUpdated"));
  };

  const bulkStatus = (status: MktStatus) => {
    for (const id of activeSelected) store.patchProductOffer(id, { status });
    setSelected(new Set());
    toast.success(status === "active" ? t("toastActivated") : t("toastPaused"));
  };

  const viewed = viewId ? (offers.find((o) => o.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("poTitle")}
        subtitle={t("poSubtitle", { count: filtered.length })}
        highlightLabel={t("tOffer")}
        highlightValue={num(offers.filter((o) => o.status === "active").length)}
        highlightIcon={Tags}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addOffer")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        {activeSelected.length > 0 ? (
          <div className="flex items-center gap-2">
            <Input type="number" min={1} max={90} value={bulkPct} onChange={(e) => setBulkPct(Math.max(1, Number(e.target.value) || 10))} className="h-8 w-20 bg-card" aria-label={t("bulkApply")} />
            <Button variant="outline" size="sm" className="h-8 bg-card" onClick={bulkDiscount}>{t("bulkApply")} ({activeSelected.length})</Button>
            <Button variant="outline" size="sm" className="h-8 bg-card" onClick={() => bulkStatus("active")}>{t("bulkActivate")}</Button>
            <Button variant="outline" size="sm" className="h-8 bg-card" onClick={() => bulkStatus("paused")}>{t("bulkDisable")}</Button>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={visible.length > 0 && visible.every((o) => selected.has(o.id))}
                      indeterminate={visible.some((o) => selected.has(o.id)) && !visible.every((o) => selected.has(o.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const o of visible) {
                            if (v === true) next.add(o.id);
                            else next.delete(o.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("poTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead className="text-right">{t("tPrice")}</TableHead>
                  <TableHead className="text-right">{t("tOffer")}</TableHead>
                  <TableHead className="text-right">{t("tDiscount")}</TableHead>
                  <TableHead className="text-right">{t("tStock")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((o) => (
                  <TableRow key={o.id} className={cn(selected.has(o.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(o.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(o.id);
                        else next.delete(o.id);
                        return next;
                      })} aria-label={o.product} />
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm font-semibold" title={o.product}>{o.product}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{o.vendor}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground line-through">{money(o.regular)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(o.offer)}</TableCell>
                    <TableCell className="text-right">
                      <span className="bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">{pct(o)}%</span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{num(o.stock)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(o.id)} aria-label={`${t("viewTitle")} ${o.product}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)} aria-label={`${t("editTitle")} ${o.product}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => store.patchProductOffer(o.id, { status: o.status === "active" ? "paused" : "active" })} aria-label={o.product} title={o.product}>
                          <Power className={cn("size-4", o.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Tags} title={t("emptyTitle")} description={t("emptyDescription")} />
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-sm">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{t("offerPreview")}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-1 border border-dashed border-secondary/40 bg-secondary/5 px-4 py-6 text-center">
                <span className="bg-destructive px-3 py-0.5 text-xs font-bold text-white">{pct(viewed)}% OFF</span>
                <span className="font-heading text-lg font-bold">{viewed.product}</span>
                <span className="text-sm text-muted-foreground line-through">{money(viewed.regular)}</span>
                <span className="font-heading text-2xl font-bold text-secondary">{money(viewed.offer)}</span>
                <span className="text-xs text-muted-foreground">{t("limitedOffer")}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addOffer")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tProduct")}>
              <Input value={fProduct} onChange={(e) => setFProduct(e.target.value)} className="bg-card" placeholder="Printed Kurti" />
            </Field>
            <Field label={t("tVendor")}>
              <Input value={fVendor} onChange={(e) => setFVendor(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tPrice")}>
              <Input type="number" min={0} value={fRegular} onChange={(e) => setFRegular(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("tDiscount")}>
              <Input type="number" min={1} max={90} value={fDiscount} onChange={(e) => setFDiscount(Math.max(1, Number(e.target.value) || 20))} className="bg-card" />
            </Field>
            <Field label={t("tStock")}>
              <Input type="number" min={0} value={fStock} onChange={(e) => setFStock(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("tOffer")}>
              <Input value={money(Math.round(fRegular * (1 - fDiscount / 100)))} readOnly className="bg-muted font-bold" aria-label={t("tOffer")} />
            </Field>
            <Field label={t("fStartDate")}>
              <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fEndDate")}>
              <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
