"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoVendor,
  demoVendorNotifications,
  demoVendorOrders,
  demoVendorPayouts,
  demoVendorProducts,
  demoVendorReviews,
  normalizeVendorProduct,
  type ProductVariation,
  type VendorNotification,
  type VendorOrder,
  type VendorPayout,
  type VendorProduct,
  type VendorProfile,
  type VendorReview,
} from "@/features/vendor/vendor";
import {
  demoCampaigns,
  demoFlashSales,
  demoProductDiscounts,
  demoVendorCoupons,
  type Campaign,
  type FlashSale,
  type ProductDiscount,
  type VendorCoupon,
} from "@/features/vendor/coupons";
export type { VendorCoupon, ProductDiscount, FlashSale, Campaign };
import { demoPayoutAccounts } from "@/features/vendor/payouts";
import type { PayoutAccount as Acct } from "@/features/vendor/payouts";
export type { Acct as PayoutAccount };
import {
  defaultAddresses,
  defaultContact,
  defaultSocials,
  type SocialLink,
  type StoreAddressEntry,
  type StoreContact,
  type StoreSeo,
} from "@/features/vendor/store-mgmt";
import {
  demoFeedback,
  type CustomerFeedback,
} from "@/features/vendor/reviews";
export type { CustomerFeedback, SocialLink, StoreAddressEntry, StoreContact, StoreSeo };
import {
  demoDeliverySettings,
  demoShippingRates,
  demoShippingSettings,
  demoShippingZones,
  type DeliverySettings,
  type ShippingRate,
  type ShippingSettings,
  type ShippingZone,
} from "@/features/vendor/shipping";
import {
  demoAccountProfile,
  demoAccountStoreSettings,
  demoKyc,
  demoNotifyPrefs,
  type AccountStoreSettings,
  type NotifyPref,
  type VendorAccountProfile,
  type VendorKyc,
} from "@/features/vendor/settings";
export type {
  AccountStoreSettings,
  DeliverySettings,
  NotifyPref,
  ShippingRate,
  ShippingSettings,
  ShippingZone,
  VendorAccountProfile,
  VendorKyc,
};

