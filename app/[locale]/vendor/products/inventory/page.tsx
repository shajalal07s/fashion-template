"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Eye, Package, Pencil, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { VendorProduct } from "@/features/vendor/vendor";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorInventoryPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const products = useVendorProducts();
  const store = useVendorStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjQty, setAdjQty] = useState(0);
  const [adjNote, setAdjNote] = useState("");
  const [historyId, setHistoryId] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const st = p.stock <= 0 ? "out" : p.stock <= p.lowThreshold ? "low" : "in";
      if (stockFilter !== "all" && st !== stockFilter) return false;
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, stockFilter, catFilter]);

  const adjusting = adjustId ? (products.find((p) => p.id === adjustId) ?? null) : null;
  const historyOf = historyId ? (products.find((p) => p.id === historyId) ?? null) : null;

  const handleAdjust = () => {
    if (!adjusting || !adjNote.trim()) return;
    store.adjustStock(adjusting.id, adjQty, adjNote.trim());
    setAdjustId(null);
    setAdjQty(0);
    setAdjNote("");
    toast.success(t("toastStock"));
  };

  const openAdjust = (p: VendorProduct) => {
    setAdjustId(p.id);
    setAdjQty(10);
    setAdjNote("Restock");
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={t("iTitle")}
        subtitle={t("iSubtitle", { count: filtered.length })}
        highlightLabel={t("tCurrent")}
        highlightValue={num(products.reduce((n, p) => n + p.stock, 0))}
        highlightIcon={Package}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fStock")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in">{t("stIn")}</SelectItem>
            <SelectItem value="low">{t("stLow")}</SelectItem>
            <SelectItem value="out">{t("stOut")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label={t("fCategory")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tVariation2")}</TableHead>
                  <TableHead className="text-right">{t("tCurrent")}</TableHead>
                  <TableHead className="text-right">{t("tThreshold")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tLastUpdated")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const st = p.stock <= 0 ? "out" : p.stock <= p.lowThreshold ? "low" : "in";
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="size-9 shrink-0 object-cover" loading="lazy" />
                          <div className="min-w-0">
                            <p className="max-w-40 truncate text-sm font-semibold" title={p.name}>{p.name}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(p.variations ?? []).length > 0 ? `${(p.variations ?? []).length} var` : "—"}
                      </TableCell>
                      <TableCell className={cn("text-right text-sm font-bold", st === "out" ? "text-destructive" : st === "low" ? "text-[#8a5a00]" : "")}>
                        {num(p.stock)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{num(p.lowThreshold)}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", st === "out" ? "bg-destructive/10 text-destructive" : st === "low" ? "bg-primary/20 text-[#8a5a00]" : "bg-green-600/10 text-green-700")}>
                          {t(st === "out" ? "stOut" : st === "low" ? "stLow" : "stIn")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.updated}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openAdjust(p)}>
                            {t("updateStock")}
                          </Button>
                          <Link href={`/vendor/products/${p.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" aria-label={`${t("edit")} ${p.name}`} title={t("edit")}>
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm" onClick={() => setHistoryId(p.id)} aria-label={`${t("stockHistory")} ${p.name}`} title={t("stockHistory")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyProducts")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!adjusting} onOpenChange={(open) => !open && setAdjustId(null)}>
        <DialogContent className="sm:max-w-md">
          {adjusting ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("adjustTitle")} · {adjusting.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("adjQty")}>
                  <Input type="number" value={adjQty} onChange={(e) => setAdjQty(Number(e.target.value) || 0)} className="bg-card" />
                </Field>
                <Field label={t("adjNote")}>
                  <Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} className="bg-card" />
                </Field>
              </div>
              <div className="border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-center text-sm">
                {t("tCurrent")}: <strong>{num(adjusting.stock)}</strong>
                {" → "}
                {t("newBalance")}: <strong className="text-secondary">{num(Math.max(0, adjusting.stock + adjQty))}</strong>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdjustId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={handleAdjust}>{t("saveBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyOf} onOpenChange={(open) => !open && setHistoryId(null)}>
        <DialogContent className="sm:max-w-md">
          {historyOf ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("stockHistory")} · {historyOf.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border">
                {historyOf.stockHistory.length > 0 ? (historyOf.stockHistory ?? []).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 text-sm">
                    <span className={cn("font-mono font-bold", h.change >= 0 ? "text-green-600" : "text-destructive")}>
                      {h.change >= 0 ? "+" : ""}{h.change}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{h.note}</span>
                    <span className="font-bold">= {h.balance}</span>
                    <span className="text-xs text-muted-foreground">{h.date}</span>
                  </div>
                )) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setHistoryId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
