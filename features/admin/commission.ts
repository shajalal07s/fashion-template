export type CommissionType = "percentage" | "fixed" | "mixed";
export type RuleScope = "global" | "vendor" | "category" | "product";
export type CommissionStatus =
  | "pending"
  | "approved"
  | "paid"
  | "refunded"
  | "reversed"
  | "cancelled"
  | "adjusted";

export interface VendorCommission {
  id: string;
  vendor: string;
  store: string;
  email: string;
  sales: number;
  rate: number;
  rateType: CommissionType;
  fixed: number;
  earned: number;
  pending: number;
  paid: number;
  refunded: number;
  status: "active" | "inactive";
  activeRule: RuleScope;
}

export interface CategoryCommission {
  id: string;
  category: string;
  parent: string;
  products: number;
  vendors: number;
  type: CommissionType;
  rate: number;
  fixed: number;
  priority: number;
  status: "active" | "inactive";
  effective: string;
}

export interface ProductCommission {
  id: string;
  product: string;
  sku: string;
  vendor: string;
  category: string;
  price: number;
  image: string;
  type: CommissionType;
  rate: number;
  amount: number;
  status: "active" | "inactive";
}

export interface CommissionRule {
  id: string;
  name: string;
  scope: RuleScope;
  type: CommissionType;
  rate: number;
  fixed: number;
  priority: number;
  start: string;
  end: string;
  status: "active" | "inactive";
}

export interface TimelineEvent {
  event: string;
  date: string;
  time: string;
  user: string;
  description: string;
}

export interface CommissionTx {
  id: string;
  orderId: string;
  vendor: string;
  product: string;
  sku: string;
  category: string;
  gross: number;
  discount: number;
  commissionable: number;
  rate: number;
  commission: number;
  earning: number;
  status: CommissionStatus;
  date: string;
  rule: string;
  ruleScope: RuleScope;
  timeline: TimelineEvent[];
}

export interface Adjustment {
  id: string;
  txId: string;
  vendor: string;
  original: number;
  delta: number;
  final: number;
  reason: string;
  by: string;
  date: string;
  status: "approved" | "pending" | "rejected";
}

export interface Reversal {
  id: string;
  txId: string;
  orderId: string;
  vendor: string;
  original: number;
  refund: number;
  reversed: number;
  remaining: number;
  type: "full_refund" | "partial_refund" | "full_reversal" | "partial_reversal";
  status: "completed" | "pending" | "failed";
  date: string;
  reason: string;
}

export interface CommissionSettings {
  enabled: boolean;
  defaultType: CommissionType;
  defaultRate: number;
  currency: string;
  base: string;
  includeTax: boolean;
  includeShipping: boolean;
  includeDiscount: boolean;
  includeCoupon: boolean;
  includeFees: boolean;
  autoReversal: boolean;
  partialHandling: string;
  holdDays: string;
  minPayout: number;
  payoutSchedule: string;
  payoutHold: number;
  precision: string;
  rounding: string;
  notifyVendor: boolean;
  notifyAdmin: boolean;
  notifyPayout: boolean;
}

export const demoVendors: VendorCommission[] = [
  { id: "v1", vendor: "Ayesha Rahman", store: "Ayesha Boutique", email: "ayesha@store.com", sales: 486000, rate: 10, rateType: "percentage", fixed: 0, earned: 48600, pending: 8200, paid: 38400, refunded: 2000, status: "active", activeRule: "vendor" },
  { id: "v2", vendor: "Karim Traders", store: "Karim Wholesale", email: "karim@traders.com", sales: 920000, rate: 8, rateType: "percentage", fixed: 0, earned: 73600, pending: 12400, paid: 58200, refunded: 3000, status: "active", activeRule: "vendor" },
  { id: "v3", vendor: "Nusrat Jahan", store: "Nusrat Fashion", email: "nusrat@fashion.com", sales: 315000, rate: 12, rateType: "percentage", fixed: 0, earned: 37800, pending: 5400, paid: 30200, refunded: 2200, status: "active", activeRule: "category" },
  { id: "v4", vendor: "Tanvir Hasan", store: "TH Lifestyle", email: "tanvir@th.com", sales: 268000, rate: 50, rateType: "fixed", fixed: 50, earned: 18400, pending: 3100, paid: 14200, refunded: 1100, status: "active", activeRule: "product" },
  { id: "v5", vendor: "Dhaka Boutique", store: "Dhaka Boutique", email: "info@dhakaboutique.com", sales: 745000, rate: 9, rateType: "percentage", fixed: 0, earned: 67050, pending: 9800, paid: 54250, refunded: 3000, status: "active", activeRule: "global" },
  { id: "v6", vendor: "Sadia Afrin", store: "Sadia Kids", email: "sadia@kids.com", sales: 192000, rate: 11, rateType: "percentage", fixed: 0, earned: 21120, pending: 2600, paid: 17300, refunded: 1220, status: "inactive", activeRule: "global" },
  { id: "v7", vendor: "Rahim Uddin", store: "RU Electronics", email: "rahim@ru.com", sales: 534000, rate: 7, rateType: "mixed", fixed: 20, earned: 41200, pending: 7100, paid: 32100, refunded: 2000, status: "active", activeRule: "vendor" },
  { id: "v8", vendor: "Jannatul Ferdous", store: "JF Accessories", email: "jannatul@jf.com", sales: 148000, rate: 12, rateType: "percentage", fixed: 0, earned: 17760, pending: 1900, paid: 14900, refunded: 960, status: "active", activeRule: "category" },
];

