"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface ProductSeo {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export function autoSeo(product: Pick<Product, "name" | "description" | "category" | "brand">): ProductSeo {
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const short = product.description.length > 155
    ? `${product.description.slice(0, 152)}...`
    : product.description;
  const keywords = [...new Set(
    `${product.name} ${product.category ?? ""} ${product.brand ?? ""} online shopping fashion bangladesh`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2)
  )].join(", ");
  return {
    slug,
    metaTitle: `${product.name} – Buy Online | Fashion Store`,
    metaDescription: short,
    keywords,
  };
}

interface AdminProductState {
  fields: Record<string, Partial<Product>>;
  active: Record<string, boolean>;
  deleted: string[];
  purged: string[];
  gallery: Record<string, string[]>;
  videos: Record<string, string[]>;
  subcategories: string[];
  seo: Record<string, ProductSeo>;
  custom: Product[];
  upsertFields: (id: string, patch: Partial<Product>) => void;
  setActiveState: (ids: string[], active: boolean) => void;
  softDelete: (ids: string[]) => void;
  restore: (ids: string[]) => void;
  purge: (ids: string[]) => void;
  setGallery: (id: string, images: string[]) => void;
  setVideos: (id: string, videos: string[]) => void;
  addSubcategory: (name: string) => void;
  setSeo: (id: string, seo: ProductSeo) => void;
  addProduct: (product: Product) => void;
}

export const useAdminProductsStore = create<AdminProductState>()(
  persist(
    (set) => ({
      fields: {},
      active: {},
      deleted: [],
      purged: [],
      gallery: {},
      videos: {},
      subcategories: ["Kurti", "Sharee", "Panjabi", "T-Shirt", "Hijab"],
      seo: {},
      custom: [],
      upsertFields: (id, patch) =>
        set((s) => ({ fields: { ...s.fields, [id]: { ...s.fields[id], ...patch } } })),
      setActiveState: (ids, active) =>
        set((s) => {
          const next = { ...s.active };
          for (const id of ids) next[id] = active;
          return { active: next };
        }),
      softDelete: (ids) =>
        set((s) => ({ deleted: [...new Set([...s.deleted, ...ids])] })),
      restore: (ids) =>
        set((s) => ({ deleted: s.deleted.filter((id) => !ids.includes(id)) })),
      purge: (ids) =>
        set((s) => ({
          purged: [...new Set([...s.purged, ...ids])],
          deleted: s.deleted.filter((id) => !ids.includes(id)),
        })),
      setGallery: (id, images) => set((s) => ({ gallery: { ...s.gallery, [id]: images } })),
      setVideos: (id, videos) => set((s) => ({ videos: { ...s.videos, [id]: videos } })),
      addSubcategory: (name) =>
        set((s) =>
          s.subcategories.includes(name) ? s : { subcategories: [...s.subcategories, name] }
        ),
      setSeo: (id, seo) => set((s) => ({ seo: { ...s.seo, [id]: seo } })),
      addProduct: (product) => set((s) => ({ custom: [product, ...s.custom] })),
    }),
    { name: "admin-products" }
  )
);
