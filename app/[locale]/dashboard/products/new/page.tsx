"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  CategoriesSection,
  GallerySection,
  GeneralSection,
  InventorySection,
  PricingSection,
  SeoSection,
  VideosSection,
} from "@/components/admin/products/edit/sections";
import { ProductCard } from "@/components/shop/ProductCard";
import { autoSeo, useAdminProductsStore, type ProductSeo } from "@/store/admin-products.store";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function DashboardProductNewPage() {
  const t = useTranslations("Dashboard.admin");
  const router = useRouter();
  const addProduct = useAdminProductsStore((s) => s.addProduct);
  const setActiveState = useAdminProductsStore((s) => s.setActiveState);
  const setGallery = useAdminProductsStore((s) => s.setGallery);
  const setVideos = useAdminProductsStore((s) => s.setVideos);
  const subcategories = useAdminProductsStore((s) => s.subcategories);
  const addSubcategory = useAdminProductsStore((s) => s.addSubcategory);
  const setSeo = useAdminProductsStore((s) => s.setSeo);

  const [name, setName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [compare, setCompare] = useState<number | null>(null);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState("Women");
  const [subcategory, setSubcategory] = useState("");
  const [newSub, setNewSub] = useState("");
  const [brand, setBrand] = useState("Fashion Bangla");
  const [rating, setRating] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [stockStatus, setStockStatus] = useState<"auto" | "instock" | "outofstock" | "backorder">("auto");
  const [threshold, setThreshold] = useState(10);
  const [gallery, setGalleryLocal] = useState<string[]>([]);
  const [videos, setVideosLocal] = useState<string[]>([]);
  const [seo, setSeoLocal] = useState<ProductSeo | null>(null);

  const vSeo =
    seo ??
    autoSeo({
      name: name || "New Product",
      description: description || name || "New Product",
      category,
      brand,
    });

  const previewProduct: Product = {
    id: "preview",
    name: name || "New Product",
    slug: "new-product",
    description,
    shortDescription: shortDesc,
    price,
    compareAtPrice: compare,
    images: gallery,
    category,
    subcategory: subcategory || undefined,
    brand,
    stock,
    rating,
    isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const create = () => {
    const sub = newSub.trim() || subcategory;
    if (newSub.trim()) addSubcategory(newSub.trim());
    const slug = (name.trim() || "new-product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const id = `custom-${Date.now()}`;
    const now = new Date().toISOString();
    addProduct({
      id,
      name: name.trim() || "Untitled Product",
      slug: `${slug}-${id.slice(-4)}`,
      sku: `FS-CUS-${String(Date.now()).slice(-6)}`,
      description,
      shortDescription: shortDesc,
      price,
      compareAtPrice: compare,
      images: gallery,
      category,
      subcategory: sub || undefined,
      brand,
      stock,
      rating,
      isActive,
      stockStatus: stockStatus === "auto" ? undefined : stockStatus,
      lowStockThreshold: threshold,
      createdAt: now,
      updatedAt: now,
    });
    setActiveState([id], isActive);
    setGallery(id, gallery);
    setVideos(id, videos);
    setSeo(id, vSeo);
    toast.success(t("products.toastCreated"));
    router.push(`/dashboard/products/${id}/edit`);
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("products.npTitle")}
        description={t("products.npSubtitle")}
        actions={
          <Button size="sm" className="gap-1.5" onClick={create}>
            <Plus className="size-3.5" aria-hidden="true" />
            {t("products.npCreate")}
          </Button>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <GeneralSection
            idKey="new"
            name={name}
            onName={setName}
            rating={rating}
            onRating={setRating}
            shortDesc={shortDesc}
            onShortDesc={setShortDesc}
            description={description}
            onDescription={setDescription}
          />
          <PricingSection
            price={price}
            onPrice={setPrice}
            compare={compare}
            onCompare={setCompare}
          />
          <InventorySection
            stock={stock}
            onStock={setStock}
            status={stockStatus}
            onStatus={setStockStatus}
            threshold={threshold}
            onThreshold={setThreshold}
          />
          <CategoriesSection
            category={category}
            onCategory={setCategory}
            subcategory={subcategory}
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
          <GallerySection productName={name || "New Product"} images={gallery} onChange={setGalleryLocal} />
          <VideosSection videos={videos} onChange={setVideosLocal} />
          <SeoSection
            seo={vSeo}
            onChange={setSeoLocal}
            onAuto={() =>
              setSeoLocal(
                autoSeo({
                  name: name || "New Product",
                  description: description || name || "New Product",
                  category,
                  brand,
                })
              )
            }
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Card className="border-border bg-card pt-5 pb-5">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg font-bold">{t("products.epPublish")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">{t("products.epStatus")}:</span>
                <span className="font-bold text-secondary">
                  {isActive ? t("products.active") : t("products.inactive")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className="h-8 flex-1"
                  onClick={() => setIsActive(true)}
                >
                  {t("products.active")}
                </Button>
                <Button
                  size="sm"
                  variant={!isActive ? "default" : "outline"}
                  className="h-8 flex-1"
                  onClick={() => setIsActive(false)}
                >
                  {t("products.inactive")}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("products.epBrand")}
                </span>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-card" />
              </div>
              <Button className="mt-1 w-full gap-1.5" onClick={create}>
                <Plus className="size-4" aria-hidden="true" />
                {t("products.npCreate")}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card pt-5 pb-5">
            <CardHeader className="pb-3">
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