export const demoCategories: CategoryCommission[] = [
  { id: "c1", category: "Women", parent: "—", products: 124, vendors: 18, type: "percentage", rate: 12, fixed: 0, priority: 3, status: "active", effective: "2026-01-01" },
  { id: "c2", category: "Men", parent: "—", products: 86, vendors: 12, type: "percentage", rate: 10, fixed: 0, priority: 3, status: "active", effective: "2026-01-01" },
  { id: "c3", category: "Kids", parent: "—", products: 54, vendors: 8, type: "percentage", rate: 11, fixed: 0, priority: 3, status: "active", effective: "2026-03-01" },
  { id: "c4", category: "Saree", parent: "Women", products: 42, vendors: 9, type: "percentage", rate: 14, fixed: 0, priority: 3, status: "active", effective: "2026-06-01" },
  { id: "c5", category: "Panjabi", parent: "Men", products: 38, vendors: 7, type: "mixed", rate: 8, fixed: 30, priority: 3, status: "active", effective: "2026-06-01" },
  { id: "c6", category: "Accessories", parent: "—", products: 67, vendors: 11, type: "fixed", rate: 0, fixed: 40, priority: 3, status: "inactive", effective: "2025-11-01" },
];

export const demoProducts: ProductCommission[] = [
  { id: "p1", product: "Printed Kurti - Red", sku: "W-KUR-001", vendor: "Ayesha Boutique", category: "Women", price: 2450, image: "/images/women/women-1.jpg", type: "percentage", rate: 12, amount: 294, status: "active" },
  { id: "p2", product: "Classic Panjabi - White", sku: "M-PAN-012", vendor: "TH Lifestyle", category: "Panjabi", price: 3490, image: "/images/men/men-1.jpg", type: "fixed", rate: 0, amount: 50, status: "active" },
  { id: "p3", product: "Silk Saree - Green", sku: "W-SAR-008", vendor: "Nusrat Fashion", category: "Saree", price: 6850, image: "/images/women/women-2.jpg", type: "percentage", rate: 14, amount: 959, status: "active" },
  { id: "p4", product: "Kids Eid Set", sku: "K-EID-003", vendor: "Sadia Kids", category: "Kids", price: 1890, image: "/images/kids/kids-1.jpg", type: "percentage", rate: 11, amount: 208, status: "active" },
  { id: "p5", product: "Leather Wallet", sku: "A-WAL-021", vendor: "JF Accessories", category: "Accessories", price: 1290, image: "/images/men/men-10.jpg", type: "fixed", rate: 0, amount: 40, status: "inactive" },
  { id: "p6", product: "Denim Shirt - Blue", sku: "M-SHI-014", vendor: "Karim Wholesale", category: "Men", price: 1990, image: "/images/men/men-2.jpg", type: "mixed", rate: 8, amount: 159, status: "active" },
  { id: "p7", product: "Cotton Three-Piece", sku: "W-3PC-030", vendor: "Dhaka Boutique", category: "Women", price: 3250, image: "/images/women/women-3.jpg", type: "percentage", rate: 9, amount: 293, status: "active" },
  { id: "p8", product: "Baby Frock - Pink", sku: "K-FRK-007", vendor: "Sadia Kids", category: "Kids", price: 1450, image: "/images/kids/kids-2.jpg", type: "percentage", rate: 11, amount: 160, status: "active" },
];

