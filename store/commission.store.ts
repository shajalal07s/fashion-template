"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultCommissionSettings,
  demoAdjustments,
  demoCategories,
  demoProducts,
  demoReversals,
  demoRules,
  demoTransactions,
  demoVendors,
  type Adjustment,
  type CategoryCommission,
  type CommissionRule,
  type CommissionSettings,
  type CommissionTx,
  type ProductCommission,
  type Reversal,
  type VendorCommission,
} from "@/features/admin/commission";

interface CommissionState {
  vendors: VendorCommission[];
  categories: CategoryCommission[];
  products: ProductCommission[];
  rules: CommissionRule[];
  transactions: CommissionTx[];
  adjustments: Adjustment[];
  reversals: Reversal[];
  settings: CommissionSettings;
  patchVendor: (id: string, patch: Partial<VendorCommission>) => void;
  patchCategory: (id: string, patch: Partial<CategoryCommission>) => void;
  addCategory: (c: CategoryCommission) => void;
  removeCategories: (ids: string[]) => void;
  patchProduct: (id: string, patch: Partial<ProductCommission>) => void;
  addRule: (r: CommissionRule) => void;
  patchRule: (id: string, patch: Partial<CommissionRule>) => void;
  removeRules: (ids: string[]) => void;
  patchTx: (id: string, patch: Partial<CommissionTx>) => void;
  addAdjustment: (a: Adjustment) => void;
  patchAdjustment: (id: string, patch: Partial<Adjustment>) => void;
  patchReversal: (id: string, patch: Partial<Reversal>) => void;
  patchSettings: (patch: Partial<CommissionSettings>) => void;
  reset: () => void;
}

export const useCommissionStore = create<CommissionState>()(
  persist(
    (set) => ({
      vendors: demoVendors,
      categories: demoCategories,
      products: demoProducts,
      rules: demoRules,
      transactions: demoTransactions,
      adjustments: demoAdjustments,
      reversals: demoReversals,
      settings: defaultCommissionSettings,
      patchVendor: (id, patch) =>
        set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      patchCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      addCategory: (c) => set((s) => ({ categories: [c, ...s.categories] })),
      removeCategories: (ids) =>
        set((s) => ({ categories: s.categories.filter((c) => !ids.includes(c.id)) })),
      patchProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      addRule: (r) => set((s) => ({ rules: [r, ...s.rules] })),
      patchRule: (id, patch) =>
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRules: (ids) => set((s) => ({ rules: s.rules.filter((r) => !ids.includes(r.id)) })),
      patchTx: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      addAdjustment: (a) => set((s) => ({ adjustments: [a, ...s.adjustments] })),
      patchAdjustment: (id, patch) =>
        set((s) => ({ adjustments: s.adjustments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      patchReversal: (id, patch) =>
        set((s) => ({ reversals: s.reversals.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      patchSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () =>
        set({
          vendors: demoVendors,
          categories: demoCategories,
          products: demoProducts,
          rules: demoRules,
          transactions: demoTransactions,
          adjustments: demoAdjustments,
          reversals: demoReversals,
          settings: defaultCommissionSettings,
        }),
    }),
    { name: "commission-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useCommissionVendors(): VendorCommission[] {
  const vendors = useCommissionStore((s) => s.vendors);
  return useMemo(() => vendors, [vendors]);
}
export function useCommissionCategories(): CategoryCommission[] {
  const categories = useCommissionStore((s) => s.categories);
  return useMemo(() => categories, [categories]);
}
export function useCommissionProducts(): ProductCommission[] {
  const products = useCommissionStore((s) => s.products);
  return useMemo(() => products, [products]);
}
export function useCommissionRules(): CommissionRule[] {
  const rules = useCommissionStore((s) => s.rules);
  return useMemo(() => rules, [rules]);
}
export function useCommissionTxs(): CommissionTx[] {
  const transactions = useCommissionStore((s) => s.transactions);
  return useMemo(() => transactions, [transactions]);
}
export function useCommissionAdjustments(): Adjustment[] {
  const adjustments = useCommissionStore((s) => s.adjustments);
  return useMemo(() => adjustments, [adjustments]);
}
export function useCommissionReversals(): Reversal[] {
  const reversals = useCommissionStore((s) => s.reversals);
  return useMemo(() => reversals, [reversals]);
}
