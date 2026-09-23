"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  CategoriesSection,
  Field,
  GallerySection,
  GeneralSection,
  PricingSection,
  SeoSection,
  VideosSection,
} from "@/components/admin/products/edit/sections";
import { ProductCard } from "@/components/shop/ProductCard";
import { products } from "@/features/shop/products";
import { autoSeo, useAdminProductsStore, type ProductSeo } from "@/store/admin-products.store";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function DashboardProductEditPage() {
  const t = useTranslations("Dashboard.admin");
  const params = useParams<{ id: string }>();
  const id = params.id;

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

  const save = () => {
    const sub = commitSub();
    upsertFields(id, {
      name: vName.trim() || merged.name,
      shortDescription: vShort,
      description: vDesc,
      price: vPrice,
      compareAtPrice: vCompare,
      stock: vStock,
      category: vCategory,
      subcategory: (sub || undefined) as string | undefined,
      brand: vBrand || undefined,
      rating: vRating,
    });
    setActiveState([id], vActive);
    setGallery(id, vGallery);
    setVideos(id, vVideos);
    setSeo(id, vSeo);
    toast.success(t("products.epSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("products.editTitle")} · ${merged.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("products.epBack")}
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5" onClick={save}>
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
            stock={vStock}
            onStock={setStock}
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
                <Select value={vActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("products.active")}</SelectItem>
                    <SelectItem value="inactive">{t("products.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("products.epStock")}>
                <Input
                  type="number"
                  min={0}
                  value={vStock}
                  onChange={(e) => setStock(Number(e.target.value) || 0)}
                  className="bg-card"
                />
              </Field>
              <Field label={t("products.epBrand")}>
                <Input value={vBrand} onChange={(e) => setBrand(e.target.value)} className="bg-card" />
              </Field>
              <Button className="mt-1 w-full gap-1.5" onClick={save}>
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
