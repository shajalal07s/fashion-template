import { z } from "zod";
import type { VendorProfile } from "@/features/vendor/vendor";

// Media + profile rules come from backend config in production.
export const STORE_RULES = {
  logoTypes: ["image/png", "image/jpeg", "image/webp"],
  logoMaxMb: 2,
  logoSize: "512 × 512 px",
  bannerTypes: ["image/png", "image/jpeg", "image/webp"],
  bannerMaxMb: 5,
  bannerSize: "1740 × 480 px",
  slugPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  socialPlatforms: ["Facebook", "Instagram", "YouTube", "TikTok", "X", "Pinterest"],
} as const;

export interface StoreContact {
  businessEmail: string;
  supportEmail: string;
  phone: string;
  altPhone: string;
  whatsapp: string;
  showEmail: boolean;
  showPhone: boolean;
  showWhatsapp: boolean;
  showAltPhone: boolean;
  hours: Array<{ day: string; open: boolean; from: string; to: string }>;
}

export interface StoreAddressEntry {
  id: string;
  kind: "store" | "warehouse" | "return" | "pickup";
  line1: string;
  line2: string;
  area: string;
  city: string;
  division: string;
  postal: string;
  country: string;
  isDefault: boolean;
  isPublic: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  enabled: boolean;
}

export interface StoreSeo {
  metaTitle: string;
  metaDesc: string;
  keywords: string;
}

export interface StoreActivity {
  id: string;
  action: string;
  date: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function defaultContact(profile: VendorProfile): StoreContact {
  return {
    businessEmail: profile.email,
    supportEmail: `support@${profile.slug}.com`,
    phone: profile.phone,
    altPhone: "",
    whatsapp: profile.phone,
    showEmail: true,
    showPhone: true,
    showWhatsapp: true,
    showAltPhone: false,
    hours: DAYS.map((day) => ({ day, open: day !== "Friday", from: "09:00", to: "18:00" })),
  };
}

export function defaultAddresses(profile: VendorProfile): StoreAddressEntry[] {
  return [
    {
      id: "addr-1", kind: "store", line1: profile.address, line2: "",
      area: "Banani", city: "Dhaka", division: "Dhaka", postal: "1213",
      country: "Bangladesh", isDefault: true, isPublic: true,
    },
  ];
}

export function defaultSocials(): SocialLink[] {
  return [
    { id: "so-1", platform: "Facebook", url: "https://facebook.com/ayesaboutique", enabled: true },
    { id: "so-2", platform: "Instagram", url: "https://instagram.com/ayesaboutique", enabled: true },
  ];
}

export interface CompletionItem {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

export function storeCompletion(args: {
  hasLogo: boolean;
  hasBanner: boolean;
  hasDesc: boolean;
  hasContact: boolean;
  hasAddress: boolean;
  hasSocial: boolean;
  hasName: boolean;
}): { items: CompletionItem[]; pct: number } {
  const items: CompletionItem[] = [
    { key: "name", label: "Store Name", href: "/vendor/store/profile", done: args.hasName },
    { key: "logo", label: "Store Logo", href: "/vendor/store/logo", done: args.hasLogo },
    { key: "banner", label: "Store Banner", href: "/vendor/store/banner", done: args.hasBanner },
    { key: "desc", label: "Store Description", href: "/vendor/store/description", done: args.hasDesc },
    { key: "contact", label: "Contact Information", href: "/vendor/store/contact", done: args.hasContact },
    { key: "address", label: "Store Address", href: "/vendor/store/address", done: args.hasAddress },
    { key: "social", label: "Social Links", href: "/vendor/store/social", done: args.hasSocial },
  ];
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { items, pct };
}

export const profileSchema = z.object({
  store: z.string().min(3).max(60),
  slug: z.string().min(3).max(60).regex(STORE_RULES.slugPattern, "Lowercase letters, numbers and hyphens only"),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  category: z.string().min(2).max(40),
});

export const socialSchema = z.object({
  platform: z.string().min(2),
  url: z.string().url("Must be a valid URL").refine(
    (u) => !/^(javascript|data):/i.test(u),
    "URL protocol not allowed"
  ),
});

export const seoSchema = z.object({
  metaTitle: z.string().max(60),
  metaDesc: z.string().max(160),
  keywords: z.string().max(200),
});

export function publicStoreUrl(slug: string): string {
  return `/store/${slug}`;
}
