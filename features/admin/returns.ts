export type TrackStatus =
  | "processing"
  | "picked"
  | "transit"
  | "out"
  | "delivered"
  | "delayed"
  | "failed"
  | "returned";

export interface TrackEvent {
  status: string;
  location: string;
  date: string;
  time: string;
  description: string;
  done: boolean;
}

export interface Shipment {
  id: string;
  orderId: string;
  tracking: string;
  customer: string;
  vendor: string;
  provider: string;
  method: string;
  origin: string;
  destination: string;
  status: TrackStatus;
  location: string;
  eta: string;
  updated: string;
  amount: number;
  events: TrackEvent[];
}

export type IssueKind = "delayed" | "failed" | "address" | "unavailable" | "damaged" | "exception";
export type IssueStatus = "open" | "investigating" | "resolved";

export interface DeliveryIssue {
  id: string;
  orderId: string;
  tracking: string;
  customer: string;
  vendor: string;
  issue: IssueKind;
  provider: string;
  date: string;
  status: IssueStatus;
}

export type ReturnStatus =
  | "pending"
  | "review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed"
  | "received"
  | "awaiting"
  | "transit"
  | "refund_pending";

export interface ReturnRequest {
  id: string;
  orderId: string;
  customer: string;
  email: string;
  product: string;
  sku: string;
  image: string;
  vendor: string;
  qty: number;
  price: number;
  reason: string;
  condition: string;
  message: string;
  amount: number;
  method: string;
  date: string;
  status: ReturnStatus;
  approvedBy?: string;
  approvedDate?: string;
  rejectReason?: string;
  note?: string;
}

export type RefundStatus =
  | "pending"
  | "review"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "failed"
  | "cancelled";

export interface RefundRequest {
  id: string;
  returnId: string;
  orderId: string;
  customer: string;
  email: string;
  vendor: string;
  requested: number;
  approved: number;
  final: number;
  method: string;
  productAmt: number;
  shipRefund: number;
  taxRefund: number;
  restockFee: number;
  discountAdj: number;
  origPayment: string;
  origTxn: string;
  orderAmount: number;
  date: string;
  completedDate?: string;
  by?: string;
  note?: string;
  status: RefundStatus;
}

export interface ReturnReason {
  id: string;
  name: string;
  description: string;
  category: string;
  usage: number;
  rate: number;
  amount: number;
  status: "active" | "inactive";
  priority: number;
}

export interface ReturnPolicy {
  enabled: boolean;
  windowDays: number;
  refundDays: number;
  exchange: boolean;
  conditions: string[];
  nonReturnable: string[];
  shipPayer: string;
  fullRefund: boolean;
  partialRefund: boolean;
  shipRefund: boolean;
  restockFee: number;
}

const ev = (status: string, location: string, date: string, time: string, description: string, done: boolean): TrackEvent => ({
  status, location, date, time, description, done,
});

