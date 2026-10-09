import { z } from "zod";

export type CouponType =
  | "percent" | "fixed" | "shipping" | "bogo" | "product" | "category" | "minOrder";

export type CouponStatus =
  | "draft" | "scheduled" | "active" | "paused" | "expired" | "disabled";

export interface VendorCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  perCustomer: number;
  used: number;
  start: string;
  expiry: string;
  scope: string;
  products: string[];
  categories: string[];
  audience: "all" | "new" | "existing";
  stackable: boolean;
  status: CouponStatus;
  revenue: number;
  discountGiven: number;
  orders: number;
  updated: string;
}

export const COUPON_TYPES: Array<{ value: CouponType; hint: string }> = [
  { value: "percent", hint: "Percentage off" },
  { value: "fixed", hint: "Fixed BDT off" },
  { value: "shipping", hint: "Free shipping" },
  { value: "bogo", hint: "Buy X Get Y" },
  { value: "product", hint: "Product-specific" },
  { value: "category", hint: "Category-specific" },
  { value: "minOrder", hint: "Minimum order" },
];

export const demoVendorCoupons: VendorCoupon[] = [
  {
    id: "vc-1", code: "AYESHA10", name: "Festive 10% Off", description: "10% off kurtis, up to ৳1,000.",
    type: "percent", value: 10, minOrder: 1500, maxDiscount: 1000,
    usageLimit: 500, perCustomer: 2, used: 186, start: "2026-09-01", expiry: "2026-10-31",
    scope: "Selected Products", products: ["Printed Kurti - Red"], categories: ["Women"],
    audience: "all", stackable: false, status: "active",
    revenue: 184500, discountGiven: 18450, orders: 96, updated: "2026-09-24",
  },
  {
    id: "vc-2", code: "FLAT500", name: "Flat 500 Saree Deal", description: "৳500 off silk sarees over ৳5,000.",
    type: "fixed", value: 500, minOrder: 5000, maxDiscount: 500,
    usageLimit: 200, perCustomer: 1, used: 74, start: "2026-09-10", expiry: "2026-09-30",
    scope: "Selected Categories", products: [], categories: ["Saree"],
    audience: "existing", stackable: false, status: "active",
    revenue: 148000, discountGiven: 37000, orders: 74, updated: "2026-09-22",
  },
  {
    id: "vc-3", code: "FREESHIP", name: "Free Dhaka Delivery", description: "Free standard shipping inside Dhaka.",
    type: "shipping", value: 60, minOrder: 1000, maxDiscount: 60,
    usageLimit: 1000, perCustomer: 5, used: 312, start: "2026-09-01", expiry: "2026-12-31",
    scope: "All Products", products: [], categories: [],
    audience: "all", stackable: true, status: "scheduled",
    revenue: 96000, discountGiven: 18720, orders: 312, updated: "2026-09-20",
  },
  {
    id: "vc-4", code: "EID20X7", name: "Eid Pre-Sale", description: "Expired Eid campaign code.",
    type: "percent", value: 20, minOrder: 2000, maxDiscount: 1500,
    usageLimit: 300, perCustomer: 1, used: 300, start: "2026-06-01", expiry: "2026-06-15",
    scope: "All Products", products: [], categories: [],
    audience: "all", stackable: false, status: "expired",
    revenue: 210000, discountGiven: 42000, orders: 158, updated: "2026-06-15",
  },
];

export const couponSchema = z.object({
  code: z.string().min(4).max(20).regex(/^[A-Z0-9]+$/, "Uppercase letters/numbers only"),
  name: z.string().min(3).max(60),
  description: z.string().max(200).optional(),
  type: z.enum(["percent", "fixed", "shipping", "bogo", "product", "category", "minOrder"]),
  value: z.number().min(1, "Value must be positive"),
  minOrder: z.number().min(0),
  maxDiscount: z.number().min(0),
  usageLimit: z.number().min(1),
  perCustomer: z.number().min(1),
  start: z.string().min(1),
  expiry: z.string().min(1),
  audience: z.enum(["all", "new", "existing"]),
  stackable: z.boolean(),
});

