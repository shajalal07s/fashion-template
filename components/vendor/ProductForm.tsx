"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import type { ProductVariation, VendorProduct, VendorProductStatus } from "@/features/vendor/vendor";

export interface ProductFormValue {
  name: string;
  shortDesc: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  type: string;
  tags: string;
  image: string;
  gallery: string[];
  video: string;
  price: number;
  salePrice: number;
  saleStart: string;
  saleEnd: string;
  costPrice: number;
  tax: number;
  taxClass: string;
  sku: string;
  barcode: string;
  stock: number;
  lowThreshold: number;
  manageStock: boolean;
  backorder: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  shipClass: string;
  delivery: string;
  attributes: Array<{ name: string; values: string }>;
  variations: ProductVariation[];
  seoTitle: string;
  seoDesc: string;
  slug: string;
  keywords: string;
  featured: boolean;
  visibility: string;
  status: VendorProductStatus;
  allowReviews: boolean;
  purchaseLimit: number;
}

export const blankForm = (categories: string[]): ProductFormValue => ({
  name: "",
  shortDesc: "",
  description: "",
  category: categories[0] ?? "Women",
  subCategory: "",
  brand: "Ayesha Boutique",
  type: "Simple",
  tags: "",
  image: "/images/women/women-1.jpg",
  gallery: [],
  video: "",
  price: 1000,
  salePrice: 0,
  saleStart: "",
  saleEnd: "",
  costPrice: 0,
  tax: 0,
  taxClass: "Standard",
  sku: "",
  barcode: "",
  stock: 10,
  lowThreshold: 5,
  manageStock: true,
  backorder: false,
  weight: 0.3,
  length: 0,
  width: 0,
  height: 0,
  shipClass: "Standard",
  delivery: "",
  attributes: [],
  variations: [],
  seoTitle: "",
  seoDesc: "",
  slug: "",
  keywords: "",
  featured: false,
  visibility: "Public",
  status: "draft",
  allowReviews: true,
  purchaseLimit: 5,
});

export const fromProduct = (p: VendorProduct): ProductFormValue => ({
  name: p.name,
  shortDesc: p.shortDesc,
  description: p.description,
  category: p.category,
  subCategory: p.subCategory,
  brand: p.brand,
  type: p.type,
  tags: (p.tags ?? []).join(", "),
  image: p.image,
  gallery: [...(p.gallery ?? [])],
  video: "",
  price: p.price,
  salePrice: p.salePrice,
  saleStart: p.saleStart,
  saleEnd: p.saleEnd,
  costPrice: p.costPrice,
  tax: 0,
  taxClass: "Standard",
  sku: p.sku,
  barcode: "",
  stock: p.stock,
  lowThreshold: p.lowThreshold,
  manageStock: p.manageStock,
  backorder: p.backorder,
  weight: p.weight,
  length: p.length,
  width: p.width,
  height: p.height,
  shipClass: p.shipClass,
  delivery: "",
  attributes: (p.attributes ?? []).map((a) => ({ name: a.name, values: a.values.join(", ") })),
  variations: (p.variations ?? []).map((v) => ({ ...v })),
  seoTitle: p.seoTitle,
  seoDesc: p.seoDesc,
  slug: p.slug,
  keywords: p.keywords,
  featured: p.featured,
  visibility: p.visibility,
  status: p.status === "out" ? "active" : p.status,
  allowReviews: p.allowReviews,
  purchaseLimit: p.purchaseLimit,
});

