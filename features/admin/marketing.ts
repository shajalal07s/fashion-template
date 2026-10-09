export type MktStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "expired"
  | "completed"
  | "disabled"
  | "cancelled"
  | "sending"
  | "sent";

export type CouponKind = "percentage" | "fixed" | "shipping" | "bogo";

export interface MktCoupon {
  id: string;
  code: string;
  name: string;
  description: string;
  kind: CouponKind;
  value: number;
  maxDiscount: number;
  minSpend: number;
  limit: number;
  perCustomer: number;
  used: number;
  scope: string;
  audience: string;
  start: string;
  end: string;
  status: MktStatus;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  join: "AND" | "OR";
}

export interface DiscountRule {
  id: string;
  name: string;
  type: string;
  conditions: RuleCondition[];
  discount: string;
  products: number;
  customers: string;
  start: string;
  end: string;
  priority: number;
  status: MktStatus;
}

export interface FlashProduct {
  id: string;
  product: string;
  image: string;
  regular: number;
  discount: number;
  stock: number;
  sold: number;
  status: MktStatus;
}

export interface FlashSale {
  id: string;
  name: string;
  description: string;
  discount: string;
  start: string;
  end: string;
  endsAt: number;
  maxQty: number;
  sales: number;
  status: MktStatus;
  products: FlashProduct[];
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  products: number;
  vendors: number;
  budget: number;
  revenue: number;
  orders: number;
  discount: number;
  conversion: number;
  impressions: number;
  clicks: number;
  start: string;
  end: string;
  status: MktStatus;
}

export interface Promotion {
  id: string;
  name: string;
  type: string;
  discount: string;
  target: string;
  orders: number;
  revenue: number;
  used: number;
  limit: number;
  start: string;
  end: string;
  status: MktStatus;
}

export interface ProductOffer {
  id: string;
  product: string;
  image: string;
  vendor: string;
  regular: number;
  offer: number;
  stock: number;
  start: string;
  end: string;
  status: MktStatus;
}

export interface VendorOffer {
  id: string;
  vendor: string;
  store: string;
  offer: string;
  type: string;
  discount: string;
  products: number;
  orders: number;
  revenue: number;
  start: string;
  end: string;
  status: MktStatus;
}

export type BannerPosition =
  | "hero"
  | "secondary"
  | "shop"
  | "category"
  | "flash"
  | "campaign"
  | "product"
  | "store"
  | "popup";

export interface Banner {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  position: BannerPosition;
  device: string;
  image: string;
  start: string;
  end: string;
  clicks: number;
  impressions: number;
  status: MktStatus;
}

export interface FeaturedProduct {
  id: string;
  product: string;
  image: string;
  vendor: string;
  category: string;
  price: number;
  position: number;
  section: string;
  start: string;
  end: string;
  status: MktStatus;
}

export type SubscriberStatus = "subscribed" | "unsubscribed" | "pending" | "bounced";

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  subscribed: string;
  lastEmail: string;
}

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  sent: number;
  openRate: number;
  clickRate: number;
  date: string;
  status: MktStatus;
}

export interface MktActivity {
  id: string;
  event: string;
  description: string;
  user: string;
  date: string;
  time: string;
}