export const demoRules: CommissionRule[] = [
  { id: "r1", name: "Global Standard 10%", scope: "global", type: "percentage", rate: 10, fixed: 0, priority: 4, start: "2026-01-01", end: "2026-12-31", status: "active" },
  { id: "r2", name: "Karim Wholesale 8%", scope: "vendor", type: "percentage", rate: 8, fixed: 0, priority: 2, start: "2026-04-01", end: "2027-03-31", status: "active" },
  { id: "r3", name: "Saree Festive 14%", scope: "category", type: "percentage", rate: 14, fixed: 0, priority: 3, start: "2026-06-01", end: "2026-10-31", status: "active" },
  { id: "r4", name: "Panjabi Flat ৳50", scope: "product", type: "fixed", rate: 0, fixed: 50, priority: 1, start: "2026-01-01", end: "2026-12-31", status: "active" },
  { id: "r5", name: "Accessories Flat ৳40", scope: "category", type: "fixed", rate: 0, fixed: 40, priority: 3, start: "2025-11-01", end: "2026-05-31", status: "inactive" },
  { id: "r6", name: "Electronics 7% + ৳20", scope: "vendor", type: "mixed", rate: 7, fixed: 20, priority: 2, start: "2026-02-01", end: "2026-12-31", status: "active" },
];

const txTimeline = (date: string): TimelineEvent[] => [
  { event: "Commission Created", date, time: "10:24 AM", user: "System", description: "Commission calculated from order totals." },
  { event: "Commission Approved", date, time: "02:15 PM", user: "Admin", description: "Order verified, commission approved." },
  { event: "Commission Available", date, time: "09:00 AM", user: "System", description: "Hold period completed, available for payout." },
  { event: "Commission Paid", date, time: "04:40 PM", user: "Admin", description: "Payout released to vendor wallet." },
];

