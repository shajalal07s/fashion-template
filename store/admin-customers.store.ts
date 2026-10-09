"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminCustomer } from "@/features/admin/analytics";

export interface CustomerRecord extends AdminCustomer {
  address: string;
}

interface CustomerPatch {
  name?: string;
  phone?: string;
  city?: string;
}

interface AdminCustomerState {
  overrides: Record<string, CustomerPatch>;
  deleted: string[];
  manual: CustomerRecord[];
  setOverride: (email: string, patch: CustomerPatch) => void;
  removeCustomer: (emails: string[]) => void;
  restoreCustomer: (emails: string[]) => void;
  addManual: (rows: CustomerRecord[]) => void;
}

export const useAdminCustomersStore = create<AdminCustomerState>()(
  persist(
    (set) => ({
      overrides: {},
      deleted: [],
      manual: [],
      setOverride: (email, patch) =>
        set((s) => ({
          overrides: { ...s.overrides, [email.toLowerCase()]: { ...s.overrides[email.toLowerCase()], ...patch } },
        })),
      removeCustomer: (emails) =>
        set((s) => {
          const keys = emails.map((e) => e.toLowerCase());
          return {
            manual: s.manual.filter((m) => !keys.includes(m.email.toLowerCase())),
            deleted: [...new Set([...s.deleted, ...keys])],
          };
        }),
      restoreCustomer: (emails) =>
        set((s) => {
          const keys = emails.map((e) => e.toLowerCase());
          return { deleted: s.deleted.filter((d) => !keys.includes(d)) };
        }),
      addManual: (rows) =>
        set((s) => {
          const existing = new Set(s.manual.map((m) => m.email.toLowerCase()));
          return { manual: [...rows.filter((r) => !existing.has(r.email.toLowerCase())), ...s.manual] };
        }),
    }),
    { name: "admin-customers" }
  )
);