export const demoCoupons: MktCoupon[] = [
  { id: "mc1", code: "SAVE20", name: "Mega Save 20", description: "Sitewide 20% off for Eid campaign.", kind: "percentage", value: 20, maxDiscount: 500, minSpend: 1000, limit: 2000, perCustomer: 2, used: 1342, status: "active", scope: "All Products", audience: "All Customers", start: "2026-09-01", end: "2026-09-30" },
  { id: "mc2", code: "FLAT150", name: "Flat ৳150 Off", description: "Flat discount on orders above ৳2000.", kind: "fixed", value: 150, maxDiscount: 150, minSpend: 2000, limit: 1000, perCustomer: 1, used: 486, status: "active", scope: "Selected Categories", audience: "All Customers", start: "2026-09-10", end: "2026-10-10" },
  { id: "mc3", code: "FREESHIP", name: "Free Delivery", description: "Free delivery on all orders.", kind: "shipping", value: 0, maxDiscount: 120, minSpend: 500, limit: 5000, perCustomer: 5, used: 3210, status: "active", scope: "All Products", audience: "New Customers", start: "2026-08-01", end: "2026-12-31" },
  { id: "mc4", code: "BOGO-PUJA", name: "Puja BOGO", description: "Buy one get one on Punjabi collection.", kind: "bogo", value: 100, maxDiscount: 3490, minSpend: 0, limit: 500, perCustomer: 1, used: 0, status: "scheduled", scope: "Selected Products", audience: "All Customers", start: "2026-10-01", end: "2026-10-15" },
  { id: "mc5", code: "WELCOME10", name: "Welcome 10%", description: "First order discount for new shoppers.", kind: "percentage", value: 10, maxDiscount: 300, minSpend: 800, limit: 3000, perCustomer: 1, used: 2980, status: "expired", scope: "All Products", audience: "New Customers", start: "2026-06-01", end: "2026-08-31" },
  { id: "mc6", code: "VIP25", name: "VIP 25% Off", description: "Loyalty reward for top spenders.", kind: "percentage", value: 25, maxDiscount: 1000, minSpend: 3000, limit: 200, perCustomer: 1, used: 45, status: "paused", scope: "Selected Vendors", audience: "VIP Group", start: "2026-09-01", end: "2026-11-30" },
];

export const demoDiscountRules: DiscountRule[] = [
  { id: "dr1", name: "Big Cart 15% Off", type: "Percentage", conditions: [{ id: "c1", field: "Cart Subtotal", operator: "is greater than", value: "৳2000", join: "AND" }, { id: "c2", field: "Customer Type", operator: "is", value: "Returning Customer", join: "AND" }], discount: "15%", products: 240, customers: "Returning", start: "2026-09-01", end: "2026-09-30", priority: 1, status: "active" },
  { id: "dr2", name: "First Order Free Ship", type: "Free Shipping", conditions: [{ id: "c1", field: "Customer Type", operator: "is", value: "First Order", join: "AND" }], discount: "Free Ship", products: 400, customers: "New", start: "2026-01-01", end: "2026-12-31", priority: 2, status: "active" },
  { id: "dr3", name: "BOGO Saree Fest", type: "Buy X Get Y", conditions: [{ id: "c1", field: "Category", operator: "is", value: "Saree", join: "AND" }, { id: "c2", field: "Cart Quantity", operator: "is at least", value: "2", join: "OR" }], discount: "BOGO", products: 42, customers: "All", start: "2026-10-01", end: "2026-10-20", priority: 3, status: "scheduled" },
  { id: "dr4", name: "Tiered Bulk Saver", type: "Tiered Discount", conditions: [{ id: "c1", field: "Cart Quantity", operator: "is at least", value: "5", join: "AND" }], discount: "5-20%", products: 120, customers: "Wholesale", start: "2026-08-01", end: "2026-09-15", priority: 4, status: "expired" },
  { id: "dr5", name: "Weekend Flash 10%", type: "Quantity Discount", conditions: [{ id: "c1", field: "Specific Date", operator: "is", value: "Fri-Sun", join: "AND" }], discount: "10%", products: 180, customers: "All", start: "2026-09-01", end: "2026-12-31", priority: 5, status: "paused" },
];

export const demoFlashSales: FlashSale[] = [
  {
    id: "fs1", name: "Midnight Mega Sale", description: "Up to 50% off top fashion picks.", discount: "Up to 50%",
    start: "2026-09-24", end: "2026-09-27", endsAt: Date.now() + 1000 * 60 * 60 * 38 + 1000 * 60 * 14,
    maxQty: 1000, sales: 342000, status: "active",
    products: [
      { id: "fp1", product: "Printed Kurti - Red", image: "/images/women/women-1.jpg", regular: 2450, discount: 30, stock: 120, sold: 86, status: "active" },
      { id: "fp2", product: "Classic Panjabi - White", image: "/images/men/men-1.jpg", regular: 3490, discount: 25, stock: 80, sold: 41, status: "active" },
      { id: "fp3", product: "Silk Saree - Green", image: "/images/women/women-2.jpg", regular: 6850, discount: 20, stock: 45, sold: 12, status: "active" },
    ],
  },
  {
    id: "fs2", name: "Puja Dhamaka", description: "Festive deals across all stores.", discount: "Up to 40%",
    start: "2026-10-01", end: "2026-10-10", endsAt: Date.now() + 1000 * 60 * 60 * 24 * 6,
    maxQty: 2000, sales: 0, status: "scheduled",
    products: [
      { id: "fp4", product: "Kids Eid Set", image: "/images/kids/kids-1.jpg", regular: 1890, discount: 35, stock: 200, sold: 0, status: "scheduled" },
      { id: "fp5", product: "Cotton Three-Piece", image: "/images/women/women-3.jpg", regular: 3250, discount: 30, stock: 150, sold: 0, status: "scheduled" },
    ],
  },
  {
    id: "fs3", name: "Eid Clearance", description: "Clearance up to 70% off.", discount: "Up to 70%",
    start: "2026-06-01", end: "2026-06-10", endsAt: Date.now() - 1000 * 60 * 60 * 24 * 80,
    maxQty: 1500, sales: 890000, status: "completed",
    products: [
      { id: "fp6", product: "Denim Shirt - Blue", image: "/images/men/men-2.jpg", regular: 1990, discount: 50, stock: 0, sold: 210, status: "expired" },
    ],
  },
];