export const demoTransactions: CommissionTx[] = [
  { id: "TXN-9001", orderId: "ORD-1042", vendor: "Ayesha Boutique", product: "Printed Kurti - Red", sku: "W-KUR-001", category: "Women", gross: 4900, discount: 490, commissionable: 4410, rate: 12, commission: 529, earning: 3881, status: "paid", date: "2026-09-20", rule: "Women 12%", ruleScope: "category", timeline: txTimeline("2026-09-20") },
  { id: "TXN-9002", orderId: "ORD-1041", vendor: "Karim Wholesale", product: "Denim Shirt - Blue", sku: "M-SHI-014", category: "Men", gross: 3980, discount: 0, commissionable: 3980, rate: 8, commission: 318, earning: 3662, status: "approved", date: "2026-09-19", rule: "Karim Wholesale 8%", ruleScope: "vendor", timeline: txTimeline("2026-09-19") },
  { id: "TXN-9003", orderId: "ORD-1040", vendor: "Nusrat Fashion", product: "Silk Saree - Green", sku: "W-SAR-008", category: "Saree", gross: 6850, discount: 685, commissionable: 6165, rate: 14, commission: 863, earning: 5302, status: "pending", date: "2026-09-18", rule: "Saree Festive 14%", ruleScope: "category", timeline: txTimeline("2026-09-18") },
  { id: "TXN-9004", orderId: "ORD-1039", vendor: "TH Lifestyle", product: "Classic Panjabi - White", sku: "M-PAN-012", category: "Panjabi", gross: 3490, discount: 0, commissionable: 3490, rate: 0, commission: 50, earning: 3440, status: "paid", date: "2026-09-17", rule: "Panjabi Flat ৳50", ruleScope: "product", timeline: txTimeline("2026-09-17") },
  { id: "TXN-9005", orderId: "ORD-1038", vendor: "Dhaka Boutique", product: "Cotton Three-Piece", sku: "W-3PC-030", category: "Women", gross: 6500, discount: 650, commissionable: 5850, rate: 9, commission: 527, earning: 5323, status: "paid", date: "2026-09-15", rule: "Global Standard 10%", ruleScope: "global", timeline: txTimeline("2026-09-15") },
  { id: "TXN-9006", orderId: "ORD-1037", vendor: "Sadia Kids", product: "Kids Eid Set", sku: "K-EID-003", category: "Kids", gross: 1890, discount: 0, commissionable: 1890, rate: 11, commission: 208, earning: 1682, status: "refunded", date: "2026-09-14", rule: "Global Standard 10%", ruleScope: "global", timeline: txTimeline("2026-09-14") },
  { id: "TXN-9007", orderId: "ORD-1036", vendor: "JF Accessories", product: "Leather Wallet", sku: "A-WAL-021", category: "Accessories", gross: 1290, discount: 129, commissionable: 1161, rate: 0, commission: 40, earning: 1121, status: "reversed", date: "2026-09-12", rule: "Accessories Flat ৳40", ruleScope: "category", timeline: txTimeline("2026-09-12") },
  { id: "TXN-9008", orderId: "ORD-1035", vendor: "RU Electronics", product: "Denim Shirt - Blue", sku: "M-SHI-014", category: "Men", gross: 3980, discount: 398, commissionable: 3582, rate: 7, commission: 271, earning: 3311, status: "approved", date: "2026-09-11", rule: "Electronics 7% + ৳20", ruleScope: "vendor", timeline: txTimeline("2026-09-11") },
  { id: "TXN-9009", orderId: "ORD-1034", vendor: "Ayesha Boutique", product: "Cotton Three-Piece", sku: "W-3PC-030", category: "Women", gross: 3250, discount: 0, commissionable: 3250, rate: 12, commission: 390, earning: 2860, status: "pending", date: "2026-09-10", rule: "Women 12%", ruleScope: "category", timeline: txTimeline("2026-09-10") },
  { id: "TXN-9010", orderId: "ORD-1033", vendor: "Karim Wholesale", product: "Denim Shirt - Blue", sku: "M-SHI-014", category: "Men", gross: 7960, discount: 796, commissionable: 7164, rate: 8, commission: 573, earning: 6591, status: "paid", date: "2026-09-08", rule: "Karim Wholesale 8%", ruleScope: "vendor", timeline: txTimeline("2026-09-08") },
  { id: "TXN-9011", orderId: "ORD-1032", vendor: "Nusrat Fashion", product: "Silk Saree - Green", sku: "W-SAR-008", category: "Saree", gross: 6850, discount: 0, commissionable: 6850, rate: 14, commission: 959, earning: 5891, status: "adjusted", date: "2026-09-06", rule: "Saree Festive 14%", ruleScope: "category", timeline: txTimeline("2026-09-06") },
  { id: "TXN-9012", orderId: "ORD-1031", vendor: "Sadia Kids", product: "Baby Frock - Pink", sku: "K-FRK-007", category: "Kids", gross: 1450, discount: 0, commissionable: 1450, rate: 11, commission: 160, earning: 1290, status: "cancelled", date: "2026-09-04", rule: "Global Standard 10%", ruleScope: "global", timeline: txTimeline("2026-09-04") },
];

export const demoAdjustments: Adjustment[] = [
  { id: "ADJ-301", txId: "TXN-9011", vendor: "Nusrat Fashion", original: 959, delta: 96, final: 1055, reason: "Festive bonus correction", by: "Admin", date: "2026-09-07", status: "approved" },
  { id: "ADJ-302", txId: "TXN-9003", vendor: "Nusrat Fashion", original: 863, delta: -63, final: 800, reason: "Coupon wrongly excluded", by: "Admin", date: "2026-09-19", status: "pending" },
  { id: "ADJ-303", txId: "TXN-9008", vendor: "RU Electronics", original: 271, delta: 29, final: 300, reason: "Rounding correction", by: "System", date: "2026-09-12", status: "approved" },
  { id: "ADJ-304", txId: "TXN-9005", vendor: "Dhaka Boutique", original: 527, delta: -27, final: 500, reason: "Duplicate charge fix", by: "Admin", date: "2026-09-16", status: "rejected" },
];

export const demoReversals: Reversal[] = [
  { id: "REV-201", txId: "TXN-9006", orderId: "ORD-1037", vendor: "Sadia Kids", original: 208, refund: 1890, reversed: 208, remaining: 0, type: "full_refund", status: "completed", date: "2026-09-15", reason: "Customer returned the full order" },
  { id: "REV-202", txId: "TXN-9007", orderId: "ORD-1036", vendor: "JF Accessories", original: 40, refund: 1290, reversed: 40, remaining: 0, type: "full_reversal", status: "completed", date: "2026-09-13", reason: "Fraudulent order cancelled" },
  { id: "REV-203", txId: "TXN-9002", orderId: "ORD-1041", vendor: "Karim Wholesale", original: 318, refund: 1990, reversed: 159, remaining: 159, type: "partial_refund", status: "pending", date: "2026-09-20", reason: "One item out of two returned" },
  { id: "REV-204", txId: "TXN-9009", orderId: "ORD-1034", vendor: "Ayesha Boutique", original: 390, refund: 3250, reversed: 195, remaining: 195, type: "partial_reversal", status: "pending", date: "2026-09-21", reason: "Size exchange partial reversal" },
];

