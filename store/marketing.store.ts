"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoBanners,
  demoCampaigns,
  demoCoupons,
  demoDiscountRules,
  demoFeatured,
  demoFlashSales,
  demoMktActivity,
  demoNewsletters,
  demoProductOffers,
  demoPromotions,
  demoSubscribers,
  demoVendorOffers,
  type Banner,
  type Campaign,
  type DiscountRule,
  type FeaturedProduct,
  type FlashSale,
  type MktCoupon,
  type MktStatus,
  type NewsletterCampaign,
  type ProductOffer,
  type Promotion,
  type Subscriber,
  type SubscriberStatus,
  type VendorOffer,
} from "@/features/admin/marketing";

interface MarketingState {
  coupons: MktCoupon[];
  rules: DiscountRule[];
  flashSales: FlashSale[];
  campaigns: Campaign[];
  promotions: Promotion[];
  productOffers: ProductOffer[];
  vendorOffers: VendorOffer[];
  banners: Banner[];
  featured: FeaturedProduct[];
  subscribers: Subscriber[];
  newsletters: NewsletterCampaign[];
  patchCoupon: (id: string, patch: Partial<MktCoupon>) => void;
  addCoupon: (c: MktCoupon) => void;
  removeCoupons: (ids: string[]) => void;
  patchRule: (id: string, patch: Partial<DiscountRule>) => void;
  addRule: (r: DiscountRule) => void;
  removeRules: (ids: string[]) => void;
  patchFlash: (id: string, patch: Partial<FlashSale>) => void;
  addFlash: (f: FlashSale) => void;
  removeFlash: (ids: string[]) => void;
  patchCampaign: (id: string, patch: Partial<Campaign>) => void;
  addCampaign: (c: Campaign) => void;
  removeCampaigns: (ids: string[]) => void;
  patchPromotion: (id: string, patch: Partial<Promotion>) => void;
  addPromotion: (p: Promotion) => void;
  removePromotions: (ids: string[]) => void;
  patchProductOffer: (id: string, patch: Partial<ProductOffer>) => void;
  addProductOffer: (p: ProductOffer) => void;
  removeProductOffers: (ids: string[]) => void;
  patchVendorOffer: (id: string, patch: Partial<VendorOffer>) => void;
  addVendorOffer: (v: VendorOffer) => void;
  removeVendorOffers: (ids: string[]) => void;
  patchBanner: (id: string, patch: Partial<Banner>) => void;
  addBanner: (b: Banner) => void;
  removeBanners: (ids: string[]) => void;
  patchFeatured: (id: string, patch: Partial<FeaturedProduct>) => void;
  addFeatured: (f: FeaturedProduct) => void;
  removeFeatured: (ids: string[]) => void;
  patchSubscriber: (id: string, patch: Partial<Subscriber>) => void;
  removeSubscribers: (ids: string[]) => void;
  patchNewsletter: (id: string, patch: Partial<NewsletterCampaign>) => void;
  addNewsletter: (n: NewsletterCampaign) => void;
  removeNewsletters: (ids: string[]) => void;
  reset: () => void;
}