export const demoShipments: Shipment[] = [
  {
    id: "SHP-501", orderId: "ORD-1042", tracking: "TRK-20260928-001", customer: "Ayesha Rahman", vendor: "Ayesha Boutique",
    provider: "Pathao", method: "Express Delivery", origin: "Dhaka Hub", destination: "Dhanmondi, Dhaka",
    status: "out", location: "Dhanmondi Hub", eta: "2026-09-26", updated: "2026-09-25 09:40 AM", amount: 4900,
    events: [
      ev("Order Placed", "Online", "2026-09-22", "10:24 AM", "Order confirmed and packed.", true),
      ev("Picked Up", "Gulshan Outlet", "2026-09-23", "02:10 PM", "Rider picked up the parcel.", true),
      ev("Sorting Facility", "Tejgaon Hub", "2026-09-24", "08:00 AM", "Arrived at sorting facility.", true),
      ev("In Transit", "Tejgaon Hub", "2026-09-24", "06:30 PM", "Dispatched toward destination.", true),
      ev("Out for Delivery", "Dhanmondi Hub", "2026-09-25", "09:40 AM", "Rider is on the way.", true),
      ev("Delivered", "Customer Door", "2026-09-26", "—", "Expected delivery.", false),
    ],
  },
  {
    id: "SHP-502", orderId: "ORD-1041", tracking: "TRK-20260928-002", customer: "Karim Uddin", vendor: "Karim Wholesale",
    provider: "Steadfast", method: "Standard Delivery", origin: "Dhaka Hub", destination: "Agrabad, Chattogram",
    status: "transit", location: "Cumilla Hub", eta: "2026-09-28", updated: "2026-09-25 07:15 AM", amount: 3980,
    events: [
      ev("Order Placed", "Online", "2026-09-20", "11:00 AM", "Order confirmed and packed.", true),
      ev("Picked Up", "Karwan Bazar", "2026-09-21", "04:20 PM", "Rider picked up the parcel.", true),
      ev("In Transit", "Cumilla Hub", "2026-09-25", "07:15 AM", "Line-haul in progress.", true),
      ev("Out for Delivery", "Chattogram", "2026-09-28", "—", "Pending dispatch.", false),
      ev("Delivered", "Customer Door", "2026-09-28", "—", "Expected delivery.", false),
    ],
  },
  {
    id: "SHP-503", orderId: "ORD-1040", tracking: "TRK-20260928-003", customer: "Nusrat Jahan", vendor: "Nusrat Fashion",
    provider: "RedX", method: "Standard Delivery", origin: "Dhaka Hub", destination: "Zindabazar, Sylhet",
    status: "delayed", location: "Sylhet Hub", eta: "2026-09-29", updated: "2026-09-24 05:00 PM", amount: 6850,
    events: [
      ev("Order Placed", "Online", "2026-09-18", "09:30 AM", "Order confirmed and packed.", true),
      ev("Picked Up", "Banani Outlet", "2026-09-19", "01:00 PM", "Rider picked up the parcel.", true),
      ev("Delayed", "Sylhet Hub", "2026-09-24", "05:00 PM", "Weather delay, rescheduled.", true),
      ev("Delivered", "Customer Door", "2026-09-29", "—", "Expected delivery.", false),
    ],
  },
  {
    id: "SHP-504", orderId: "ORD-1039", tracking: "TRK-20260928-004", customer: "Tanvir Hasan", vendor: "TH Lifestyle",
    provider: "Pathao", method: "Same Day Delivery", origin: "Dhaka Hub", destination: "Mirpur, Dhaka",
    status: "delivered", location: "Delivered", eta: "2026-09-17", updated: "2026-09-17 06:20 PM", amount: 3490,
    events: [
      ev("Order Placed", "Online", "2026-09-17", "09:00 AM", "Order confirmed and packed.", true),
      ev("Picked Up", "Mirpur Outlet", "2026-09-17", "11:30 AM", "Rider picked up the parcel.", true),
      ev("Out for Delivery", "Mirpur Hub", "2026-09-17", "03:00 PM", "Rider is on the way.", true),
      ev("Delivered", "Customer Door", "2026-09-17", "06:20 PM", "Delivered successfully.", true),
    ],
  },
  {
    id: "SHP-505", orderId: "ORD-1038", tracking: "TRK-20260928-005", customer: "Sadia Afrin", vendor: "Sadia Kids",
    provider: "Steadfast", method: "Standard Delivery", origin: "Dhaka Hub", destination: "Uttara, Dhaka",
    status: "failed", location: "Uttara Hub", eta: "2026-09-16", updated: "2026-09-16 02:10 PM", amount: 1890,
    events: [
      ev("Order Placed", "Online", "2026-09-14", "10:00 AM", "Order confirmed and packed.", true),
      ev("Out for Delivery", "Uttara Hub", "2026-09-16", "11:00 AM", "First attempt.", true),
      ev("Failed", "Uttara Hub", "2026-09-16", "02:10 PM", "Customer unavailable, wrong address.", true),
    ],
  },
  {
    id: "SHP-506", orderId: "ORD-1037", tracking: "TRK-20260928-006", customer: "Rahim Uddin", vendor: "JF Accessories",
    provider: "RedX", method: "Standard Delivery", origin: "Dhaka Hub", destination: "Rajshahi",
    status: "returned", location: "Return Hub", eta: "—", updated: "2026-09-20 10:00 AM", amount: 1290,
    events: [
      ev("Order Placed", "Online", "2026-09-12", "09:00 AM", "Order confirmed and packed.", true),
      ev("In Transit", "Line-haul", "2026-09-14", "08:00 AM", "Dispatched.", true),
      ev("Returned", "Return Hub", "2026-09-20", "10:00 AM", "Customer refused, returning to seller.", true),
    ],
  },
  {
    id: "SHP-507", orderId: "ORD-1036", tracking: "TRK-20260928-007", customer: "Jannatul Ferdous", vendor: "RU Electronics",
    provider: "Pathao", method: "Express Delivery", origin: "Dhaka Hub", destination: "Banani, Dhaka",
    status: "picked", location: "Banani Outlet", eta: "2026-09-27", updated: "2026-09-25 04:30 PM", amount: 3980,
    events: [
      ev("Order Placed", "Online", "2026-09-25", "01:00 PM", "Order confirmed and packed.", true),
      ev("Picked Up", "Banani Outlet", "2026-09-25", "04:30 PM", "Rider picked up the parcel.", true),
      ev("In Transit", "Line-haul", "2026-09-26", "—", "Pending dispatch.", false),
    ],
  },
  {
    id: "SHP-508", orderId: "ORD-1035", tracking: "TRK-20260928-008", customer: "Mim Chowdhury", vendor: "Ayesha Boutique",
    provider: "Steadfast", method: "Standard Delivery", origin: "Dhaka Hub", destination: "Khulna",
    status: "processing", location: "Warehouse", eta: "2026-09-30", updated: "2026-09-25 12:00 PM", amount: 3250,
    events: [ev("Order Placed", "Online", "2026-09-25", "12:00 PM", "Being prepared.", true)],
  },
];