export const demoCampaigns: Campaign[] = [
  { id: "cp1", name: "Eid Mega Campaign", type: "Seasonal", products: 120, vendors: 24, budget: 500000, revenue: 2450000, orders: 1840, discount: 386000, conversion: 4.8, impressions: 840000, clicks: 62000, start: "2026-09-01", end: "2026-09-30", status: "active" },
  { id: "cp2", name: "Puja Collection Launch", type: "Product Launch", products: 60, vendors: 12, budget: 200000, revenue: 480000, orders: 320, discount: 72000, conversion: 3.1, impressions: 310000, clicks: 18500, start: "2026-10-01", end: "2026-10-20", status: "scheduled" },
  { id: "cp3", name: "Winter Clearance", type: "Clearance", products: 200, vendors: 30, budget: 150000, revenue: 1120000, orders: 940, discount: 224000, conversion: 5.6, impressions: 420000, clicks: 38000, start: "2026-01-05", end: "2026-01-25", status: "completed" },
  { id: "cp4", name: "Karim Wholesale Push", type: "Vendor", products: 45, vendors: 1, budget: 80000, revenue: 360000, orders: 210, discount: 41000, conversion: 2.4, impressions: 150000, clicks: 9200, start: "2026-09-10", end: "2026-10-10", status: "paused" },
  { id: "cp5", name: "New Year Teaser", type: "Custom", products: 30, vendors: 8, budget: 50000, revenue: 0, orders: 0, discount: 0, conversion: 0, impressions: 0, clicks: 0, start: "2026-12-20", end: "2026-12-31", status: "draft" },
];

export const demoPromotions: Promotion[] = [
  { id: "pm1", name: "Weekend 20% Off", type: "Percentage", discount: "20%", target: "Selected Products", orders: 640, revenue: 820000, used: 640, limit: 2000, start: "2026-09-01", end: "2026-09-30", status: "active" },
  { id: "pm2", name: "Free Delivery Week", type: "Free Shipping", discount: "Free Ship", target: "All Orders", orders: 2100, revenue: 1950000, used: 2100, limit: 5000, start: "2026-09-15", end: "2026-09-22", status: "active" },
  { id: "pm3", name: "New Customer ৳200", type: "Fixed", discount: "৳200", target: "New Customers", orders: 380, revenue: 410000, used: 380, limit: 1000, start: "2026-09-01", end: "2026-12-31", status: "scheduled" },
  { id: "pm4", name: "Bundle: Kurti + Hijab", type: "Bundle", discount: "15%", target: "Bundle", orders: 190, revenue: 260000, used: 190, limit: 500, start: "2026-08-01", end: "2026-08-31", status: "expired" },
  { id: "pm5", name: "Loyal 25% Back", type: "Percentage", discount: "25%", target: "Returning", orders: 0, revenue: 0, used: 0, limit: 300, start: "2026-10-05", end: "2026-10-31", status: "draft" },
];