const mapPatch = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
  list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set) => ({
      coupons: demoCoupons,
      rules: demoDiscountRules,
      flashSales: demoFlashSales,
      campaigns: demoCampaigns,
      promotions: demoPromotions,
      productOffers: demoProductOffers,
      vendorOffers: demoVendorOffers,
      banners: demoBanners,
      featured: demoFeatured,
      subscribers: demoSubscribers,
      newsletters: demoNewsletters,
      patchCoupon: (id, patch) => set((s) => ({ coupons: mapPatch(s.coupons, id, patch) })),
      addCoupon: (c) => set((s) => ({ coupons: [c, ...s.coupons] })),
      removeCoupons: (ids) => set((s) => ({ coupons: s.coupons.filter((c) => !ids.includes(c.id)) })),
      patchRule: (id, patch) => set((s) => ({ rules: mapPatch(s.rules, id, patch) })),
      addRule: (r) => set((s) => ({ rules: [r, ...s.rules] })),
      removeRules: (ids) => set((s) => ({ rules: s.rules.filter((r) => !ids.includes(r.id)) })),
      patchFlash: (id, patch) => set((s) => ({ flashSales: mapPatch(s.flashSales, id, patch) })),
      addFlash: (f) => set((s) => ({ flashSales: [f, ...s.flashSales] })),
      removeFlash: (ids) => set((s) => ({ flashSales: s.flashSales.filter((f) => !ids.includes(f.id)) })),
      patchCampaign: (id, patch) => set((s) => ({ campaigns: mapPatch(s.campaigns, id, patch) })),
      addCampaign: (c) => set((s) => ({ campaigns: [c, ...s.campaigns] })),
      removeCampaigns: (ids) => set((s) => ({ campaigns: s.campaigns.filter((c) => !ids.includes(c.id)) })),
      patchPromotion: (id, patch) => set((s) => ({ promotions: mapPatch(s.promotions, id, patch) })),
      addPromotion: (p) => set((s) => ({ promotions: [p, ...s.promotions] })),
      removePromotions: (ids) => set((s) => ({ promotions: s.promotions.filter((p) => !ids.includes(p.id)) })),
      patchProductOffer: (id, patch) => set((s) => ({ productOffers: mapPatch(s.productOffers, id, patch) })),
      addProductOffer: (p) => set((s) => ({ productOffers: [p, ...s.productOffers] })),
      removeProductOffers: (ids) => set((s) => ({ productOffers: s.productOffers.filter((p) => !ids.includes(p.id)) })),
      patchVendorOffer: (id, patch) => set((s) => ({ vendorOffers: mapPatch(s.vendorOffers, id, patch) })),
      addVendorOffer: (v) => set((s) => ({ vendorOffers: [v, ...s.vendorOffers] })),
      removeVendorOffers: (ids) => set((s) => ({ vendorOffers: s.vendorOffers.filter((v) => !ids.includes(v.id)) })),
      patchBanner: (id, patch) => set((s) => ({ banners: mapPatch(s.banners, id, patch) })),
      addBanner: (b) => set((s) => ({ banners: [b, ...s.banners] })),
      removeBanners: (ids) => set((s) => ({ banners: s.banners.filter((b) => !ids.includes(b.id)) })),
      patchFeatured: (id, patch) => set((s) => ({ featured: mapPatch(s.featured, id, patch) })),
      addFeatured: (f) => set((s) => ({ featured: [f, ...s.featured] })),
      removeFeatured: (ids) => set((s) => ({ featured: s.featured.filter((f) => !ids.includes(f.id)) })),
      patchSubscriber: (id, patch) => set((s) => ({ subscribers: mapPatch(s.subscribers, id, patch) })),
      removeSubscribers: (ids) => set((s) => ({ subscribers: s.subscribers.filter((x) => !ids.includes(x.id)) })),
      patchNewsletter: (id, patch) => set((s) => ({ newsletters: mapPatch(s.newsletters, id, patch) })),
      addNewsletter: (n) => set((s) => ({ newsletters: [n, ...s.newsletters] })),
      removeNewsletters: (ids) => set((s) => ({ newsletters: s.newsletters.filter((n) => !ids.includes(n.id)) })),
      reset: () =>
        set({
          coupons: demoCoupons,
          rules: demoDiscountRules,
          flashSales: demoFlashSales,
          campaigns: demoCampaigns,
          promotions: demoPromotions,
          productOffers: demoProductOffers,
          vendorOffers: demoVendorOffers,
          banners: demoBanners,
          featured: demoFeatured,
          subscribers: demoSubscribers,
          newsletters: demoNewsletters,
        }),
    }),
    { name: "marketing-store", storage: createJSONStorage(() => localStorage) }
  )
);

export function useMktCoupons(): MktCoupon[] {
  const coupons = useMarketingStore((s) => s.coupons);
  return useMemo(() => coupons, [coupons]);
}
export function useMktRules(): DiscountRule[] {
  const rules = useMarketingStore((s) => s.rules);
  return useMemo(() => rules, [rules]);
}
export function useMktFlash(): FlashSale[] {
  const flashSales = useMarketingStore((s) => s.flashSales);
  return useMemo(() => flashSales, [flashSales]);
}
export function useMktCampaigns(): Campaign[] {
  const campaigns = useMarketingStore((s) => s.campaigns);
  return useMemo(() => campaigns, [campaigns]);
}
export function useMktPromotions(): Promotion[] {
  const promotions = useMarketingStore((s) => s.promotions);
  return useMemo(() => promotions, [promotions]);
}
export function useMktProductOffers(): ProductOffer[] {
  const productOffers = useMarketingStore((s) => s.productOffers);
  return useMemo(() => productOffers, [productOffers]);
}
export function useMktVendorOffers(): VendorOffer[] {
  const vendorOffers = useMarketingStore((s) => s.vendorOffers);
  return useMemo(() => vendorOffers, [vendorOffers]);
}
export function useMktBanners(): Banner[] {
  const banners = useMarketingStore((s) => s.banners);
  return useMemo(() => banners, [banners]);
}
export function useMktFeatured(): FeaturedProduct[] {
  const featured = useMarketingStore((s) => s.featured);
  return useMemo(() => featured, [featured]);
}
export function useMktSubscribers(): Subscriber[] {
  const subscribers = useMarketingStore((s) => s.subscribers);
  return useMemo(() => subscribers, [subscribers]);
}
export function useMktNewsletters(): NewsletterCampaign[] {
  const newsletters = useMarketingStore((s) => s.newsletters);
  return useMemo(() => newsletters, [newsletters]);
}
export function useMktActivity() {
  return useMemo(() => demoMktActivity, []);
}

export type { MktStatus, SubscriberStatus };