export const demoIssues: DeliveryIssue[] = [
  { id: "DI-101", orderId: "ORD-1040", tracking: "TRK-20260928-003", customer: "Nusrat Jahan", vendor: "Nusrat Fashion", issue: "delayed", provider: "RedX", date: "2026-09-24", status: "investigating" },
  { id: "DI-102", orderId: "ORD-1038", tracking: "TRK-20260928-005", customer: "Sadia Afrin", vendor: "Sadia Kids", issue: "unavailable", provider: "Steadfast", date: "2026-09-16", status: "open" },
  { id: "DI-103", orderId: "ORD-1038", tracking: "TRK-20260928-005", customer: "Sadia Afrin", vendor: "Sadia Kids", issue: "address", provider: "Steadfast", date: "2026-09-16", status: "open" },
  { id: "DI-104", orderId: "ORD-1031", tracking: "TRK-20260928-009", customer: "Sabbir Khan", vendor: "Sadia Kids", issue: "damaged", provider: "Pathao", date: "2026-09-12", status: "resolved" },
  { id: "DI-105", orderId: "ORD-1029", tracking: "TRK-20260928-010", customer: "Lima Akter", vendor: "Sadia Kids", issue: "exception", provider: "RedX", date: "2026-09-08", status: "resolved" },
  { id: "DI-106", orderId: "ORD-1041", tracking: "TRK-20260928-002", customer: "Karim Uddin", vendor: "Karim Wholesale", issue: "failed", provider: "Steadfast", date: "2026-09-22", status: "investigating" },
];

