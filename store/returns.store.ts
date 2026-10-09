"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultPolicy,
  demoIssues,
  demoReasons,
  demoRefunds,
  demoReturns,
  demoShipments,
  type DeliveryIssue,
  type RefundRequest,
  type ReturnPolicy,
  type ReturnReason,
  type ReturnRequest,
  type Shipment,
} from "@/features/admin/returns";

interface ReturnsState {
  shipments: Shipment[];
  issues: DeliveryIssue[];
  returns: ReturnRequest[];
  refunds: RefundRequest[];
  reasons: ReturnReason[];
  policy: ReturnPolicy;
  patchShipment: (id: string, patch: Partial<Shipment>) => void;
  patchIssue: (id: string, patch: Partial<DeliveryIssue>) => void;
  patchReturn: (id: string, patch: Partial<ReturnRequest>) => void;
  addRefund: (r: RefundRequest) => void;
  patchRefund: (id: string, patch: Partial<RefundRequest>) => void;
  patchReason: (id: string, patch: Partial<ReturnReason>) => void;
  addReason: (r: ReturnReason) => void;
  removeReasons: (ids: string[]) => void;
  patchPolicy: (patch: Partial<ReturnPolicy>) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useReturnsStore = create<ReturnsState>()(
  persist(
    (set) => ({
      shipments: demoShipments,
      issues: demoIssues,
      returns: demoReturns,
      refunds: demoRefunds,
      reasons: demoReasons,
      policy: defaultPolicy,
      patchShipment: (id, patch) => set((s) => ({ shipments: mapPatch(s.shipments, id, patch) })),
      patchIssue: (id, patch) => set((s) => ({ issues: mapPatch(s.issues, id, patch) })),
      patchReturn: (id, patch) => set((s) => ({ returns: mapPatch(s.returns, id, patch) })),
      addRefund: (r) => set((s) => ({ refunds: [r, ...s.refunds] })),
      patchRefund: (id, patch) => set((s) => ({ refunds: mapPatch(s.refunds, id, patch) })),
      patchReason: (id, patch) => set((s) => ({ reasons: mapPatch(s.reasons, id, patch) })),
      addReason: (r) => set((s) => ({ reasons: [...s.reasons, r] })),
      removeReasons: (ids) => set((s) => ({ reasons: s.reasons.filter((r) => !ids.includes(r.id)) })),
      patchPolicy: (patch) => set((s) => ({ policy: { ...s.policy, ...patch } })),
      reset: () =>
        set({
          shipments: demoShipments,
          issues: demoIssues,
          returns: demoReturns,
          refunds: demoRefunds,
          reasons: demoReasons,
          policy: defaultPolicy,
        }),
    }),
    { name: "returns-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useShipments(): Shipment[] {
  const shipments = useReturnsStore((s) => s.shipments);
  return useMemo(() => shipments, [shipments]);
}
export function useDeliveryIssues(): DeliveryIssue[] {
  const issues = useReturnsStore((s) => s.issues);
  return useMemo(() => issues, [issues]);
}
export function useReturnRequests(): ReturnRequest[] {
  const returns = useReturnsStore((s) => s.returns);
  return useMemo(() => returns, [returns]);
}
export function useRefundRequests(): RefundRequest[] {
  const refunds = useReturnsStore((s) => s.refunds);
  return useMemo(() => refunds, [refunds]);
}
export function useReturnReasons(): ReturnReason[] {
  const reasons = useReturnsStore((s) => s.reasons);
  return useMemo(() => reasons, [reasons]);
}