interface VendorState {
  profile: VendorProfile;
  orders: VendorOrder[];
  products: VendorProduct[];
  payouts: VendorPayout[];
  reviews: VendorReview[];
  notifications: VendorNotification[];
  announcementDismissed: boolean;
  payoutAccounts: Acct[];
  coupons: VendorCoupon[];
  discounts: ProductDiscount[];
  flashSales: FlashSale[];
  campaigns: Campaign[];
  patchProfile: (p: Partial<VendorProfile>) => void;
  setStoreStatus: (s: VendorProfile["status"]) => void;
  patchOrder: (id: string, p: Partial<VendorOrder>) => void;
  addOrderNote: (id: string, text: string, author: string) => void;
  deleteOrderNote: (id: string, noteId: string) => void;
  logOrderEvent: (id: string, event: string, detail: string) => void;
  patchProduct: (id: string, p: Partial<VendorProduct>) => void;
  addProduct: (p: VendorProduct) => void;
  removeProducts: (ids: string[]) => void;
  duplicateProduct: (id: string) => string | null;
  adjustStock: (id: string, change: number, note: string) => void;
  patchVariation: (productId: string, variationId: string, p: Partial<ProductVariation>) => void;
  addVariation: (productId: string, v: ProductVariation) => void;
  removeVariations: (productId: string, ids: string[]) => void;
  addPayout: (p: VendorPayout) => void;
  patchPayout: (id: string, p: Partial<VendorPayout>) => void;
  addPayoutAccount: (a: Acct) => void;
  patchPayoutAccount: (id: string, p: Partial<Acct>) => void;
  removePayoutAccount: (id: string) => void;
  setDefaultAccount: (id: string) => void;
  addCoupon: (c: VendorCoupon) => void;
  patchCoupon: (id: string, p: Partial<VendorCoupon>) => void;
  removeCoupons: (ids: string[]) => void;
  addDiscount: (d: ProductDiscount) => void;
  patchDiscount: (id: string, p: Partial<ProductDiscount>) => void;
  removeDiscounts: (ids: string[]) => void;
  patchCampaign: (id: string, p: Partial<Campaign>) => void;
  notifyVendor: (text: string, kind: VendorNotification["kind"]) => void;
  replyReview: (id: string, reply: string) => void;
  editReviewReply: (id: string, reply: string) => void;
  deleteReviewReply: (id: string) => void;
  feedback: CustomerFeedback[];
  respondFeedback: (id: string, reply: string, status: CustomerFeedback["status"]) => void;
  storeCategory: string;
  storeShortDesc: string;
  storeDescription: string;
  storeBanner: string;
  storeContact: StoreContact;
  storeAddresses: StoreAddressEntry[];
  storeSocials: SocialLink[];
  storeSeo: StoreSeo;
  storeActivity: Array<{ id: string; action: string; date: string }>;
  setStoreDetails: (p: { category?: string; shortDesc?: string; description?: string; banner?: string }) => void;
  patchStoreContact: (p: Partial<StoreContact>) => void;
  addStoreAddress: (a: StoreAddressEntry) => void;
  patchStoreAddress: (id: string, p: Partial<StoreAddressEntry>) => void;
  removeStoreAddress: (id: string) => void;
  setDefaultStoreAddress: (id: string) => void;
  addSocial: (s: SocialLink) => void;
  patchSocial: (id: string, p: Partial<SocialLink>) => void;
  removeSocial: (id: string) => void;
  patchSeo: (p: Partial<StoreSeo>) => void;
  logStoreActivity: (action: string) => void;
  shippingSettings: ShippingSettings;
  shippingZones: ShippingZone[];
  shippingRates: ShippingRate[];
  deliverySettings: DeliverySettings;
  patchShippingSettings: (p: Partial<ShippingSettings>) => void;
  addShippingZone: (z: ShippingZone) => void;
  patchShippingZone: (id: string, p: Partial<ShippingZone>) => void;
  removeShippingZone: (id: string) => void;
  addShippingRate: (r: ShippingRate) => void;
  patchShippingRate: (id: string, p: Partial<ShippingRate>) => void;
  removeShippingRate: (id: string) => void;
  patchDeliverySettings: (p: Partial<DeliverySettings>) => void;
  accountProfile: VendorAccountProfile;
  patchAccountProfile: (p: Partial<VendorAccountProfile>) => void;
  kyc: VendorKyc;
  patchKyc: (p: Partial<VendorKyc>) => void;
  notifyPrefs: NotifyPref[];
  patchNotifyPref: (key: string, p: Partial<NotifyPref>) => void;
  resetNotifyPrefs: () => void;
  accountStoreSettings: AccountStoreSettings;
  patchAccountStoreSettings: (p: Partial<AccountStoreSettings>) => void;
  markNotificationsRead: () => void;
  dismissAnnouncement: () => void;
  reset: () => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set) => ({
      profile: demoVendor,
      orders: demoVendorOrders,
      products: demoVendorProducts,
      payouts: demoVendorPayouts,
      reviews: demoVendorReviews,
      notifications: demoVendorNotifications,
      announcementDismissed: false,
      patchProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setStoreStatus: (status) => set((s) => ({ profile: { ...s.profile, status } })),
      patchOrder: (id, p) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...p, updated: "2026-09-26" } : o)) })),
      addOrderNote: (id, text, author) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, notes: [...(o.notes ?? []), { id: `n-${(o.notes ?? []).length + 1}`, text, author, date: "2026-09-26" }] }
              : o
          ),
        })),
      deleteOrderNote: (id, noteId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, notes: (o.notes ?? []).filter((n) => n.id !== noteId) } : o
          ),
        })),
      logOrderEvent: (id, event, detail) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? { ...o, activity: [{ event, date: "2026-09-26", detail }, ...(o.activity ?? [])] }
              : o
          ),
        })),
      patchProduct: (id, p) =>
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      addProduct: (p) => set((s) => ({ products: [p, ...s.products] })),
      removeProducts: (ids) =>
        set((s) => ({ products: s.products.filter((x) => !ids.includes(x.id)) })),
      duplicateProduct: (id) => {
        const state = useVendorStore.getState();
        const src = state.products.find((x) => x.id === id);
        if (!src) return null;
        const copy: VendorProduct = {
          ...src,
          id: `vp-copy-${state.products.length + 1}`,
          name: `${src.name} (Copy)`,
          sku: `${src.sku}-COPY`,
          slug: `${src.slug}-copy`,
          status: "draft",
          sold: 0,
          views: 0,
          carts: 0,
          reviews: 0,
          revenue: 0,
          variations: src.variations.map((v, i) => ({ ...v, id: `${src.id}-copy-v${i}`, sku: `${v.sku}-COPY` })),
          activity: [{ event: "Product created", date: "2026-09-26", detail: `Duplicated from ${src.name}` }],
        };
        set((s) => ({ products: [copy, ...s.products] }));
        return copy.id;
      },
      adjustStock: (id, change, note) =>
        set((s) => ({
          products: s.products.map((x) => {
            if (x.id !== id) return x;
            const balance = Math.max(0, x.stock + change);
            return {
              ...x,
              stock: balance,
              status: balance === 0 ? "out" : x.status === "out" ? "active" : x.status,
              updated: "2026-09-26",
              stockHistory: [{ date: "2026-09-26", change, balance, note }, ...x.stockHistory],
              activity: [{ event: "Stock changed", date: "2026-09-26", detail: `${change > 0 ? "+" : ""}${change} — ${note}` }, ...x.activity],
            };
          }),
        })),
      patchVariation: (productId, variationId, p) =>
        set((s) => ({
          products: s.products.map((x) =>
            x.id === productId
              ? { ...x, variations: x.variations.map((v) => (v.id === variationId ? { ...v, ...p } : v)) }
              : x
          ),
        })),
      addVariation: (productId, v) =>
        set((s) => ({
          products: s.products.map((x) =>
            x.id === productId ? { ...x, variations: [...x.variations, v] } : x
          ),
        })),
      removeVariations: (productId, ids) =>
        set((s) => ({
          products: s.products.map((x) =>
            x.id === productId ? { ...x, variations: x.variations.filter((v) => !ids.includes(v.id)) } : x
          ),
        })),
      addPayout: (p) => set((s) => ({ payouts: [p, ...s.payouts] })),
      patchPayout: (id, p) =>
        set((s) => ({ payouts: s.payouts.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      payoutAccounts: demoPayoutAccounts,
      coupons: demoVendorCoupons,
      discounts: demoProductDiscounts,
      flashSales: demoFlashSales,
      campaigns: demoCampaigns,
      addPayoutAccount: (a) => set((s) => ({ payoutAccounts: [a, ...s.payoutAccounts] })),
      patchPayoutAccount: (id, p) =>
        set((s) => ({ payoutAccounts: s.payoutAccounts.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removePayoutAccount: (id) =>
        set((s) => ({ payoutAccounts: s.payoutAccounts.filter((x) => x.id !== id) })),
      setDefaultAccount: (id) =>
        set((s) => ({ payoutAccounts: s.payoutAccounts.map((x) => ({ ...x, isDefault: x.id === id })) })),
      addCoupon: (c) => set((s) => ({ coupons: [c, ...s.coupons] })),
      patchCoupon: (id, p) =>
        set((s) => ({ coupons: s.coupons.map((x) => (x.id === id ? { ...x, ...p, updated: "2026-09-26" } : x)) })),
      removeCoupons: (ids) =>
        set((s) => ({ coupons: s.coupons.filter((x) => !ids.includes(x.id)) })),
      addDiscount: (d) => set((s) => ({ discounts: [d, ...s.discounts] })),
      patchDiscount: (id, p) =>
        set((s) => ({ discounts: s.discounts.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeDiscounts: (ids) =>
        set((s) => ({ discounts: s.discounts.filter((x) => !ids.includes(x.id)) })),
      patchCampaign: (id, p) =>
        set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      notifyVendor: (text, kind) =>
        set((s) => ({
          notifications: [{ id: `vn-${Date.now()}`, text, date: "2026-09-26", read: false, kind }, ...s.notifications],
        })),
      replyReview: (id, reply) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, replied: true, reply } : r)),
        })),
      editReviewReply: (id, reply) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, reply } : r)),
        })),
      deleteReviewReply: (id) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, replied: false, reply: undefined } : r)),
        })),
      feedback: demoFeedback,
      respondFeedback: (id, reply, status) =>
        set((s) => ({
          feedback: s.feedback.map((f) => (f.id === id ? { ...f, reply, responded: true, status } : f)),
        })),
      storeCategory: "Fashion",
      storeShortDesc: "Curated women's fashion from Dhaka.",
      storeDescription: "<p>Ayesha Boutique crafts comfortable everyday wear with premium fabrics.</p>",
      storeBanner: "/images/Banner/banner-1.jpg",
      storeContact: defaultContact(demoVendor),
      storeAddresses: defaultAddresses(demoVendor),
      storeSocials: defaultSocials(),
      storeSeo: { metaTitle: "Ayesha Boutique | Women's Fashion", metaDesc: "Shop kurtis, sarees and three-pieces.", keywords: "kurti, saree, boutique" },
      storeActivity: [{ id: "sa-1", action: "Store profile updated", date: "2026-09-20" }],
      setStoreDetails: (p) =>
        set((s) => ({
          storeCategory: p.category ?? s.storeCategory,
          storeShortDesc: p.shortDesc ?? s.storeShortDesc,
          storeDescription: p.description ?? s.storeDescription,
          storeBanner: p.banner ?? s.storeBanner,
        })),
      patchStoreContact: (p) => set((s) => ({ storeContact: { ...s.storeContact, ...p } })),
      addStoreAddress: (a) => set((s) => ({ storeAddresses: [a, ...s.storeAddresses] })),
      patchStoreAddress: (id, p) =>
        set((s) => ({ storeAddresses: s.storeAddresses.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeStoreAddress: (id) =>
        set((s) => ({ storeAddresses: s.storeAddresses.filter((x) => x.id !== id) })),
      setDefaultStoreAddress: (id) =>
        set((s) => ({ storeAddresses: s.storeAddresses.map((x) => ({ ...x, isDefault: x.id === id })) })),
      addSocial: (x) => set((s) => ({ storeSocials: [...s.storeSocials, x] })),
      patchSocial: (id, p) =>
        set((s) => ({ storeSocials: s.storeSocials.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeSocial: (id) =>
        set((s) => ({ storeSocials: s.storeSocials.filter((x) => x.id !== id) })),
      patchSeo: (p) => set((s) => ({ storeSeo: { ...s.storeSeo, ...p } })),
      logStoreActivity: (action) =>
        set((s) => ({
          storeActivity: [{ id: `sa-${Date.now()}`, action, date: "2026-09-26" }, ...s.storeActivity].slice(0, 20),
        })),
      shippingSettings: demoShippingSettings,
      shippingZones: demoShippingZones,
      shippingRates: demoShippingRates,
      deliverySettings: demoDeliverySettings,
      patchShippingSettings: (p) =>
        set((s) => ({ shippingSettings: { ...s.shippingSettings, ...p } })),
      addShippingZone: (z) => set((s) => ({ shippingZones: [...s.shippingZones, z] })),
      patchShippingZone: (id, p) =>
        set((s) => ({ shippingZones: s.shippingZones.map((x) => (x.id === id ? { ...x, ...p, updated: "2026-09-26" } : x)) })),
      removeShippingZone: (id) =>
        set((s) => ({ shippingZones: s.shippingZones.filter((x) => x.id !== id) })),
      addShippingRate: (r) => set((s) => ({ shippingRates: [r, ...s.shippingRates] })),
      patchShippingRate: (id, p) =>
        set((s) => ({ shippingRates: s.shippingRates.map((x) => (x.id === id ? { ...x, ...p, updated: "2026-09-26" } : x)) })),
      removeShippingRate: (id) =>
        set((s) => ({ shippingRates: s.shippingRates.filter((x) => x.id !== id) })),
      patchDeliverySettings: (p) =>
        set((s) => ({ deliverySettings: { ...s.deliverySettings, ...p } })),
      accountProfile: demoAccountProfile,
      patchAccountProfile: (p) =>
        set((s) => ({ accountProfile: { ...s.accountProfile, ...p } })),
      kyc: demoKyc,
      patchKyc: (p) => set((s) => ({ kyc: { ...s.kyc, ...p, updated: "2026-09-26" } })),
      notifyPrefs: demoNotifyPrefs,
      patchNotifyPref: (key, p) =>
        set((s) => ({ notifyPrefs: s.notifyPrefs.map((x) => (x.key === key ? { ...x, ...p } : x)) })),
      resetNotifyPrefs: () => set({ notifyPrefs: demoNotifyPrefs }),
      accountStoreSettings: demoAccountStoreSettings,
      patchAccountStoreSettings: (p) =>
        set((s) => ({ accountStoreSettings: { ...s.accountStoreSettings, ...p } })),
      markNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      dismissAnnouncement: () => set({ announcementDismissed: true }),
      reset: () =>
        set({
          profile: demoVendor,
          orders: demoVendorOrders,
          products: demoVendorProducts,
          payouts: demoVendorPayouts,
          reviews: demoVendorReviews,
          notifications: demoVendorNotifications,
          announcementDismissed: false,
          payoutAccounts: demoPayoutAccounts,
          coupons: demoVendorCoupons,
          discounts: demoProductDiscounts,
          flashSales: demoFlashSales,
          campaigns: demoCampaigns,
          feedback: demoFeedback,
          storeCategory: "Fashion",
          storeShortDesc: "Curated women's fashion from Dhaka.",
          storeDescription: "<p>Ayesha Boutique crafts comfortable everyday wear with premium fabrics.</p>",
          storeBanner: "/images/Banner/banner-1.jpg",
          storeContact: defaultContact(demoVendor),
          storeAddresses: defaultAddresses(demoVendor),
          storeSocials: defaultSocials(),
          storeSeo: { metaTitle: "Ayesha Boutique | Women's Fashion", metaDesc: "Shop kurtis, sarees and three-pieces.", keywords: "kurti, saree, boutique" },
          storeActivity: [{ id: "sa-1", action: "Store profile updated", date: "2026-09-20" }],
          shippingSettings: demoShippingSettings,
          shippingZones: demoShippingZones,
          shippingRates: demoShippingRates,
          deliverySettings: demoDeliverySettings,
          accountProfile: demoAccountProfile,
          kyc: demoKyc,
          notifyPrefs: demoNotifyPrefs,
          accountStoreSettings: demoAccountStoreSettings,
        }),
    }),
    { name: "vendor-store", storage: createJSONStorage(() => localStorage), version: 5,
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Partial<VendorState>;
        return {
          profile: { ...demoVendor, ...s.profile },
          orders: s.orders ?? demoVendorOrders,
          products: (s.products ?? demoVendorProducts).map((p) =>
            normalizeVendorProduct(p as Partial<VendorProduct> & { id: string; name: string })
          ),
          payouts: s.payouts ?? demoVendorPayouts,
          reviews: s.reviews ?? demoVendorReviews,
          notifications: s.notifications ?? demoVendorNotifications,
          announcementDismissed: s.announcementDismissed ?? false,
          payoutAccounts: s.payoutAccounts ?? demoPayoutAccounts,
          coupons: s.coupons ?? demoVendorCoupons,
          discounts: s.discounts ?? demoProductDiscounts,
          flashSales: s.flashSales ?? demoFlashSales,
          campaigns: s.campaigns ?? demoCampaigns,
          feedback: s.feedback ?? demoFeedback,
          storeCategory: s.storeCategory ?? "Fashion",
          storeShortDesc: s.storeShortDesc ?? "Curated women's fashion from Dhaka.",
          storeDescription: s.storeDescription ?? "<p>Ayesha Boutique crafts comfortable everyday wear with premium fabrics.</p>",
          storeBanner: s.storeBanner ?? "/images/Banner/banner-1.jpg",
          storeContact: s.storeContact ?? defaultContact(demoVendor),
          storeAddresses: s.storeAddresses ?? defaultAddresses(demoVendor),
          storeSocials: s.storeSocials ?? defaultSocials(),
          storeSeo: s.storeSeo ?? { metaTitle: "Ayesha Boutique | Women's Fashion", metaDesc: "Shop kurtis, sarees and three-pieces.", keywords: "kurti, saree, boutique" },
          storeActivity: s.storeActivity ?? [{ id: "sa-1", action: "Store profile updated", date: "2026-09-20" }],
          shippingSettings: s.shippingSettings ?? demoShippingSettings,
          shippingZones: s.shippingZones ?? demoShippingZones,
          shippingRates: s.shippingRates ?? demoShippingRates,
          deliverySettings: s.deliverySettings ?? demoDeliverySettings,
          accountProfile: s.accountProfile ?? demoAccountProfile,
          kyc: s.kyc ?? demoKyc,
          notifyPrefs: s.notifyPrefs ?? demoNotifyPrefs,
          accountStoreSettings: s.accountStoreSettings ?? demoAccountStoreSettings,
        } as VendorState;
      },
    }
  )
);

export function useVendorProfile(): VendorProfile {
  return useVendorStore((s) => s.profile);
}
export function useVendorOrders(): VendorOrder[] {
  const orders = useVendorStore((s) => s.orders);
  return useMemo(() => orders, [orders]);
}
export function useVendorProducts(): VendorProduct[] {
  const products = useVendorStore((s) => s.products);
  return useMemo(() => products, [products]);
}
export function useVendorPayouts(): VendorPayout[] {
  const payouts = useVendorStore((s) => s.payouts);
  return useMemo(() => payouts, [payouts]);
}
export function useVendorReviews(): VendorReview[] {
  const reviews = useVendorStore((s) => s.reviews);
  return useMemo(() => reviews, [reviews]);
}
export function useVendorNotifications(): VendorNotification[] {
  const notifications = useVendorStore((s) => s.notifications);
  return useMemo(() => notifications, [notifications]);
}
export function usePayoutAccounts(): Acct[] {
  const a = useVendorStore((s) => s.payoutAccounts);
  return useMemo(() => a, [a]);
}
export function useVendorCoupons(): VendorCoupon[] {
  const c = useVendorStore((s) => s.coupons);
  return useMemo(() => c, [c]);
}
export function useProductDiscounts(): ProductDiscount[] {
  const d = useVendorStore((s) => s.discounts);
  return useMemo(() => d, [d]);
}
export function useFlashSales(): FlashSale[] {
  const f = useVendorStore((s) => s.flashSales);
  return useMemo(() => f, [f]);
}
export function useCampaigns(): Campaign[] {
  const c = useVendorStore((s) => s.campaigns);
  return useMemo(() => c, [c]);
}
export function useVendorFeedback(): CustomerFeedback[] {
  const f = useVendorStore((s) => s.feedback);
  return useMemo(() => f, [f]);
}
export function useStoreContact(): StoreContact {
  return useVendorStore((s) => s.storeContact);
}
export function useStoreAddresses(): StoreAddressEntry[] {
  const a = useVendorStore((s) => s.storeAddresses);
  return useMemo(() => a, [a]);
}
export function useStoreSocials(): SocialLink[] {
  const x = useVendorStore((s) => s.storeSocials);
  return useMemo(() => x, [x]);
}