export type CouponInput = z.infer<typeof couponSchema>;

export function generateCouponCode(prefix = "SAVE"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${tail}`;
}

export interface ProductDiscount {
  id: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  dtype: "percent" | "fixed";
  dvalue: number;
  salePrice: number;
  start: string;
  end: string;
  status: "active" | "scheduled" | "expired" | "paused";
  sales: number;
}

export const demoProductDiscounts: ProductDiscount[] = [
  { id: "pd-1", productId: "vp1", name: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", price: 2450, dtype: "percent", dvalue: 20, salePrice: 1960, start: "2026-09-20", end: "2026-09-30", status: "active", sales: 42 },
  { id: "pd-2", productId: "vp3", name: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", price: 6850, dtype: "percent", dvalue: 10, salePrice: 6165, start: "2026-09-01", end: "2026-09-30", status: "active", sales: 18 },
  { id: "pd-3", productId: "vp5", name: "Georgette Hijab Set", sku: "W-HJB-006", image: "/images/women/women-11.jpg", price: 1290, dtype: "fixed", dvalue: 200, salePrice: 1090, start: "2026-10-01", end: "2026-10-15", status: "scheduled", sales: 0 },
];

export interface FlashSale {
  id: string;
  name: string;
  banner: string;
  start: string;
  end: string;
  products: number;
  discount: string;
  sales: number;
  revenue: number;
  status: "upcoming" | "live" | "ending" | "completed" | "cancelled";
}

export const demoFlashSales: FlashSale[] = [
  { id: "fs-1", name: "Weekend Kurti Rush", banner: "/images/Banner/banner-1.jpg", start: "2026-09-27", end: "2026-09-28", products: 6, discount: "Up to 30%", sales: 84, revenue: 168000, status: "live" },
  { id: "fs-2", name: "Saree Fest", banner: "/images/Banner/banner-2.jpg", start: "2026-10-03", end: "2026-10-05", products: 4, discount: "Up to 25%", sales: 0, revenue: 0, status: "upcoming" },
  { id: "fs-3", name: "Monsoon Clearance", banner: "/images/Banner/banner-3.jpg", start: "2026-08-10", end: "2026-08-12", products: 9, discount: "Up to 40%", sales: 210, revenue: 320000, status: "completed" },
];

export interface Campaign {
  id: string;
  name: string;
  banner: string;
  description: string;
  start: string;
  end: string;
  deadline: string;
  requiredDiscount: number;
  status: "open" | "applied" | "review" | "approved" | "rejected" | "active" | "completed";
  products: number;
  note: string;
}

export const demoCampaigns: Campaign[] = [
  {
    id: "cp-1", name: "Autumn Fashion Week", banner: "/images/Banner/banner-1.jpg",
    description: "Platform-wide festive campaign. Minimum 15% discount on apparel.",
    start: "2026-10-01", end: "2026-10-07", deadline: "2026-09-28", requiredDiscount: 15,
    status: "open", products: 0, note: "",
  },
  {
    id: "cp-2", name: "Saree Celebration", banner: "/images/Banner/banner-2.jpg",
    description: "Silk and cotton saree showcase with reduced commission.",
    start: "2026-09-20", end: "2026-09-30", deadline: "2026-09-18", requiredDiscount: 10,
    status: "approved", products: 2, note: "2 products approved.",
  },
  {
    id: "cp-3", name: "Mega 11.11", banner: "/images/Banner/banner-3.jpg",
    description: "Annual mega sale event.",
    start: "2026-11-11", end: "2026-11-13", deadline: "2026-11-05", requiredDiscount: 20,
    status: "applied", products: 3, note: "Under review.",
  },
];

export function couponConversion(c: VendorCoupon): number {
  return c.used > 0 ? Math.round((c.orders / c.used) * 1000) / 10 : 0;
}