export const demoProductOffers: ProductOffer[] = [
  { id: "po1", product: "Printed Kurti - Red", image: "/images/women/women-1.jpg", vendor: "Ayesha Boutique", regular: 2450, offer: 1960, stock: 120, start: "2026-09-20", end: "2026-09-30", status: "active" },
  { id: "po2", product: "Silk Saree - Green", image: "/images/women/women-2.jpg", vendor: "Nusrat Fashion", regular: 6850, offer: 5480, stock: 45, start: "2026-09-20", end: "2026-10-05", status: "active" },
  { id: "po3", product: "Classic Panjabi - White", image: "/images/men/men-1.jpg", vendor: "TH Lifestyle", regular: 3490, offer: 2792, stock: 80, start: "2026-10-01", end: "2026-10-15", status: "scheduled" },
  { id: "po4", product: "Kids Eid Set", image: "/images/kids/kids-1.jpg", vendor: "Sadia Kids", regular: 1890, offer: 1512, stock: 200, start: "2026-08-01", end: "2026-08-20", status: "expired" },
  { id: "po5", product: "Denim Shirt - Blue", image: "/images/men/men-2.jpg", vendor: "Karim Wholesale", regular: 1990, offer: 1592, stock: 60, start: "2026-09-01", end: "2026-09-30", status: "paused" },
];

export const demoVendorOffers: VendorOffer[] = [
  { id: "vo1", vendor: "Ayesha Rahman", store: "Ayesha Boutique", offer: "Boutique Fest 20%", type: "Percentage", discount: "20%", products: 40, orders: 320, revenue: 540000, start: "2026-09-01", end: "2026-09-30", status: "active" },
  { id: "vo2", vendor: "Karim Traders", store: "Karim Wholesale", offer: "Wholesale Bulk 12%", type: "Percentage", discount: "12%", products: 85, orders: 410, revenue: 980000, start: "2026-09-10", end: "2026-10-31", status: "active" },
  { id: "vo3", vendor: "Nusrat Jahan", store: "Nusrat Fashion", offer: "Saree Week BOGO", type: "BOGO", discount: "BOGO", products: 22, orders: 0, revenue: 0, start: "2026-10-01", end: "2026-10-10", status: "scheduled" },
  { id: "vo4", vendor: "Sadia Afrin", store: "Sadia Kids", offer: "Kids Flat ৳200", type: "Fixed", discount: "৳200", products: 30, orders: 150, revenue: 210000, start: "2026-07-01", end: "2026-08-31", status: "expired" },
];

export const demoBanners: Banner[] = [
  { id: "bn1", name: "Eid Hero", title: "Eid Collection 2026", subtitle: "Up to 50% off festive wear", cta: "Shop Now", link: "/women", position: "hero", device: "Both", image: "/images/Banner/banne1.png", start: "2026-09-01", end: "2026-09-30", clicks: 18400, impressions: 320000, status: "active" },
  { id: "bn2", name: "Flash Strip", title: "Midnight Mega Sale", subtitle: "Ends in hours — hurry!", cta: "Grab Deals", link: "/flash", position: "flash", device: "Mobile", image: "/images/Banner/banner2.png", start: "2026-09-24", end: "2026-09-27", clicks: 9200, impressions: 140000, status: "active" },
  { id: "bn3", name: "Puja Popup", title: "Puja Dhamaka", subtitle: "Festive deals are coming", cta: "Notify Me", link: "/campaigns", position: "popup", device: "Desktop", image: "/images/Banner/banner3.png", start: "2026-10-01", end: "2026-10-10", clicks: 0, impressions: 0, status: "scheduled" },
  { id: "bn4", name: "Winter Shop", title: "Winter Clearance", subtitle: "Up to 70% off", cta: "Shop Now", link: "/men", position: "shop", device: "Both", image: "/images/Banner/banner2.png", start: "2026-01-05", end: "2026-01-25", clicks: 22100, impressions: 410000, status: "expired" },
];

export const demoFeatured: FeaturedProduct[] = [
  { id: "ft1", product: "Printed Kurti - Red", image: "/images/women/women-1.jpg", vendor: "Ayesha Boutique", category: "Women", price: 2450, position: 1, section: "Homepage Featured", start: "2026-09-01", end: "2026-09-30", status: "active" },
  { id: "ft2", product: "Silk Saree - Green", image: "/images/women/women-2.jpg", vendor: "Nusrat Fashion", category: "Saree", price: 6850, position: 2, section: "Best Sellers", start: "2026-09-01", end: "2026-09-30", status: "active" },
  { id: "ft3", product: "Classic Panjabi - White", image: "/images/men/men-1.jpg", vendor: "TH Lifestyle", category: "Panjabi", price: 3490, position: 3, section: "Trending Products", start: "2026-10-01", end: "2026-10-31", status: "scheduled" },
  { id: "ft4", product: "Kids Eid Set", image: "/images/kids/kids-1.jpg", vendor: "Sadia Kids", category: "Kids", price: 1890, position: 4, section: "New Arrivals", start: "2026-08-01", end: "2026-08-31", status: "expired" },
  { id: "ft5", product: "Denim Shirt - Blue", image: "/images/men/men-2.jpg", vendor: "Karim Wholesale", category: "Men", price: 1990, position: 5, section: "Editor's Choice", start: "2026-09-10", end: "2026-10-10", status: "active" },
];