export const demoReturns: ReturnRequest[] = [
  { id: "RET-10482", orderId: "ORD-1037", customer: "Sadia Afrin", email: "sadia@mail.com", product: "Kids Eid Set", sku: "K-EID-003", image: "/images/kids/kids-1.jpg", vendor: "Sadia Kids", qty: 1, price: 1890, reason: "Size Issue", condition: "Unused", message: "Size runs small, need one size up.", amount: 1890, method: "Store Wallet", date: "2026-09-20", status: "pending" },
  { id: "RET-10481", orderId: "ORD-1036", customer: "Rahim Uddin", email: "rahim@mail.com", product: "Leather Wallet", sku: "A-WAL-021", image: "/images/men/men-10.jpg", vendor: "JF Accessories", qty: 1, price: 1290, reason: "Defective Product", condition: "Defective", message: "Stitching came off on day one.", amount: 1290, method: "Original Payment", date: "2026-09-19", status: "review", note: "Photos requested" },
  { id: "RET-10480", orderId: "ORD-1039", customer: "Tanvir Hasan", email: "tanvir@mail.com", product: "Classic Panjabi - White", sku: "M-PAN-012", image: "/images/men/men-1.jpg", vendor: "TH Lifestyle", qty: 1, price: 3490, reason: "Color Issue", condition: "Opened", message: "Color faded after first wash.", amount: 3490, method: "Bank Transfer", date: "2026-09-18", status: "approved", approvedBy: "Admin", approvedDate: "2026-09-19" },
  { id: "RET-10479", orderId: "ORD-1035", customer: "Jannatul Ferdous", email: "jannatul@mail.com", product: "Baby Frock - Pink", sku: "K-FRK-007", image: "/images/kids/kids-2.jpg", vendor: "Sadia Kids", qty: 1, price: 1450, reason: "Changed Mind", condition: "Unused", message: "Ordered wrong color by mistake.", amount: 1450, method: "Store Wallet", date: "2026-09-15", status: "rejected", rejectReason: "Changed Mind is excluded for clearance items." },
  { id: "RET-10478", orderId: "ORD-1040", customer: "Nusrat Jahan", email: "nusrat@mail.com", product: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", vendor: "Nusrat Fashion", qty: 1, price: 6850, reason: "Damaged Product", condition: "Damaged", message: "Torn border received, see attached photos.", amount: 6850, method: "Original Payment", date: "2026-09-14", status: "received" },
  { id: "RET-10477", orderId: "ORD-1034", customer: "Ayesha Rahman", email: "ayesha@mail.com", product: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", vendor: "Dhaka Boutique", qty: 1, price: 3250, reason: "Late Delivery", condition: "Unused", message: "Arrived after the event.", amount: 3250, method: "Original Payment", date: "2026-09-12", status: "completed", approvedBy: "Admin", approvedDate: "2026-09-13" },
  { id: "RET-10476", orderId: "ORD-1033", customer: "Karim Uddin", email: "karim@mail.com", product: "Denim Shirt - Blue", sku: "M-SHI-014", image: "/images/men/men-2.jpg", vendor: "Karim Wholesale", qty: 2, price: 1990, reason: "Wrong Product", condition: "Unused", message: "Received different size than ordered.", amount: 3980, method: "Bank Transfer", date: "2026-09-10", status: "awaiting" },
  { id: "RET-10475", orderId: "ORD-1032", customer: "Mim Chowdhury", email: "mim@mail.com", product: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", vendor: "Ayesha Boutique", qty: 1, price: 2450, reason: "Missing Parts", condition: "Opened", message: "Belt missing from package.", amount: 2450, method: "Store Wallet", date: "2026-09-08", status: "cancelled" },
];

export const demoRefunds: RefundRequest[] = [
  { id: "RFD-701", returnId: "RET-10478", orderId: "ORD-1040", customer: "Nusrat Jahan", email: "nusrat@mail.com", vendor: "Nusrat Fashion", requested: 6850, approved: 6850, final: 6770, method: "Original Payment", productAmt: 6850, shipRefund: 0, taxRefund: 0, restockFee: 80, discountAdj: 0, origPayment: "bKash", origTxn: "TXN9X8A21", orderAmount: 6850, date: "2026-09-20", status: "processing", note: "Inspection passed" },
  { id: "RFD-702", returnId: "RET-10480", orderId: "ORD-1039", customer: "Tanvir Hasan", email: "tanvir@mail.com", vendor: "TH Lifestyle", requested: 3490, approved: 3490, final: 3440, method: "Bank Transfer", productAmt: 3490, shipRefund: 50, taxRefund: 0, restockFee: 100, discountAdj: 0, origPayment: "Nagad", origTxn: "TXN9X7B44", orderAmount: 3490, date: "2026-09-19", status: "approved", note: "Awaiting item pickup" },
  { id: "RFD-703", returnId: "RET-10477", orderId: "ORD-1034", customer: "Ayesha Rahman", email: "ayesha@mail.com", vendor: "Dhaka Boutique", requested: 3250, approved: 3200, final: 3200, method: "Original Payment", productAmt: 3250, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 50, origPayment: "Card", origTxn: "TXN9X6C02", orderAmount: 3250, date: "2026-09-13", completedDate: "2026-09-15", by: "Admin", status: "completed", note: "Refunded to card" },
  { id: "RFD-704", returnId: "RET-10482", orderId: "ORD-1037", customer: "Sadia Afrin", email: "sadia@mail.com", vendor: "Sadia Kids", requested: 1890, approved: 0, final: 0, method: "Store Wallet", productAmt: 1890, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 0, origPayment: "COD", origTxn: "—", orderAmount: 1890, date: "2026-09-20", status: "pending", note: "" },
  { id: "RFD-705", returnId: "RET-10479", orderId: "ORD-1035", customer: "Jannatul Ferdous", email: "jannatul@mail.com", vendor: "Sadia Kids", requested: 1450, approved: 0, final: 0, method: "Store Wallet", productAmt: 1450, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 0, origPayment: "bKash", origTxn: "TXN9X2D77", orderAmount: 1450, date: "2026-09-16", status: "rejected", note: "Return was rejected" },
  { id: "RFD-706", returnId: "RET-10476", orderId: "ORD-1033", customer: "Karim Uddin", email: "karim@mail.com", vendor: "Karim Wholesale", requested: 3980, approved: 3980, final: 3900, method: "Bank Transfer", productAmt: 3980, shipRefund: 80, taxRefund: 0, restockFee: 100, discountAdj: 60, origPayment: "Bank", origTxn: "TXN9X1E90", orderAmount: 7960, date: "2026-09-11", completedDate: "2026-09-14", by: "Admin", status: "completed", note: "Partial shipment refund" },
  { id: "RFD-707", returnId: "RET-10481", orderId: "ORD-1036", customer: "Rahim Uddin", email: "rahim@mail.com", vendor: "JF Accessories", requested: 1290, approved: 1290, final: 1290, method: "Original Payment", productAmt: 1290, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 0, origPayment: "Nagad", origTxn: "TXN9X0F13", orderAmount: 1290, date: "2026-09-19", status: "failed", note: "Gateway timeout, retry" },
];

export const demoReasons: ReturnReason[] = [
  { id: "rr1", name: "Wrong Product", description: "Customer received a different item.", category: "Fulfillment", usage: 96, rate: 19.2, amount: 64500, status: "active", priority: 1 },
  { id: "rr2", name: "Damaged Product", description: "Item arrived damaged.", category: "Quality", usage: 124, rate: 24.8, amount: 84500, status: "active", priority: 2 },
  { id: "rr3", name: "Defective Product", description: "Manufacturing defect found.", category: "Quality", usage: 78, rate: 15.6, amount: 52300, status: "active", priority: 3 },
  { id: "rr4", name: "Product Not as Described", description: "Mismatch with catalog.", category: "Catalog", usage: 64, rate: 12.8, amount: 41800, status: "active", priority: 4 },
  { id: "rr5", name: "Size Issue", description: "Wrong size or fit problem.", category: "Sizing", usage: 52, rate: 10.4, amount: 28900, status: "active", priority: 5 },
  { id: "rr6", name: "Color Issue", description: "Color differs from photos.", category: "Catalog", usage: 31, rate: 6.2, amount: 17400, status: "active", priority: 6 },
  { id: "rr7", name: "Changed Mind", description: "Customer changed mind.", category: "Customer", usage: 28, rate: 5.6, amount: 15200, status: "inactive", priority: 7 },
  { id: "rr8", name: "Late Delivery", description: "Arrived after needed date.", category: "Logistics", usage: 18, rate: 3.6, amount: 9800, status: "active", priority: 8 },
  { id: "rr9", name: "Missing Parts", description: "Accessories missing.", category: "Fulfillment", usage: 9, rate: 1.8, amount: 5200, status: "active", priority: 9 },
  { id: "rr10", name: "Other", description: "Catch-all reason.", category: "Other", usage: 4, rate: 0.8, amount: 2100, status: "active", priority: 10 },
];

export const defaultPolicy: ReturnPolicy = {
  enabled: true,
  windowDays: 7,
  refundDays: 5,
  exchange: true,
  conditions: ["Unused", "Original packaging", "Tags attached", "Accessories included"],
  nonReturnable: ["Clearance", "Innerwear", "Digital goods"],
  shipPayer: "vendor",
  fullRefund: true,
  partialRefund: true,
  shipRefund: false,
  restockFee: 100,
};

export const REJECTION_REASONS = [
  "Return Window Expired",
  "Product Used",
  "Product Damaged by Customer",
  "Missing Accessories",
  "Incorrect Return Request",
  "Non-Returnable Product",
  "Invalid Reason",
  "Other",
];

export const REFUND_METHODS = [
  "Original Payment Method",
  "Store Wallet",
  "Bank Transfer",
  "Mobile Financial Service",
  "Manual Refund",
];

export function calcRefund(productAmt: number, ship: number, tax: number, fee: number, adj: number): number {
  return Math.max(0, productAmt + ship + tax - fee - adj);
}

export function shipmentsTrend(): Array<{ x: string; y: number }> {
  return [
    { x: "Apr", y: 8200 }, { x: "May", y: 9400 }, { x: "Jun", y: 8800 },
    { x: "Jul", y: 10200 }, { x: "Aug", y: 11800 }, { x: "Sep", y: 9600 },
  ];
}
