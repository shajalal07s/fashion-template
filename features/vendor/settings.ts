import { z } from "zod";

// Platform-owned settings configuration (mocked as config).
export const SETTINGS_CONFIG = {
  passwordMin: 8,
  avatarTypes: ["image/png", "image/jpeg", "image/webp"],
  avatarMaxMb: 2,
  kycDocTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  kycMaxMb: 5,
  languages: ["English", "Bangla"],
  timezones: ["Asia/Dhaka", "Asia/Dubai", "Europe/London", "America/New_York"],
  notifyChannels: ["Email", "In-App", "SMS"] as const,
} as const;

export type KycStatus =
  | "notStarted" | "incomplete" | "submitted" | "review"
  | "verified" | "rejected" | "update" | "expired";

export interface KycDoc {
  id: string;
  kind: string;
  name: string;
  size: string;
  uploaded: string;
}

export interface VendorKyc {
  status: KycStatus;
  submitted: string;
  verifiedDate: string;
  updated: string;
  expiry: string;
  rejectionReason: string;
  legalName: string;
  businessName: string;
  businessType: string;
  country: string;
  regNumber: string;
  taxNumber: string;
  docType: string;
  docNumber: string;
  docs: KycDoc[];
}

export const demoKyc: VendorKyc = {
  status: "verified",
  submitted: "2026-09-10",
  verifiedDate: "2026-09-28",
  updated: "2026-09-28",
  expiry: "2027-09-28",
  rejectionReason: "",
  legalName: "Ayesha Rahman",
  businessName: "Ayesha Boutique",
  businessType: "Sole Proprietorship",
  country: "Bangladesh",
  regNumber: "DB-2024-1182",
  taxNumber: "TIN-482910",
  docType: "National ID",
  docNumber: "1990-482-910",
  docs: [
    { id: "kd-1", kind: "National ID (front)", name: "nid-front.jpg", size: "1.2 MB", uploaded: "2026-09-10" },
    { id: "kd-2", kind: "Trade License", name: "trade-license.pdf", size: "2.1 MB", uploaded: "2026-09-10" },
  ],
};

export interface NotifyPref {
  key: string;
  group: string;
  label: string;
  email: boolean;
  inApp: boolean;
  sms: boolean;
  frequency: "instant" | "daily" | "weekly";
}

export const demoNotifyPrefs: NotifyPref[] = [
  { key: "newOrder", group: "Orders", label: "New Order", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "orderCancelled", group: "Orders", label: "Order Cancelled", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "orderReturned", group: "Orders", label: "Order Returned", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "orderCompleted", group: "Orders", label: "Order Completed", email: false, inApp: true, sms: false, frequency: "daily" },
  { key: "paymentReceived", group: "Payments", label: "Payment Received", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "paymentFailed", group: "Payments", label: "Payment Failed", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "refund", group: "Payments", label: "Refund", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "commission", group: "Payments", label: "Commission Deduction", email: false, inApp: true, sms: false, frequency: "daily" },
  { key: "payoutRequested", group: "Payouts", label: "Payout Requested", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "payoutCompleted", group: "Payouts", label: "Payout Completed", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "payoutFailed", group: "Payouts", label: "Payout Failed", email: true, inApp: true, sms: true, frequency: "instant" },
  { key: "lowStock", group: "Products", label: "Low Stock", email: true, inApp: true, sms: false, frequency: "daily" },
  { key: "outOfStock", group: "Products", label: "Out of Stock", email: true, inApp: true, sms: false, frequency: "instant" },
  { key: "newReview", group: "Products", label: "New Review", email: false, inApp: true, sms: false, frequency: "daily" },
  { key: "storeUpdates", group: "Store", label: "Store Updates", email: true, inApp: true, sms: false, frequency: "weekly" },
  { key: "campaign", group: "Promotions", label: "Campaign Invitation", email: true, inApp: true, sms: false, frequency: "instant" },
];

export interface AccountStoreSettings {
  acceptOrders: boolean;
  vacation: boolean;
  vacStart: string;
  vacEnd: string;
  vacMessage: string;
  storeVisible: boolean;
  productsVisible: boolean;
  reviewsVisible: boolean;
  contactVisible: boolean;
  addressVisible: boolean;
  minOrder: number;
  maxOrder: number;
  currency: string;
  timezone: string;
  language: string;
}

export const demoAccountStoreSettings: AccountStoreSettings = {
  acceptOrders: true,
  vacation: false,
  vacStart: "2026-10-10",
  vacEnd: "2026-10-17",
  vacMessage: "Our store is temporarily unavailable.",
  storeVisible: true,
  productsVisible: true,
  reviewsVisible: true,
  contactVisible: true,
  addressVisible: true,
  minOrder: 0,
  maxOrder: 0,
  currency: "BDT",
  timezone: "Asia/Dhaka",
  language: "English",
};

export interface VendorAccountProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  photo: string;
  language: string;
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactor: boolean;
  lastLogin: string;
}

export const demoAccountProfile: VendorAccountProfile = {
  firstName: "Ayesha",
  lastName: "Rahman",
  displayName: "Ayesha Rahman",
  email: "ayesha@store.com",
  phone: "01711-223344",
  photo: "/images/women/women-1.jpg",
  language: "English",
  timezone: "Asia/Dhaka",
  emailVerified: true,
  phoneVerified: true,
  twoFactor: false,
  lastLogin: "2026-09-26 09:42",
};

export const profileSchema = z.object({
  firstName: z.string().min(2).max(40),
  lastName: z.string().min(2).max(40),
  displayName: z.string().min(3).max(60),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
});

export const passwordSchema = z.object({
  current: z.string().min(1, "Enter current password"),
  next: z.string()
    .min(SETTINGS_CONFIG.passwordMin, `Minimum ${SETTINGS_CONFIG.passwordMin} characters`)
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[0-9]/, "Needs a number")
    .regex(/[^A-Za-z0-9]/, "Needs a special character"),
  confirm: z.string().min(1),
}).refine((d) => d.next === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export const kycSchema = z.object({
  legalName: z.string().min(3).max(80),
  businessName: z.string().min(3).max(80),
  businessType: z.string().min(3),
  country: z.string().min(2),
  regNumber: z.string().min(3).max(40),
  docType: z.string().min(2),
  docNumber: z.string().min(3).max(40),
});