export function ProductForm({
  value,
  onChange,
  errors,
  categories,
}: {
  value: ProductFormValue;
  onChange: (v: ProductFormValue) => void;
  errors: Record<string, string>;
  categories: string[];
}) {
  const t = useTranslations("Dashboard.Vendor");
  const [attrName, setAttrName] = useState("");
  const [attrValues, setAttrValues] = useState("");
  const [galleryUrl, setGalleryUrl] = useState("");

  const set = <K extends keyof ProductFormValue>(k: K, v: ProductFormValue[K]) =>
    onChange({ ...value, [k]: v });

  const err = (k: string) =>
    errors[k] ? <p className="text-xs font-semibold text-destructive">{errors[k]}</p> : null;

  const salePreview = useMemo(() => {
    if (value.salePrice > 0 && value.salePrice < value.price) {
      return Math.round(((value.price - value.salePrice) / value.price) * 100);
    }
    return 0;
  }, [value.price, value.salePrice]);

  const addAttribute = () => {
    if (!attrName.trim()) return;
    onChange({
      ...value,
      attributes: [...value.attributes, { name: attrName.trim(), values: attrValues }],
    });
    setAttrName("");
    setAttrValues("");
  };

  const generateVariations = () => {
    const sizeAttr = value.attributes.find((a) => a.name.toLowerCase() === "size");
    const colorAttr = value.attributes.find((a) => a.name.toLowerCase() === "color");
    const sizes = sizeAttr ? sizeAttr.values.split(",").map((s) => s.trim()).filter(Boolean) : ["M"];
    const colors = colorAttr ? colorAttr.values.split(",").map((s) => s.trim()).filter(Boolean) : [""];
    const list: ProductVariation[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        const label = [color, size].filter(Boolean).join(" / ") || `Var ${list.length + 1}`;
        list.push({
          id: `v-new-${list.length + 1}`,
          name: label,
          sku: `${value.sku || "SKU"}-${label.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`,
          attributes: label,
          image: value.image,
          price: value.price,
          salePrice: value.salePrice,
          stock: value.stock,
          weight: value.weight,
          status: "active",
        });
      }
    }
    onChange({ ...value, type: "Variable", variations: list });
  };

  const patchVariation = (id: string, patch: Partial<ProductVariation>) =>
    onChange({ ...value, variations: value.variations.map((v) => (v.id === id ? { ...v, ...patch } : v)) });

  return (
    <div className="grid items-start gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-6 xl:col-span-2">
        <SectionCard title={t("secBasic")}>
          <Field label={`${t("fName")} *`}>
            <Input value={value.name} onChange={(e) => set("name", e.target.value)} className="bg-card" aria-invalid={!!errors.name} />
            {err("name")}
          </Field>
          <Field label={t("fShort")}>
            <Input value={value.shortDesc} onChange={(e) => set("shortDesc", e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("fDesc")}>
            <RichTextEditor value={value.description} onChange={(v) => set("description", v)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fCategory")}>
              <Select value={value.category} onValueChange={(v) => set("category", v ?? value.category)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fSub")}>
              <Input value={value.subCategory} onChange={(e) => set("subCategory", e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fBrand")}>
              <Input value={value.brand} onChange={(e) => set("brand", e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fType")}>
              <Select value={value.type} onValueChange={(v) => set("type", v ?? "Simple")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Simple", "Variable"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fTags")}>
              <Input value={value.tags} onChange={(e) => set("tags", e.target.value)} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secMedia")}>
          <Field label={t("fImage")}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {value.image ? <img src={value.image} alt="" className="size-16 object-cover" /> : null}
              <Input value={value.image} onChange={(e) => set("image", e.target.value)} className="bg-card font-mono text-xs" placeholder="/images/…" />
            </div>
          </Field>
          <Field label={t("fGallery")}>
            <div className="flex gap-2">
              <Input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} className="bg-card font-mono text-xs" placeholder="/images/… (Enter to add)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && galleryUrl.trim()) {
                    e.preventDefault();
                    set("gallery", [...value.gallery, galleryUrl.trim()]);
                    setGalleryUrl("");
                  }
                }} />
              <Button size="sm" className="h-9 shrink-0" onClick={() => {
                if (galleryUrl.trim()) {
                  set("gallery", [...value.gallery, galleryUrl.trim()]);
                  setGalleryUrl("");
                }
              }}>
                <Plus className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
            {value.gallery.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {value.gallery.map((g, i) => (
                  <span key={i} className="relative block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="size-16 object-cover" />
                    <span className="absolute top-0 left-0 flex gap-0.5 bg-black/50 p-0.5">
                      <button type="button" disabled={i === 0} onClick={() => {
                        const next = [...value.gallery];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        set("gallery", next);
                      }} aria-label="Move left" className="px-1 text-[10px] font-bold text-white disabled:opacity-40">‹</button>
                      <button type="button" disabled={i === value.gallery.length - 1} onClick={() => {
                        const next = [...value.gallery];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        set("gallery", next);
                      }} aria-label="Move right" className="px-1 text-[10px] font-bold text-white disabled:opacity-40">›</button>
                      <button type="button" onClick={() => set("gallery", value.gallery.filter((_, x) => x !== i))} aria-label="Remove" className="px-1 text-[10px] font-bold text-white">
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </Field>
          <Field label={t("fVideo")}>
            <Input value={value.video} onChange={(e) => set("video", e.target.value)} className="bg-card font-mono text-xs" placeholder="https://youtube.com/…" />
          </Field>
        </SectionCard>

        <SectionCard title={t("secPricing")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`${t("fRegular")} *`}>
              <Input type="number" min={0} value={value.price} onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-invalid={!!errors.price} />
              {err("price")}
            </Field>
            <Field label={t("fSale")}>
              <Input type="number" min={0} value={value.salePrice} onChange={(e) => set("salePrice", Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fCost")}>
              <Input type="number" min={0} value={value.costPrice} onChange={(e) => set("costPrice", Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fSaleStart")}>
              <Input type="date" value={value.saleStart} onChange={(e) => set("saleStart", e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fSaleEnd")}>
              <Input type="date" value={value.saleEnd} onChange={(e) => set("saleEnd", e.target.value)} className="bg-card" />
            </Field>
            <div className="flex items-end gap-2">
              <Field label={t("fTax")}>
                <Input type="number" min={0} value={value.tax} onChange={(e) => set("tax", Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fTaxClass")}>
                <Input value={value.taxClass} onChange={(e) => set("taxClass", e.target.value)} className="bg-card" />
              </Field>
            </div>
          </div>
          {salePreview > 0 ? (
            <p className="w-fit bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
              {salePreview}% OFF preview
            </p>
          ) : null}
        </SectionCard>

        <SectionCard title={t("secInventory")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`${t("fSku")} *`}>
              <Input value={value.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className="bg-card font-mono" aria-invalid={!!errors.sku} />
              {err("sku")}
            </Field>
            <Field label={t("fBarcode")}>
              <Input value={value.barcode} onChange={(e) => set("barcode", e.target.value)} className="bg-card font-mono" />
            </Field>
            <Field label={t("fQty")}>
              <Input type="number" min={0} value={value.stock} onChange={(e) => set("stock", Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-invalid={!!errors.stock} />
              {err("stock")}
            </Field>
            <Field label={t("fThreshold")}>
              <Input type="number" min={0} value={value.lowThreshold} onChange={(e) => set("lowThreshold", Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fStockStatus")}>
              <Input value={value.stock <= 0 ? "Out of Stock" : value.stock <= value.lowThreshold ? "Low Stock" : "In Stock"} readOnly className="bg-muted" aria-label={t("fStockStatus")} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={value.manageStock} onChange={(e) => set("manageStock", e.target.checked)} aria-label={t("fManage")} className="size-4 accent-[#ff8000]" />
              {t("fManage")}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={value.backorder} onChange={(e) => set("backorder", e.target.checked)} aria-label={t("fBackorder")} className="size-4 accent-[#ff8000]" />
              {t("fBackorder")}
            </label>
          </div>
        </SectionCard>

        <SectionCard title={t("secShipping")}>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label={t("fWeight")}>
              <Input type="number" min={0} value={value.weight} onChange={(e) => set("weight", Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label="L">
              <Input type="number" min={0} value={value.length} onChange={(e) => set("length", Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label="Length" />
            </Field>
            <Field label="W">
              <Input type="number" min={0} value={value.width} onChange={(e) => set("width", Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label="Width" />
            </Field>
            <Field label="H">
              <Input type="number" min={0} value={value.height} onChange={(e) => set("height", Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label="Height" />
            </Field>
            <Field label={t("fShipClass")}>
              <Input value={value.shipClass} onChange={(e) => set("shipClass", e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fDelivery")}>
              <Input value={value.delivery} onChange={(e) => set("delivery", e.target.value)} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secAttributes")}>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={attrName} onChange={(e) => setAttrName(e.target.value)} placeholder={t("fAttrName")} className="bg-card" aria-label={t("fAttrName")} />
            <Input value={attrValues} onChange={(e) => setAttrValues(e.target.value)} placeholder={t("fAttrValues")} className="bg-card" aria-label={t("fAttrValues")} />
            <Button size="sm" className="h-9" onClick={addAttribute}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("fAddAttr")}
            </Button>
          </div>
          {value.attributes.map((a, i) => (
            <div key={i} className="flex items-center gap-2 border border-border px-3 py-2 text-sm">
              <span className="font-bold">{a.name}:</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.values}</span>
              <button type="button" onClick={() => onChange({ ...value, attributes: value.attributes.filter((_, x) => x !== i) })} aria-label={a.name} className="text-destructive hover:underline">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title={t("secVariations")}
          action={
            <Button size="sm" className="h-8 gap-1.5" onClick={generateVariations}>
              {t("genVariations")}
            </Button>
          }
        >
          {value.variations.length > 0 ? (
            <div className="flex flex-col gap-2">
              {value.variations.map((v) => (
                <div key={v.id} className="grid items-center gap-2 border border-border p-2 sm:grid-cols-[1fr_110px_90px_90px_auto]">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">{v.name}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{v.sku}</span>
                  </span>
                  <Input type="number" min={0} value={v.price} onChange={(e) => patchVariation(v.id, { price: Math.max(0, Number(e.target.value) || 0) })} className="h-8 bg-card" aria-label={`${t("vPrice")} ${v.name}`} />
                  <Input type="number" min={0} value={v.salePrice} onChange={(e) => patchVariation(v.id, { salePrice: Math.max(0, Number(e.target.value) || 0) })} className="h-8 bg-card" aria-label={`${t("vSale")} ${v.name}`} />
                  <Input type="number" min={0} value={v.stock} onChange={(e) => patchVariation(v.id, { stock: Math.max(0, Number(e.target.value) || 0) })} className="h-8 bg-card" aria-label={`${t("vStock")} ${v.name}`} />
                  <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => onChange({ ...value, variations: value.variations.filter((x) => x.id !== v.id) })} aria-label={v.name}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add attributes first, then generate variations.</p>
          )}
        </SectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <SectionCard title={t("secSeo")}>
          <Field label={t("fSeoTitle")}>
            <Input value={value.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("fMeta")}>
            <Input value={value.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} className="bg-card" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fSlug")}>
              <Input value={value.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))} className="bg-card font-mono text-xs" aria-invalid={!!errors.slug} />
              {err("slug")}
            </Field>
            <Field label={t("fKeywords")}>
              <Input value={value.keywords} onChange={(e) => set("keywords", e.target.value)} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secSettings")}>
          <Field label={t("fVisibility")}>
            <Select value={value.visibility} onValueChange={(v) => set("visibility", v ?? "Public")}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Public", "Hidden", "Password"].map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("fProdStatus")}>
            <Select value={value.status} onValueChange={(v) => set("status", (v as VendorProductStatus) ?? "draft")}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["active", "draft", "pending", "inactive", "archived"] as VendorProductStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("fLimit")}>
            <Input type="number" min={1} value={value.purchaseLimit} onChange={(e) => set("purchaseLimit", Math.max(1, Number(e.target.value) || 5))} className="bg-card" />
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2 text-sm font-medium">
              {t("fFeatured")}
              <input type="checkbox" checked={value.featured} onChange={(e) => set("featured", e.target.checked)} aria-label={t("fFeatured")} className="size-4 accent-[#ff8000]" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2 text-sm font-medium">
              {t("fAllowReviews")}
              <input type="checkbox" checked={value.allowReviews} onChange={(e) => set("allowReviews", e.target.checked)} aria-label={t("fAllowReviews")} className="size-4 accent-[#ff8000]" />
            </label>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function validateProduct(
  v: ProductFormValue,
  existingSlugs: string[],
  t: (key: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.name.trim()) errors.name = t("errRequired");
  if (v.price <= 0) errors.price = t("errPrice");
  if (!v.sku.trim()) errors.sku = t("errRequired");
  if (v.stock < 0) errors.stock = t("errStock");
  if (!v.slug.trim()) errors.slug = t("errRequired");
  else if (existingSlugs.includes(v.slug.trim())) errors.slug = t("errSlug");
  return errors;
}
