"use client";

import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductInfo } from "@/components/shop/ProductInfo";
import { ProductPurchaseCard } from "@/components/shop/ProductPurchaseCard";
import { ProductTabs } from "@/components/shop/ProductTabs";
import { ProductPageClient } from "@/components/shop/ProductPageClient";
import { ROUTES } from "@/lib/constants";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import type { Product } from "@/types/product";

interface ProductDetailsViewProps {
  serverProduct?: Product;
  category: string;
  slug: string;
}

/**
 * Storefront product details that also reflect admin overrides and
 * admin-created products (both live in browser storage).
 * Shoppers without admin data see the exact static catalog.
 */
export function ProductDetailsView({ serverProduct, category, slug }: ProductDetailsViewProps) {
  const t = useTranslations("Shop");
  const custom = useAdminProductsStore((s) => s.custom);
  const fields = useAdminProductsStore((s) => s.fields);
  const activeMap = useAdminProductsStore((s) => s.active);
  const galleryMap = useAdminProductsStore((s) => s.gallery);
  const hydrated = useSyncExternalStore(
    (onStoreChange) => useAdminProductsStore.persist.onFinishHydration(onStoreChange),
    () => useAdminProductsStore.persist.hasHydrated(),
    () => false
  );

  const base: Product | undefined =
    custom.find((p) => p.slug === slug) ??
    serverProduct ??
    products.find((p) => p.slug === slug && p.category?.toLowerCase() === category);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-secondary" aria-hidden="true" />
      </div>
    );
  }

  if (!base) notFound();

  const product: Product = {
    ...base,
    ...(fields[base.id] ?? {}),
    isActive: activeMap[base.id] ?? base.isActive,
    images: galleryMap[base.id] ?? base.images,
  };

  const qrValue = `/products/${category}/${product.slug}`;

  return (
    <>
      <div className="bg-primary/15 border-y border-primary/20">
        <Container className="flex flex-col gap-1 py-5">
          <Breadcrumb
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t("title"), href: ROUTES.shop },
              { label: t(`categories.${category}`) },
              { label: product.name },
            ]}
          />
        </Container>
      </div>

      <ProductPageClient productId={product.id} />

      <Container className="flex flex-col gap-10 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr_360px] lg:items-start">
          <ProductGallery product={product} />
          <ProductInfo product={product} qrValue={qrValue} />
          <ProductPurchaseCard product={product} />
        </div>

        <div className="border-border border-t pt-10">
          <ProductTabs product={product} />
        </div>
      </Container>
    </>
  );
}

// Kept for backwards compatibility with existing imports.
export const CustomProductDetails = ProductDetailsView;
