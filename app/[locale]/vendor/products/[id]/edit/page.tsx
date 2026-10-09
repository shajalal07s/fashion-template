"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Eye } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { fromProduct, ProductForm, validateProduct, type ProductFormValue } from "@/components/vendor/ProductForm";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { toast } from "sonner";

export default function VendorProductEditPage() {
  const t = useTranslations("Dashboard.Vendor");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const products = useVendorProducts();
  const store = useVendorStore();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const [form, setForm] = useState<ProductFormValue | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const current = form ?? (product ? fromProduct(product) : null);

  if (!product || !current) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_products")}
          title={t("edit")}
          subtitle={id}
          highlightLabel={t("tStatus")}
          highlightValue="—"
          highlightIcon={ArrowLeft}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyProducts")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    const slugs = products.filter((p) => p.id !== product.id).map((p) => p.slug);
    const errs = validateProduct(current, slugs, (k) => t(k));
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(t("errRequired"));
      return;
    }
    store.patchProduct(product.id, {
      name: current.name.trim(),
      shortDesc: current.shortDesc,
      description: current.description,
      category: current.category,
      subCategory: current.subCategory,
      brand: current.brand,
      type: current.variations.length > 0 ? "Variable" : current.type,
      tags: current.tags.split(",").map((x) => x.trim()).filter(Boolean),
      image: current.image,
      gallery: current.gallery,
      price: current.price,
      salePrice: current.salePrice,
      saleStart: current.saleStart,
      saleEnd: current.saleEnd,
      costPrice: current.costPrice,
      sku: current.sku.trim(),
      stock: current.stock,
      lowThreshold: current.lowThreshold,
      manageStock: current.manageStock,
      backorder: current.backorder,
      weight: current.weight,
      length: current.length,
      width: current.width,
      height: current.height,
      shipClass: current.shipClass,
      attributes: current.attributes.map((a) => ({ name: a.name, values: a.values.split(",").map((x) => x.trim()).filter(Boolean) })),
      variations: current.variations,
      seoTitle: current.seoTitle,
      seoDesc: current.seoDesc,
      slug: current.slug.trim(),
      keywords: current.keywords,
      featured: current.featured,
      visibility: current.visibility,
      status: current.status,
      allowReviews: current.allowReviews,
      purchaseLimit: current.purchaseLimit,
      updated: "2026-09-26",
      activity: [{ event: "Product edited", date: "2026-09-26", detail: "Fields updated" }, ...product.activity],
    });
    setForm(null);
    toast.success(t("saveChanges"));
  };

  const update = (v: ProductFormValue) => {
    setForm(v);
    if (Object.keys(errors).length > 0) setErrors({});
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={product.name}
        subtitle={`${product.sku} · ${t("currentStatus")}: ${product.status}`}
        highlightLabel={t("mRevenue")}
        highlightValue={`৳${product.revenue.toLocaleString()}`}
        highlightIcon={Eye}
      >
        <Link href="/vendor/products" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("backToProducts")}
        </Link>
        <Link href={`/vendor/products/${product.id}`} className={heroPillClassName}>
          <Eye className="size-3.5" aria-hidden="true" />
          {t("view")}
        </Link>
        <button
          type="button"
          onClick={() => {
            const newId = store.duplicateProduct(product.id);
            if (newId) {
              toast.success(t("dupDone"));
              router.push(`/vendor/products/${newId}/edit`);
            }
          }}
          className={heroPillClassName}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {t("duplicateBtn")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {[
          [t("createdAt"), product.created],
          [t("updatedAt"), product.updated],
          [t("productId"), product.id],
          [t("currentStatus"), product.status],
          [t("mSales"), String(product.sold)],
          [t("mRevenue"), `৳${product.revenue.toLocaleString()}`],
          [t("mStock"), String(product.stock)],
        ].map(([l, v]) => (
          <Card key={l as string} className="border-border bg-card">
            <CardContent className="p-3">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{l as string}</p>
              <p className="truncate font-heading text-sm font-bold" title={String(v)}>{String(v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductForm value={current} onChange={update} errors={errors} categories={categories} />

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border border-border bg-card/95 p-3 backdrop-blur">
        <Button variant="outline" className="bg-card" onClick={() => router.push("/vendor/products")}>
          {t("cancelBtn")}
        </Button>
        <Button onClick={handleSave}>{t("saveChanges")}</Button>
      </div>
    </div>
  );
}
