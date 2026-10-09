"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Package } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { ProductVariation } from "@/features/vendor/vendor";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductVariationsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const products = useVendorProducts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkField, setBulkField] = useState<"stock" | "price">("stock");
  const [bulkValue, setBulkValue] = useState(0);
  const [fName, setFName] = useState("");
  const [fSku, setFSku] = useState("");
  const [fPrice, setFPrice] = useState(0);
  const [fSale, setFSale] = useState(0);
  const [fStock, setFStock] = useState(0);
  const [fWeight, setFWeight] = useState(0);

  if (!product) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_products")}
          title={t("vTitle")}
          subtitle={id}
          highlightLabel={t("vTitle")}
          highlightValue="0"
          highlightIcon={Package}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyProducts")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFSku(""); setFPrice(product.price);
    setFSale(0); setFStock(10); setFWeight(product.weight);
    setDialogOpen(true);
  };

  const openEdit = (v: ProductVariation) => {
    setEditId(v.id);
    setFName(v.name); setFSku(v.sku); setFPrice(v.price);
    setFSale(v.salePrice); setFStock(v.stock); setFWeight(v.weight);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fSku.trim()) return;
    if (editId) {
      store.patchVariation(product.id, editId, {
        name: fName.trim(), sku: fSku.trim().toUpperCase(),
        price: fPrice, salePrice: fSale, stock: Math.max(0, fStock), weight: fWeight,
      });
      toast.success(t("toastSaved"));
    } else {
      store.addVariation(product.id, {
        id: `v-new-${(product.variations ?? []).length + 1}`,
        name: fName.trim(), sku: fSku.trim().toUpperCase(),
        attributes: fName.trim(), image: product.image,
        price: fPrice, salePrice: fSale, stock: Math.max(0, fStock), weight: fWeight,
        status: "active",
      });
      toast.success(t("toastSaved"));
    }
    setDialogOpen(false);
  };

  const generate = () => {
    const sizes = ["S", "M", "L"];
    const base = (product.variations ?? []).length;
    sizes.forEach((s, i) => {
      store.addVariation(product.id, {
        id: `v-gen-${base + i + 1}`,
        name: `Default / ${s}`, sku: `${product.sku}-${s}`,
        attributes: s, image: product.image,
        price: product.price, salePrice: 0, stock: 10, weight: product.weight,
        status: "active",
      });
    });
    toast.success(t("toastSaved"));
  };

  const bulkApply = () => {
    for (const vid of selected) {
      if (bulkField === "stock") store.patchVariation(product.id, vid, { stock: Math.max(0, bulkValue) });
      else store.patchVariation(product.id, vid, { price: Math.max(0, bulkValue) });
    }
    setSelected(new Set());
    setBulkOpen(false);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={`${t("vTitle")} · ${product.name}`}
        subtitle={t("vSubtitle", { count: (product.variations ?? []).length })}
        highlightLabel={t("tStock")}
        highlightValue={String((product.variations ?? []).reduce((n, v) => n + v.stock, 0))}
        highlightIcon={Package}
      >
        <Link href={`/vendor/products/${product.id}`} className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("view")}
        </Link>
        <button type="button" onClick={generate} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("genVariations")}
        </button>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addVariation")}
        </button>
      </AccountingHero>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-card px-4 py-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("resetFilters")}>
            <X className="size-4" aria-hidden="true" />
          </Button>
          <p className="text-sm font-semibold">{t("selectedCount", { count: selected.size })}</p>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={() => { setBulkField("stock"); setBulkValue(10); setBulkOpen(true); }}>
              {t("updateStock")}
            </Button>
            <Button size="sm" variant="outline" className="h-8 bg-card text-xs" onClick={() => { setBulkField("price"); setBulkValue(product.price); setBulkOpen(true); }}>
              {t("updatePrice")}
            </Button>
            <Button size="sm" variant="outline" className="h-8 bg-card text-xs text-destructive hover:text-destructive" onClick={() => {
              store.removeVariations(product.id, [...selected]);
              setSelected(new Set());
              toast.success(t("toastSaved"));
            }}>
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {(product.variations ?? []).length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={(product.variations ?? []).length > 0 && product.variations.every((v) => selected.has(v.id))}
                      indeterminate={(product.variations ?? []).some((v) => selected.has(v.id)) && !(product.variations ?? []).every((v) => selected.has(v.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const x of (product.variations ?? [])) {
                            if (v === true) next.add(x.id);
                            else next.delete(x.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("vTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tImage")}</TableHead>
                  <TableHead>{t("tVariation")}</TableHead>
                  <TableHead>{t("tAttributes")}</TableHead>
                  <TableHead>{t("vSku")}</TableHead>
                  <TableHead className="text-right">{t("vPrice")}</TableHead>
                  <TableHead className="text-right">{t("vStock")}</TableHead>
                  <TableHead>{t("vStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(product.variations ?? []).map((v) => (
                  <TableRow key={v.id} className={cn(selected.has(v.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(v.id)} onCheckedChange={(c) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (c === true) next.add(v.id);
                        else next.delete(v.id);
                        return next;
                      })} aria-label={v.name} />
                    </TableCell>
                    <TableCell>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.image} alt={v.name} className="size-9 object-cover" loading="lazy" />
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{v.name}</TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={v.attributes}>{v.attributes}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{v.sku}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap">
                      {v.salePrice > 0 ? (
                        <span className="flex flex-col items-end">
                          <span className="text-secondary">{money(v.salePrice)}</span>
                          <span className="text-[11px] font-normal text-muted-foreground line-through">{money(v.price)}</span>
                        </span>
                      ) : money(v.price)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold">{v.stock}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => store.patchVariation(product.id, v.id, { status: v.status === "active" ? "inactive" : "active" })}
                        className={cn("px-2 py-0.5 text-[11px] font-bold", v.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}
                        aria-label={`${t("vStatus")} ${v.name}`}
                      >
                        {v.status}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)} aria-label={`${t("edit")} ${v.name}`} title={t("edit")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.addVariation(product.id, { ...v, id: `v-copy-${(product.variations ?? []).length + 1}`, sku: `${v.sku}-COPY` });
                          toast.success(t("dupDone"));
                        }} aria-label={v.name} title={t("bulkDuplicate")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => {
                          store.removeVariations(product.id, [v.id]);
                          toast.success(t("toastSaved"));
                        }} aria-label={v.name}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyProducts")} />
              <Button size="sm" onClick={generate}>{t("genVariations")}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("edit") : t("addVariation")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tVariation")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Red / M" />
            </Field>
            <Field label={t("vSku")}>
              <Input value={fSku} onChange={(e) => setFSku(e.target.value.toUpperCase())} className="bg-card font-mono" />
            </Field>
            <Field label={t("vPrice")}>
              <Input type="number" min={0} value={fPrice} onChange={(e) => setFPrice(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("vSale")}>
              <Input type="number" min={0} value={fSale} onChange={(e) => setFSale(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("vStock")}>
              <Input type="number" min={0} value={fStock} onChange={(e) => setFStock(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("vWeight")}>
              <Input type="number" min={0} value={fWeight} onChange={(e) => setFWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("bulkEdit")}</DialogTitle>
          </DialogHeader>
          <Field label={bulkField === "stock" ? t("updateStock") : t("updatePrice")}>
            <Input type="number" min={0} value={bulkValue} onChange={(e) => setBulkValue(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={bulkApply}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
