"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Eye, Save } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AttributesSection,
  CategoriesSection,
  Field,
  GallerySection,
  GeneralSection,
  InventorySection,
  PricingSection,
  SeoSection,
  VariationsSection,
  VideosSection,
  type StockStatusKey,
} from "@/components/admin/products/edit/sections";
import { ProductCard } from "@/components/shop/ProductCard";
import { products } from "@/features/shop/products";
import {
  autoSeo,
  buildVariations,
  useAdminProductsStore,
  type ProductAttribute,
  type ProductSeo,
  type ProductVariation,
} from "@/store/admin-products.store";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function DashboardProductEditPage() {
  const t = useTranslations("Dashboard.admin");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const custom = useAdminProductsStore((s) => s.custom);
  const base = useMemo(
    () => products.find((p) => p.id === id) ?? custom.find((p) => p.id === id),
    [custom, id]
  );
  const fields = useAdminProductsStore((s) => s.fields);
  const activeMap = useAdminProductsStore((s) => s.active);
  const galleryMap = useAdminProductsStore((s) => s.gallery);
  const videoMap = useAdminProductsStore((s) => s.videos);
  const subcategories = useAdminProductsStore((s) => s.subcategories);
  const seoMap = useAdminProductsStore((s) => s.seo);
  const upsertFields = useAdminProductsStore((s) => s.upsertFields);
  const setActiveState = useAdminProductsStore((s) => s.setActiveState);
  const setGallery = useAdminProductsStore((s) => s.setGallery);
  const setVideos = useAdminProductsStore((s) => s.setVideos);
  const addSubcategory = useAdminProductsStore((s) => s.addSubcategory);
  const setSeo = useAdminProductsStore((s) => s.setSeo);
  const attrMap = useAdminProductsStore((s) => s.attributes);
  const varMap = useAdminProductsStore((s) => s.variations);
  const setAttributes = useAdminProductsStore((s) => s.setAttributes);
  const setVariations = useAdminProductsStore((s) => s.setVariations);
  const addProduct = useAdminProductsStore((s) => s.addProduct);

  const merged: Product | undefined = useMemo(() => {
    if (!base) return undefined;
    return {
      ...base,
      ...(fields[id] ?? {}),
      isActive: activeMap[id] ?? base.isActive,
      images: galleryMap[id] ?? base.images,
    };
  }, [base, fields, activeMap, galleryMap, id]);

  const [name, setName] = useState<string | null>(null);
  const [shortDesc, setShortDesc] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [compare, setCompare] = useState<number | null | undefined>(undefined);
  const [stock, setStock] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [newSub, setNewSub] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [gallery, setGalleryLocal] = useState<string[] | null>(null);
  const [videos, setVideosLocal] = useState<string[] | null>(null);
  const [seo, setSeoLocal] = useState<ProductSeo | null>(null);
  const [stockStatus, setStockStatus] = useState<StockStatusKey | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [attributes, setAttributesLocal] = useState<ProductAttribute[] | null>(null);
  const [variations, setVariationsLocal] = useState<ProductVariation[] | null>(null);

  if (!merged) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("products.editTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("products.epNotFound")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const vName = name ?? merged.name;
  const vShort = shortDesc ?? merged.shortDescription ?? "";
  const vDesc = description ?? merged.description;
  const vPrice = price ?? merged.price;
  const vCompare = compare === undefined ? (merged.compareAtPrice ?? null) : compare;
  const vStock = stock ?? merged.stock;
  const vCategory = category ?? merged.category ?? "Women";
  const vSub = subcategory ?? merged.subcategory ?? "";
  const vBrand = brand ?? merged.brand ?? "";
  const vRating = rating ?? merged.rating ?? 0;
  const vActive = isActive ?? merged.isActive;
  const vGallery = gallery ?? merged.images;
  const vVideos = videos ?? videoMap[id] ?? [];
  const vSeo = seo ?? seoMap[id] ?? autoSeo({ ...merged, name: vName, description: vDesc });
  const vStatus: StockStatusKey = stockStatus ?? merged.stockStatus ?? "auto";
  const vThreshold = threshold ?? merged.lowStockThreshold ?? 10;
  const vAttributes: ProductAttribute[] =
    attributes ??
    attrMap[id] ?? [
      ...(merged.colors?.length
        ? [{ name: "Color", values: [...merged.colors], forVariations: true }]
        : []),
      ...(merged.sizes?.length
        ? [{ name: "Size", values: [...merged.sizes], forVariations: true }]
        : []),
    ];
  const vVariations: ProductVariation[] = variations ?? varMap[id] ?? [];

  const previewProduct: Product = {
    ...merged,
    name: vName,
    price: vPrice,
    compareAtPrice: vCompare,
    stock: vStock,
    category: vCategory,
    rating: vRating,
    isActive: vActive,
    images: vGallery.length > 0 ? vGallery : merged.images,
  };

  const commitSub = () => {
    if (newSub.trim()) {
      addSubcategory(newSub.trim());
      setSubcategory(newSub.trim());
      setNewSub("");
      return newSub.trim();
    }
    return vSub;
  };

  const save = (notify = true) => {
    const sub = commitSub();
    const colorAttr = vAttributes.find((a) => a.name.toLowerCase() === "color");
    const sizeAttr = vAttributes.find((a) => a.name.toLowerCase() === "size");
    upsertFields(id, {
      name: vName.trim() || merged.name,
      shortDescription: vShort,
      description: vDesc,
      price: vPrice,
      compareAtPrice: vCompare,
      stock: vStock,
      stockStatus: vStatus === "auto" ? undefined : vStatus,
      lowStockThreshold: vThreshold,
      category: vCategory,
      subcategory: (sub || undefined) as string | undefined,
      brand: vBrand || undefined,
      rating: vRating,
      ...(colorAttr ? { colors: [...colorAttr.values] } : {}),
      ...(sizeAttr ? { sizes: [...sizeAttr.values] } : {}),
    });
    setActiveState([id], vActive);
    setGallery(id, vGallery);
    setVideos(id, vVideos);
    setSeo(id, vSeo);
    setAttributes(id, vAttributes);
    setVariations(id, vVariations);
    if (notify) toast.success(t("products.epSaved"));
  };

  const preview = () => {
    save(false);
    const path = `/products/${vCategory.toLowerCase()}/${merged.slug}`;
    window.open(locale === "en" ? path : `/${locale}${path}`, "_blank", "noopener");
  };

  const duplicate = () => {
    const copyName = `${vName.trim() || merged.name} ${t("products.duplicateSuffix")}`;
    const slug = copyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const newId = `custom-${Date.now()}`;
    const now = new Date().toISOString();
    const newSku = `FS-CUS-${String(Date.now()).slice(-6)}`;
    const attrsCopy: ProductAttribute[] = JSON.parse(JSON.stringify(vAttributes));
    addProduct({
      ...merged,
      id: newId,
      name: copyName,
      slug: `${slug}-${newId.slice(-4)}`,
      sku: newSku,
      shortDescription: vShort,
      description: vDesc,
      price: vPrice,
      compareAtPrice: vCompare,
      stock: vStock,
      category: vCategory,
      subcategory: vSub || undefined,
      brand: vBrand || undefined,
      rating: vRating,
      isActive: false,
      images: [...vGallery],
      createdAt: now,
      updatedAt: now,
    });
    setActiveState([newId], false);
    setGallery(newId, [...vGallery]);
    setVideos(newId, [...vVideos]);
    setSeo(
      newId,
      autoSeo({ name: copyName, description: vDesc, category: vCategory, brand: vBrand })
    );
    setAttributes(newId, attrsCopy);
    setVariations(
      newId,
      buildVariations(newId, newSku, vPrice, attrsCopy, vVariations)
    );
    toast.success(t("products.toastDuplicated"));
    router.push(`/dashboard/products/${newId}/edit`);
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("products.editTitle")} · ${merged.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("products.epBack")}
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1.5 bg-card" onClick={preview}>
              <Eye className="size-3.5" aria-hidden="true" />
              {t("products.previewBtn")}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 bg-card" onClick={duplicate}>
              <Copy className="size-3.5" aria-hidden="true" />
              {t("products.duplicateBtn")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => save()}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("products.epSave")}
            </Button>
          </div>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <GeneralSection
            idKey={id}
            name={vName}
            onName={setName}
            sku={merged.sku}
            rating={vRating}
            onRating={setRating}
            shortDesc={vShort}
            onShortDesc={setShortDesc}
            description={vDesc}
            onDescription={setDescription}
          />
          <PricingSection
            price={vPrice}
            onPrice={setPrice}
            compare={vCompare}
            onCompare={setCompare}
          />
          <InventorySection
            stock={vStock}
            onStock={setStock}
            status={vStatus}
            onStatus={setStockStatus}
            threshold={vThreshold}
            onThreshold={setThreshold}
          />
          <AttributesSection attributes={vAttributes} onChange={setAttributesLocal} />
          <VariationsSection
            variations={vVariations}
            gallery={vGallery}
            onChange={setVariationsLocal}
            onGenerate={() =>
              setVariationsLocal(buildVariations(id, merged.sku ?? "", vPrice, vAttributes, vVariations))
            }
          />
          <CategoriesSection
            category={vCategory}
            onCategory={setCategory}
            subcategory={vSub}
            onSubcategory={setSubcategory}
            subcategories={subcategories}
            newSub={newSub}
            onNewSub={setNewSub}
            onAddSub={() => {
              if (!newSub.trim()) return;
              addSubcategory(newSub.trim());
              setSubcategory(newSub.trim());
              setNewSub("");
            }}
          />
          <GallerySection productName={vName} images={vGallery} onChange={setGalleryLocal} />
          <VideosSection videos={vVideos} onChange={setVideosLocal} />
          <SeoSection
            seo={vSeo}
            onChange={setSeoLocal}
            onAuto={() =>
              setSeoLocal(autoSeo({ name: vName, description: vDesc, category: vCategory, brand: vBrand }))
            }
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Card className="border-border bg-card pt-5 pb-5">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg font-bold">{t("products.epPublish")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label={t("products.epStatus")}>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={vActive ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => setIsActive(true)}
                  >
                    {t("products.active")}
                  </Button>
                  <Button
                    size="sm"
                    variant={!vActive ? "default" : "outline"}
                    className="h-8 flex-1"
                    onClick={() => setIsActive(false)}
                  >
                    {t("products.inactive")}
                  </Button>
                </div>
              </Field>
              <Field label={t("products.epBrand")}>
                <Input value={vBrand} onChange={(e) => setBrand(e.target.value)} className="bg-card" />
              </Field>
              <Button className="mt-1 w-full gap-1.5" onClick={() => save()}>
                <Save className="size-4" aria-hidden="true" />
                {t("products.epSave")}
              </Button>
              {vSub ? (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{vCategory}</Badge>
                  <Badge className="bg-secondary/15 font-semibold text-secondary">{vSub}</Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border bg-card pt-5 pb-5">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Eye className="size-4 text-secondary" aria-hidden="true" />
              <CardTitle className="font-heading text-lg font-bold">{t("products.epPreview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductCard product={previewProduct} variant="classic" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