export const defaultCommissionSettings: CommissionSettings = {
  enabled: true,
  defaultType: "percentage",
  defaultRate: 10,
  currency: "BDT",
  base: "order_subtotal",
  includeTax: false,
  includeShipping: false,
  includeDiscount: true,
  includeCoupon: true,
  includeFees: false,
  autoReversal: true,
  partialHandling: "proportional",
  holdDays: "7",
  minPayout: 1000,
  payoutSchedule: "weekly",
  payoutHold: 3,
  precision: "2",
  rounding: "half_up",
  notifyVendor: true,
  notifyAdmin: true,
  notifyPayout: true,
};

export interface CommissionSummary {
  total: number;
  today: number;
  week: number;
  month: number;
  year: number;
  pending: number;
  approved: number;
  paid: number;
  refunded: number;
  reversed: number;
}

export function commissionSummary(txs: CommissionTx[]): CommissionSummary {
  const sum = (list: CommissionTx[]) => list.reduce((n, x) => n + x.commission, 0);
  const byStatus = (s: CommissionStatus) => sum(txs.filter((x) => x.status === s));
  return {
    total: sum(txs),
    today: sum(txs.filter((x) => x.date === "2026-09-20")),
    week: sum(txs.filter((x) => x.date >= "2026-09-14")),
    month: sum(txs.filter((x) => x.date >= "2026-09-01")),
    year: sum(txs),
    pending: byStatus("pending"),
    approved: byStatus("approved") + byStatus("adjusted"),
    paid: byStatus("paid"),
    refunded: byStatus("refunded"),
    reversed: byStatus("reversed"),
  };
}

export function commissionRevenueRanges(): Record<string, Array<{ x: string; y: number }>> {
  return {
    today: [
      { x: "9AM", y: 420 }, { x: "11AM", y: 863 }, { x: "1PM", y: 529 }, { x: "3PM", y: 318 }, { x: "5PM", y: 573 }, { x: "8PM", y: 390 },
    ],
    "7days": [
      { x: "14", y: 208 }, { x: "15", y: 527 }, { x: "16", y: 0 }, { x: "17", y: 50 }, { x: "18", y: 863 }, { x: "19", y: 318 }, { x: "20", y: 529 },
    ],
    "30days": [
      { x: "W1", y: 1119 }, { x: "W2", y: 1440 }, { x: "W3", y: 798 }, { x: "W4", y: 2495 },
    ],
    "3months": [
      { x: "Jul", y: 12400 }, { x: "Aug", y: 15800 }, { x: "Sep", y: 5888 },
    ],
    "6months": [
      { x: "Apr", y: 9800 }, { x: "May", y: 11200 }, { x: "Jun", y: 13500 }, { x: "Jul", y: 12400 }, { x: "Aug", y: 15800 }, { x: "Sep", y: 5888 },
    ],
    "1year": [
      { x: "Q1", y: 28400 }, { x: "Q2", y: 34500 }, { x: "Q3", y: 34088 }, { x: "Q4", y: 12000 },
    ],
  };
}

export function commissionStatusSlices(txs: CommissionTx[]): Array<{ id: string; label: string; value: number }> {
  const order: CommissionStatus[] = ["pending", "approved", "paid", "refunded", "reversed"];
  return order.map((s) => ({
    id: s,
    label: s,
    value: txs.filter((x) => x.status === s || (s === "approved" && x.status === "adjusted")).reduce((n, x) => n + x.commission, 0),
  }));
}

export function rateLabel(type: CommissionType, rate: number, fixed: number): string {
  if (type === "percentage") return `${rate}%`;
  if (type === "fixed") return `৳${fixed}`;
  return `${rate}% + ৳${fixed}`;
}

export const COMMISSION_BASES = [
  "product_price",
  "product_subtotal",
  "order_subtotal",
  "order_total",
  "item_subtotal",
];

export const PRIORITY_ORDER: Array<{ scope: RuleScope; level: number }> = [
  { scope: "product", level: 1 },
  { scope: "vendor", level: 2 },
  { scope: "category", level: 3 },
  { scope: "global", level: 4 },
];
