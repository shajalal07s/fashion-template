"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultDeliverySettings,
  demoMethods,
  demoProviders,
  demoRates,
  demoVendorShipping,
  demoZones,
  type DeliverySettings,
  type ShippingMethod,
  type ShippingProvider,
  type ShippingRate,
  type ShippingZone,
  type VendorShipping,
} from "@/features/admin/shipping";

interface ShippingState {
  zones: ShippingZone[];
  methods: ShippingMethod[];
  rates: ShippingRate[];
  vendors: VendorShipping[];
  delivery: DeliverySettings;
  providers: ShippingProvider[];
  patchZone: (id: string, patch: Partial<ShippingZone>) => void;
  addZone: (z: ShippingZone) => void;
  removeZones: (ids: string[]) => void;
  patchMethod: (id: string, patch: Partial<ShippingMethod>) => void;
  addMethod: (m: ShippingMethod) => void;
  removeMethods: (ids: string[]) => void;
  patchRate: (id: string, patch: Partial<ShippingRate>) => void;
  addRate: (r: ShippingRate) => void;
  removeRates: (ids: string[]) => void;
  patchVendorShip: (id: string, patch: Partial<VendorShipping>) => void;
  patchDelivery: (patch: Partial<DeliverySettings>) => void;
  patchProvider: (id: string, patch: Partial<ShippingProvider>) => void;
  addProvider: (p: ShippingProvider) => void;
  removeProviders: (ids: string[]) => void;
  setDefaultProvider: (id: string) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useShippingStore = create<ShippingState>()(
  persist(
    (set) => ({
      zones: demoZones,
      methods: demoMethods,
      rates: demoRates,
      vendors: demoVendorShipping,
      delivery: defaultDeliverySettings,
      providers: demoProviders,
      patchZone: (id, patch) => set((s) => ({ zones: mapPatch(s.zones, id, patch) })),
      addZone: (z) => set((s) => ({ zones: [z, ...s.zones] })),
      removeZones: (ids) => set((s) => ({ zones: s.zones.filter((z) => !ids.includes(z.id)) })),
      patchMethod: (id, patch) => set((s) => ({ methods: mapPatch(s.methods, id, patch) })),
      addMethod: (m) => set((s) => ({ methods: [m, ...s.methods] })),
      removeMethods: (ids) => set((s) => ({ methods: s.methods.filter((m) => !ids.includes(m.id)) })),
      patchRate: (id, patch) => set((s) => ({ rates: mapPatch(s.rates, id, patch) })),
      addRate: (r) => set((s) => ({ rates: [r, ...s.rates] })),
      removeRates: (ids) => set((s) => ({ rates: s.rates.filter((r) => !ids.includes(r.id)) })),
      patchVendorShip: (id, patch) => set((s) => ({ vendors: mapPatch(s.vendors, id, patch) })),
      patchDelivery: (patch) => set((s) => ({ delivery: { ...s.delivery, ...patch } })),
      patchProvider: (id, patch) => set((s) => ({ providers: mapPatch(s.providers, id, patch) })),
      addProvider: (p) => set((s) => ({ providers: [p, ...s.providers] })),
      removeProviders: (ids) => set((s) => ({ providers: s.providers.filter((p) => !ids.includes(p.id)) })),
      setDefaultProvider: (id) =>
        set((s) => ({ providers: s.providers.map((p) => ({ ...p, isDefault: p.id === id })) })),
      reset: () =>
        set({
          zones: demoZones,
          methods: demoMethods,
          rates: demoRates,
          vendors: demoVendorShipping,
          delivery: defaultDeliverySettings,
          providers: demoProviders,
        }),
    }),
    { name: "shipping-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useShipZones() {
  const zones = useShippingStore((s) => s.zones);
  return useMemo(() => zones, [zones]);
}
export function useShipMethods() {
  const methods = useShippingStore((s) => s.methods);
  return useMemo(() => methods, [methods]);
}
export function useShipRates() {
  const rates = useShippingStore((s) => s.rates);
  return useMemo(() => rates, [rates]);
}
export function useShipVendors() {
  const vendors = useShippingStore((s) => s.vendors);
  return useMemo(() => vendors, [vendors]);
}
export function useShipProviders() {
  const providers = useShippingStore((s) => s.providers);
  return useMemo(() => providers, [providers]);
}
