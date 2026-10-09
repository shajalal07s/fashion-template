"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { blankForm, ProductForm, validateProduct, type ProductFormValue } from "@/components/vendor/ProductForm";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { toast } from "sonner";
import type { VendorProductStatus } from "@/features/vendor/vendor";

export default function VendorProductCreatePage() {
  const t = useTranslations("Dashboard.Vendor");
  const router = useRouter();
  const products = useVendorProducts();
  const store = useVendorStore();

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const [form, setForm] = useState<ProductFormValue>(() => blankForm(categories));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const collect = (status: VendorProductStatus, silent = false) => {
    const slugs = products.map((p) => p.slug);
    const errs = validateProduct(form, slugs, (k) => t(k));
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (!silent) toast.error(t("errRequired"));
      return;
    }
    store.addProduct({
      id: `vp-new-${products.length + 1}`,
      name: form.name.trim(),
      sku: form.sku.trim() || `SKU-${100 + products.length}`,
      image: form.image || "/images/women/women-1.jpg",
      gallery: form.gallery,
      category: form.category,
      subCategory: form.subCategory,
      brand: form.brand || "Ayesha Boutique",
      type: form.variations.length > 0 ? "Variable" : form.type,
      tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
      shortDesc: form.shortDesc,
      description: form.description,
      price: form.price,
      salePrice: form.salePrice,
      costPrice: form.costPrice,
      saleStart: form.saleStart,
      saleEnd: form.saleEnd,
      stock: form.stock,
      lowThreshold: form.lowThreshold,
      manageStock: form.manageStock,
      backorder: form.backorder,
      weight: form.weight,
      length: form.length,
      width: form.width,
      height: form.height,
      shipClass: form.shipClass,
      attributes: form.attributes.map((a) => ({ name: a.name, values: a.values.split(",").map((x) => x.trim()).filter(Boolean) })),
      variations: form.variations,
      seoTitle: form.seoTitle || `${form.name.trim()} | Ayesha Boutique`,
      seoDesc: form.seoDesc,
      slug: form.slug.trim(),
      keywords: form.keywords,
      featured: form.featured,
      visibility: form.visibility,
      allowReviews: form.allowReviews,
      purchaseLimit: form.purchaseLimit,
      sold: 0,
      views: 0,
      carts: 0,
      rating: 5,
      reviews: 0,
      revenue: 0,
      status,
      created: "2026-09-26",
      updated: "2026-09-26",
      activity: [{ event: "Product created", date: "2026-09-26", detail: `Status: ${status}` }],
      stockHistory: [{ date: "2026-09-26", change: form.stock, balance: form.stock, note: "Initial stock" }],
    });
    toast.success(t("toastSaved"));
    router.push("/vendor/products");
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={t("addProduct")}
        subtitle={t("mpSubtitle")}
        highlightLabel={t("tStatus")}
        highlightValue="draft"
        highlightIcon={ArrowLeft}
      >
        <Link href="/vendor/products" className="inline-flex items-center gap-1.5 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("backToProducts")}
        </Link>
      </AccountingHero>

      <ProductForm value={form} onChange={setForm} errors={errors} categories={categories} />

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border border-border bg-card/95 p-3 backdrop-blur">
        <Button variant="outline" className="bg-card" onClick={() => router.push("/vendor/products")}>
          {t("cancelBtn")}
        </Button>
        <Button variant="outline" className="bg-card" onClick={() => collect("draft")}>
          {t("saveDraft")}
        </Button>
        <Button variant="outline" className="bg-card" onClick={() => collect("pending")}>
          {t("submitReview")}
        </Button>
        <Button onClick={() => collect("active")}>{t("publishBtn")}</Button>
      </div>
    </div>
  );
}
