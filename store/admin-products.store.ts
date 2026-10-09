"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { useAuthStore } from "@/store/auth.store";

function currentAdminName(): string {
  try {
    return useAuthStore.getState().user?.name ?? "Admin";
  } catch {
    return "Admin";
  }
}

export interface ProductSeo {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface ProductAttribute {
  name: string;
  values: string[];
  forVariations: boolean;
}

export interface SizeMeta {
  slug: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface ProductVariation {
  id: string;
  options: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  enabled: boolean;
  image?: string;
}

export function buildVariations(
  productId: string,
  baseSku: string,
  basePrice: number,
  attributes: ProductAttribute[],
  previous: ProductVariation[] = []
): ProductVariation[] {
  const usable = attributes.filter((a) => a.forVariations && a.values.length > 0);
  if (usable.length === 0) return [];
  const prev = new Map(previous.map((v) => [v.id, v]));
  const combos: Array<Record<string, string>> = [{}];
  for (const attr of usable) {
    const next: Array<Record<string, string>> = [];
    for (const combo of combos) {
      for (const value of attr.values) {
        next.push({ ...combo, [attr.name]: value });
      }
    }
    combos.splice(0, combos.length, ...next);
  }
  return combos.map((options, i) => {
    const id = Object.entries(options)
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    const old = prev.get(id);
    return {
      id,
      options,
      sku: old?.sku ?? `${baseSku || productId.toUpperCase()}-V${i + 1}`,
      price: old?.price ?? basePrice,
      stock: old?.stock ?? 0,
      enabled: old?.enabled ?? true,
      image: old?.image,
    };
  });
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
  customSizes: string[];
  sizeRenames: Record<string, string>;
  sizeMeta: Record<string, SizeMeta>;
  customColors: string[];
  colorMeta: Record<string, SizeMeta>;
  attributes: Record<string, ProductAttribute[]>;
  variations: Record<string, ProductVariation[]>;
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
  addCustomSize: (size: string) => void;
  upsertSizeMeta: (name: string, patch: Partial<SizeMeta>) => void;
  renameCustomSize: (oldName: string, newName: string) => void;
  removeCustomSize: (name: string) => void;
  renameSize: (oldName: string, newName: string) => void;
  addCustomColor: (color: string) => void;
  renameColor: (oldHex: string, newHex: string) => void;
  removeCustomColor: (hex: string) => void;
  setAttributes: (id: string, attributes: ProductAttribute[]) => void;
  setVariations: (id: string, variations: ProductVariation[]) => void;
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
      customSizes: [],
      customColors: [],
      sizeRenames: {},
      sizeMeta: {},
      colorMeta: {},
      attributes: {},
      variations: {},
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
      addCustomSize: (size) =>
        set((s) => {
          if (s.customSizes.includes(size)) return s;
          const now = new Date().toISOString();
          return {
            customSizes: [...s.customSizes, size],
            sizeMeta: {
              ...s.sizeMeta,
              [size]: {
                slug: slugifyName(size),
                author: currentAdminName(),
                createdAt: now,
                updatedAt: now,
              },
            },
          };
        }),
      upsertSizeMeta: (name, patch) =>
        set((s) => ({
          sizeMeta: { ...s.sizeMeta, [name]: { ...(s.sizeMeta[name] ?? { slug: slugifyName(name), author: currentAdminName(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }), ...patch } },
        })),
      renameCustomSize: (oldName, newName) =>
        set((s) => ({
          customSizes: s.customSizes.map((x) => (x === oldName ? newName : x)),
        })),
      removeCustomSize: (name) =>
        set((s) => {
          const meta = { ...s.sizeMeta };
          delete meta[name];
          return { customSizes: s.customSizes.filter((x) => x !== name), sizeMeta: meta };
        }),
      renameSize: (oldName, newName) =>
        set((s) => {
          const prev = s.sizeMeta[oldName] ?? s.sizeMeta[newName];
          const now = new Date().toISOString();
          return {
            customSizes: s.customSizes.map((x) => (x === oldName ? newName : x)),
            sizeRenames: { ...s.sizeRenames, [oldName]: newName },
            sizeMeta: {
              ...s.sizeMeta,
              [newName]: {
                slug: slugifyName(newName),
                author: prev?.author ?? currentAdminName(),
                createdAt: prev?.createdAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),
      addCustomColor: (color) =>
        set((s) => {
          if (s.customColors.includes(color)) return s;
          const now = new Date().toISOString();
          return {
            customColors: [...s.customColors, color],
            colorMeta: {
              ...s.colorMeta,
              [color]: { slug: color.replace("#", ""), author: currentAdminName(), createdAt: now, updatedAt: now },
            },
          };
        }),
      renameColor: (oldHex, newHex) =>
        set((s) => {
          const prev = s.colorMeta[oldHex];
          const now = new Date().toISOString();
          return {
            customColors: s.customColors.map((x) => (x === oldHex ? newHex : x)),
            colorMeta: {
              ...s.colorMeta,
              [newHex]: {
                slug: newHex.replace("#", ""),
                author: prev?.author ?? currentAdminName(),
                createdAt: prev?.createdAt ?? now,
                updatedAt: now,
              },
            },
          };
        }),
      removeCustomColor: (hex) =>
        set((s) => {
          const meta = { ...s.colorMeta };
          delete meta[hex];
          return { customColors: s.customColors.filter((x) => x !== hex), colorMeta: meta };
        }),
      setAttributes: (id, attributes) =>
        set((s) => ({ attributes: { ...s.attributes, [id]: attributes } })),
      setVariations: (id, variations) =>
        set((s) => ({ variations: { ...s.variations, [id]: variations } })),
    }),
    { name: "admin-products" }
  )
);