export const demoSubscribers: Subscriber[] = [
  { id: "sb1", name: "Ayesha Rahman", email: "ayesha@mail.com", status: "subscribed", source: "Checkout", subscribed: "2026-08-12", lastEmail: "2026-09-20" },
  { id: "sb2", name: "Karim Uddin", email: "karim@mail.com", status: "subscribed", source: "Popup", subscribed: "2026-07-30", lastEmail: "2026-09-20" },
  { id: "sb3", name: "Nusrat J", email: "nusrat@mail.com", status: "unsubscribed", source: "Footer", subscribed: "2026-06-18", lastEmail: "2026-08-15" },
  { id: "sb4", name: "Tanvir H", email: "tanvir@mail.com", status: "pending", source: "Checkout", subscribed: "2026-09-22", lastEmail: "—" },
  { id: "sb5", name: "Sadia A", email: "sadia@mail.com", status: "bounced", source: "Import", subscribed: "2026-05-11", lastEmail: "2026-07-01" },
  { id: "sb6", name: "Rahim U", email: "rahim@mail.com", status: "subscribed", source: "Popup", subscribed: "2026-09-05", lastEmail: "2026-09-20" },
];

export const demoNewsletters: NewsletterCampaign[] = [
  { id: "nl1", name: "Eid Lookbook", subject: "Eid styles just dropped ✨", recipients: 32000, sent: 31800, openRate: 42, clickRate: 8.4, date: "2026-09-20", status: "sent" },
  { id: "nl2", name: "Flash Alert", subject: "Midnight sale starts tonight", recipients: 28500, sent: 0, openRate: 0, clickRate: 0, date: "2026-09-24", status: "scheduled" },
  { id: "nl3", name: "Welcome Series", subject: "Welcome! Here's 10% off", recipients: 1200, sent: 0, openRate: 0, clickRate: 0, date: "2026-09-18", status: "draft" },
  { id: "nl4", name: "Puja Teaser", subject: "Something festive is coming", recipients: 30000, sent: 0, openRate: 0, clickRate: 0, date: "2026-09-28", status: "paused" },
];

export const demoMktActivity: MktActivity[] = [
  { id: "ma1", event: "Campaign created", description: "Puja Collection Launch was created", user: "Admin", date: "2026-09-22", time: "10:20 AM" },
  { id: "ma2", event: "Coupon created", description: "SAVE20 generated with 2000 limit", user: "Admin", date: "2026-09-21", time: "03:45 PM" },
  { id: "ma3", event: "Flash sale started", description: "Midnight Mega Sale went live", user: "System", date: "2026-09-24", time: "12:00 AM" },
  { id: "ma4", event: "Promotion activated", description: "Weekend 20% Off is now active", user: "Admin", date: "2026-09-20", time: "09:10 AM" },
  { id: "ma5", event: "Banner published", description: "Eid Hero published to homepage", user: "Admin", date: "2026-09-19", time: "01:30 PM" },
  { id: "ma6", event: "Product featured", description: "Silk Saree added to Best Sellers", user: "Admin", date: "2026-09-18", time: "11:05 AM" },
  { id: "ma7", event: "Newsletter sent", description: "Eid Lookbook sent to 31,800 subscribers", user: "System", date: "2026-09-20", time: "08:00 AM" },
];

export function couponValueLabel(c: MktCoupon): string {
  if (c.kind === "percentage") return `${c.value}%`;
  if (c.kind === "fixed") return `৳${c.value}`;
  if (c.kind === "shipping") return "Free Ship";
  return "BOGO";
}

export function salePrice(regular: number, discount: number): number {
  return Math.round(regular * (1 - discount / 100));
}
