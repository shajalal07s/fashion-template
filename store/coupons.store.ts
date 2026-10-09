"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Coupon {
  code: string;
  discount: string;
  used: number;
  limit: number;
  status: "active" | "scheduled";
  expiry: string;
}

const DEFAULT_COUPONS: Coupon[] = [
  { code: "WELCOME10", discount: "10% OFF", used: 342, limit: 500, status: "active", expiry: "31 Dec 2026" },
  { code: "EID20", discount: "20% OFF", used: 518, limit: 1000, status: "active", expiry: "30 Jun 2027" },
  { code: "PUJA15", discount: "15% OFF", used: 129, limit: 400, status: "active", expiry: "15 Oct 2026" },
  { code: "FLAT200", discount: "৳200 OFF", used: 0, limit: 300, status: "scheduled", expiry: "01 Nov 2026" },
  { code: "FREESHIP", discount: "Free Delivery", used: 764, limit: 2000, status: "active", expiry: "31 Dec 2026" },
];

interface CouponsState {
  custom: Coupon[];
  patches: Record<string, Partial<Coupon>>;
  removed: string[];
  patch: (code: string, patch: Partial<Coupon>) => void;
  remove: (codes: string[]) => void;
  append: (coupon: Coupon) => void;
}

export const useCouponsStore = create<CouponsState>()(
  persist(
    (set) => ({
      custom: [],
      patches: {},
      removed: [],
      patch: (code, patch) =>
        set((s) => ({ patches: { ...s.patches, [code]: { ...s.patches[code], ...patch } } })),
      remove: (codes) => set((s) => ({ removed: [...new Set([...s.removed, ...codes])] })),
      append: (coupon) => set((s) => ({ custom: [coupon, ...s.custom] })),
    }),
    { name: "coupons" }
  )
);

export function useCoupons(): Coupon[] {
  const custom = useCouponsStore((s) => s.custom);
  const patches = useCouponsStore((s) => s.patches);
  const removed = useCouponsStore((s) => s.removed);
  const seen = new Set<string>();
  return [...custom, ...DEFAULT_COUPONS]
    .map((c) => ({ ...c, ...(patches[c.code] ?? {}) }))
    .filter((c) => {
      if (removed.includes(c.code) || seen.has(c.code)) return false;
      seen.add(c.code);
      return true;
    });
}
