"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoProductReviews,
  demoReviewReports,
  demoVendorReviews,
  type ProductReview,
  type ReportStatus,
  type ReviewReport,
  type ReviewStatus,
  type VendorReview,
} from "@/features/admin/reviews";

interface ReviewsState {
  products: ProductReview[];
  vendors: VendorReview[];
  reports: ReviewReport[];
  patchProduct: (id: string, patch: Partial<ProductReview>) => void;
  removeProducts: (ids: string[]) => void;
  patchVendor: (id: string, patch: Partial<VendorReview>) => void;
  removeVendors: (ids: string[]) => void;
  patchReport: (id: string, patch: Partial<ReviewReport>) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set) => ({
      products: demoProductReviews,
      vendors: demoVendorReviews,
      reports: demoReviewReports,
      patchProduct: (id, patch) => set((s) => ({ products: mapPatch(s.products, id, patch) })),
      removeProducts: (ids) => set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),
      patchVendor: (id, patch) => set((s) => ({ vendors: mapPatch(s.vendors, id, patch) })),
      removeVendors: (ids) => set((s) => ({ vendors: s.vendors.filter((v) => !ids.includes(v.id)) })),
      patchReport: (id, patch) => set((s) => ({ reports: mapPatch(s.reports, id, patch) })),
      reset: () => set({ products: demoProductReviews, vendors: demoVendorReviews, reports: demoReviewReports }),
    }),
    { name: "reviews-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useProductReviews(): ProductReview[] {
  const products = useReviewsStore((s) => s.products);
  return useMemo(() => products, [products]);
}
export function useVendorReviews(): VendorReview[] {
  const vendors = useReviewsStore((s) => s.vendors);
  return useMemo(() => vendors, [vendors]);
}
export function useReviewReports(): ReviewReport[] {
  const reports = useReviewsStore((s) => s.reports);
  return useMemo(() => reports, [reports]);
}

export type { ReviewStatus, ReportStatus };
