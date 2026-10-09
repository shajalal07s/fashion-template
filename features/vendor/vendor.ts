export const CURRENT_VENDOR_ID = "v-ayesha";
export interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  store: string;
  slug: string;
  logo: string;
  status: "open" | "closed" | "vacation";
  rating: number;
  joined: string;
  address: string;
}

export const demoVendor: VendorProfile = {
  id: CURRENT_VENDOR_ID,
  name: "Ayesha Rahman",
  email: "ayesha@store.com",
  phone: "01711-223344",
  store: "Ayesha Boutique",
  slug: "ayesha-boutique",
  logo: "/images/women/women-1.jpg",
  status: "open",
  rating: 4.8,
  joined: "2024-03-12",
  address: "House 7, Road 11, Banani, Dhaka",
};

export type VendorOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "returned"
  | "refunded";

export interface OrderNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface OrderEvent {
  event: string;
  date: string;
  detail: string;
}

export interface VendorOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: Array<{ name: string; sku: string; image: string; qty: number; price: number; variation?: string }>;
  subtotal: number;
  discount: number;
  coupon: number;
  shipping: number;
  tax: number;
  total: number;
  commission: number;
  earning: number;
  refunded: number;
  payment: string;
  payStatus: "paid" | "pending" | "refunded" | "failed";
  transactionId: string;
  payDate: string;
  status: VendorOrderStatus;
  courier: string;
  method: string;
  tracking: string;
  trackingUrl: string;
  shipDate: string;
  eta: string;
  deliveredDate: string;
  address: string;
  billing: string;
  city: string;
  postal: string;
  date: string;
  updated: string;
  note?: string;
  notes: OrderNote[];
  activity: OrderEvent[];
  archived: boolean;
  cancelReason?: string;
  returnStatus?: string;
}

export const demoVendorOrders: VendorOrder[] = [
  {
    id: "ORD-2041", customer: "Nusrat Jahan", email: "nusrat@mail.com", phone: "01811-000001",
    items: [
      { name: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", qty: 2, price: 2450 },
      { name: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", qty: 1, price: 3250 },
    ],
    subtotal: 8150, discount: 815, coupon: 0, shipping: 60, tax: 0, total: 7395, commission: 887, earning: 6508, refunded: 0,
    payment: "bKash", payStatus: "paid", transactionId: "TXNbKash881", payDate: "2026-09-25",
    status: "pending", courier: "Pathao", method: "Express Delivery",
    tracking: "TRK-20260928-101", trackingUrl: "https://pathao.com/track/TRK-20260928-101",
    shipDate: "", eta: "2026-09-27", deliveredDate: "",
    address: "House 4, Road 8, Dhanmondi", billing: "House 4, Road 8, Dhanmondi", city: "Dhaka", postal: "1205",
    date: "2026-09-25", updated: "2026-09-25",
    notes: [{ id: "n1", text: "Customer asked for gift wrap.", author: "Ayesha", date: "2026-09-25" }],
    activity: [
      { event: "Order created", date: "2026-09-25", detail: "Order placed by customer" },
      { event: "Payment received", date: "2026-09-25", detail: "bKash TXNbKash881" },
    ],
    archived: false,
  },
  {
    id: "ORD-2039", customer: "Mim Chowdhury", email: "mim@mail.com", phone: "01811-000002",
    items: [{ name: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", qty: 1, price: 2450 }],
    subtotal: 2450, discount: 0, coupon: 0, shipping: 60, tax: 0, total: 2510, commission: 294, earning: 2216, refunded: 0,
    payment: "COD", payStatus: "pending", transactionId: "—", payDate: "",
    status: "processing", courier: "Steadfast", method: "Standard Delivery",
    tracking: "TRK-20260928-102", trackingUrl: "",
    shipDate: "", eta: "2026-09-28", deliveredDate: "",
    address: "Block C, Bashundhara", billing: "Block C, Bashundhara", city: "Dhaka", postal: "1229",
    date: "2026-09-24", updated: "2026-09-24",
    notes: [],
    activity: [
      { event: "Order created", date: "2026-09-24", detail: "Order placed by customer" },
      { event: "Status changed", date: "2026-09-24", detail: "Pending → Processing" },
    ],
    archived: false,
  },
  {
    id: "ORD-2036", customer: "Tania Sultana", email: "tania@mail.com", phone: "01811-000003",
    items: [{ name: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", qty: 1, price: 3250 }],
    subtotal: 3250, discount: 325, coupon: 100, shipping: 0, tax: 0, total: 2925, commission: 351, earning: 2574, refunded: 0,
    payment: "Nagad", payStatus: "paid", transactionId: "TXNNagad332", payDate: "2026-09-22",
    status: "shipped", courier: "RedX", method: "Standard Delivery",
    tracking: "TRK-20260928-103", trackingUrl: "https://redx.com.bd/track/TRK-20260928-103",
    shipDate: "2026-09-23", eta: "2026-09-27", deliveredDate: "",
    address: "Zindabazar", billing: "Zindabazar", city: "Sylhet", postal: "3100",
    date: "2026-09-22", updated: "2026-09-23",
    notes: [],
    activity: [
      { event: "Order created", date: "2026-09-22", detail: "Order placed by customer" },
      { event: "Payment received", date: "2026-09-22", detail: "Nagad TXNNagad332" },
      { event: "Shipped", date: "2026-09-23", detail: "RedX TRK-20260928-103" },
    ],
    archived: false,
  },
  {
    id: "ORD-2031", customer: "Lima Akter", email: "lima@mail.com", phone: "01811-000004",
    items: [
      { name: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", qty: 1, price: 2450 },
      { name: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", qty: 1, price: 6850 },
    ],
    subtotal: 9300, discount: 0, coupon: 200, shipping: 60, tax: 0, total: 9360, commission: 1123, earning: 8237, refunded: 0,
    payment: "Card", payStatus: "paid", transactionId: "TXNCard908", payDate: "2026-09-18",
    status: "completed", courier: "Pathao", method: "Express Delivery",
    tracking: "TRK-20260928-104", trackingUrl: "",
    shipDate: "2026-09-19", eta: "2026-09-21", deliveredDate: "2026-09-21",
    address: "Agrabad", billing: "Agrabad", city: "Chattogram", postal: "4100",
    date: "2026-09-18", updated: "2026-09-21",
    notes: [],
    activity: [
      { event: "Order created", date: "2026-09-18", detail: "Order placed by customer" },
      { event: "Payment received", date: "2026-09-18", detail: "Card TXNCard908" },
      { event: "Shipped", date: "2026-09-19", detail: "Pathao TRK-20260928-104" },
      { event: "Delivered", date: "2026-09-21", detail: "Signed by customer" },
      { event: "Completed", date: "2026-09-21", detail: "Order completed" },
    ],
    archived: false,
  },
  {
    id: "ORD-2028", customer: "Sabbir Khan", email: "sabbir@mail.com", phone: "01811-000005",
    items: [{ name: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", qty: 1, price: 3250 }],
    subtotal: 3250, discount: 0, coupon: 0, shipping: 60, tax: 0, total: 3310, commission: 0, earning: 0, refunded: 3310,
    payment: "bKash", payStatus: "refunded", transactionId: "TXNbKash550", payDate: "2026-09-15",
    status: "cancelled", courier: "—", method: "Standard Delivery",
    tracking: "TRK-20260928-105", trackingUrl: "",
    shipDate: "", eta: "", deliveredDate: "",
    address: "Rajshahi Sadar", billing: "Rajshahi Sadar", city: "Rajshahi", postal: "6000",
    date: "2026-09-15", updated: "2026-09-16",
    notes: [],
    activity: [
      { event: "Order created", date: "2026-09-15", detail: "Order placed by customer" },
      { event: "Cancelled", date: "2026-09-16", detail: "Product unavailable" },
      { event: "Refunded", date: "2026-09-16", detail: "৳3,310 to bKash" },
    ],
    archived: false, cancelReason: "Product unavailable",
  },
  {
    id: "ORD-2024", customer: "Priya Das", email: "priya@mail.com", phone: "01811-000006",
    items: [{ name: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", qty: 1, price: 6850 }],
    subtotal: 6850, discount: 685, coupon: 0, shipping: 60, tax: 0, total: 6225, commission: 747, earning: 5478, refunded: 0,
    payment: "bKash", payStatus: "paid", transactionId: "TXNbKash610", payDate: "2026-09-12",
    status: "completed", courier: "Pathao", method: "Standard Delivery",
    tracking: "TRK-20260928-106", trackingUrl: "",
    shipDate: "2026-09-13", eta: "2026-09-15", deliveredDate: "2026-09-15",
    address: "Khulna Sadar", billing: "Khulna Sadar", city: "Khulna", postal: "9100",
    date: "2026-09-12", updated: "2026-09-15",
    notes: [],
    activity: [
      { event: "Order created", date: "2026-09-12", detail: "Order placed by customer" },
      { event: "Payment received", date: "2026-09-12", detail: "bKash TXNbKash610" },
      { event: "Delivered", date: "2026-09-15", detail: "Signed by customer" },
    ],
    archived: false,
  },
];

export type VendorProductStatus = "active" | "draft" | "pending" | "inactive" | "out" | "rejected" | "archived";

export interface ProductVariation {
  id: string;
  name: string;
  sku: string;
  attributes: string;
  image: string;
  price: number;
  salePrice: number;
  stock: number;
  weight: number;
  status: "active" | "inactive";
}

export interface VendorProduct {
  id: string;
  name: string;
  sku: string;
  image: string;
  gallery: string[];
  category: string;
  subCategory: string;
  brand: string;
  type: string;
  tags: string[];
  shortDesc: string;
  description: string;
  price: number;
  salePrice: number;
  costPrice: number;
  saleStart: string;
  saleEnd: string;
  stock: number;
  lowThreshold: number;
  manageStock: boolean;
  backorder: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  shipClass: string;
  attributes: Array<{ name: string; values: string[] }>;
  variations: ProductVariation[];
  seoTitle: string;
  seoDesc: string;
  slug: string;
  keywords: string;
  featured: boolean;
  visibility: string;
  allowReviews: boolean;
  purchaseLimit: number;
  sold: number;
  views: number;
  carts: number;
  rating: number;
  reviews: number;
  revenue: number;
  status: VendorProductStatus;
  created: string;
  updated: string;
  activity: Array<{ event: string; date: string; detail: string }>;
  stockHistory: Array<{ date: string; change: number; balance: number; note: string }>;
}

export const demoVendorProducts: VendorProduct[] = [
  {
    id: "vp1", name: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg",
    gallery: ["/images/women/women-1.jpg", "/images/women/women-10.jpg"],
    category: "Women", subCategory: "Kurtis", brand: "Ayesha Boutique", type: "Simple", tags: ["kurti", "cotton", "eid"],
    shortDesc: "Comfortable everyday printed kurti.", description: "<p>Premium cotton printed kurti with side slits.</p>",
    price: 2450, salePrice: 1960, costPrice: 1400, saleStart: "2026-09-20", saleEnd: "2026-09-30",
    stock: 34, lowThreshold: 10, manageStock: true, backorder: false,
    weight: 0.4, length: 30, width: 20, height: 4, shipClass: "Standard",
    attributes: [{ name: "Size", values: ["S", "M", "L", "XL"] }, { name: "Color", values: ["Red", "Maroon"] }],
    variations: [
      { id: "vp1v1", name: "Red / M", sku: "W-KUR-001-RM", attributes: "Red, M", image: "/images/women/women-1.jpg", price: 2450, salePrice: 1960, stock: 12, weight: 0.4, status: "active" },
      { id: "vp1v2", name: "Red / L", sku: "W-KUR-001-RL", attributes: "Red, L", image: "/images/women/women-1.jpg", price: 2450, salePrice: 1960, stock: 10, weight: 0.4, status: "active" },
      { id: "vp1v3", name: "Maroon / M", sku: "W-KUR-001-MM", attributes: "Maroon, M", image: "/images/women/women-10.jpg", price: 2450, salePrice: 0, stock: 12, weight: 0.4, status: "active" },
    ],
    seoTitle: "Printed Kurti Red | Ayesha Boutique", seoDesc: "Shop red printed kurti.", slug: "printed-kurti-red", keywords: "kurti, red",
    featured: true, visibility: "Public", allowReviews: true, purchaseLimit: 5,
    sold: 186, views: 8420, carts: 640, rating: 4.7, reviews: 24, revenue: 364560,
    status: "active", created: "2026-05-02", updated: "2026-09-24",
    activity: [
      { event: "Product created", date: "2026-05-02", detail: "Created as draft" },
      { event: "Status changed", date: "2026-05-04", detail: "Draft → Active" },
      { event: "Price changed", date: "2026-09-01", detail: "2450 → 2450, sale 1960 added" },
      { event: "Stock changed", date: "2026-09-24", detail: "+20 units received" },
    ],
    stockHistory: [
      { date: "2026-09-24", change: 20, balance: 34, note: "Purchase order" },
      { date: "2026-09-20", change: -8, balance: 14, note: "Orders" },
    ],
  },
  {
    id: "vp2", name: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg",
    gallery: ["/images/women/women-3.jpg"],
    category: "Women", subCategory: "Three-Piece", brand: "Ayesha Boutique", type: "Simple", tags: ["three-piece", "cotton"],
    shortDesc: "Elegant cotton three-piece.", description: "<p>Three-piece set with embroidered dupatta.</p>",
    price: 3250, salePrice: 0, costPrice: 2100, saleStart: "", saleEnd: "",
    stock: 8, lowThreshold: 10, manageStock: true, backorder: false,
    weight: 0.6, length: 32, width: 22, height: 5, shipClass: "Standard",
    attributes: [{ name: "Size", values: ["M", "L"] }],
    variations: [],
    seoTitle: "Cotton Three-Piece | Ayesha Boutique", seoDesc: "Cotton three-piece set.", slug: "cotton-three-piece", keywords: "three-piece",
    featured: false, visibility: "Public", allowReviews: true, purchaseLimit: 3,
    sold: 142, views: 6230, carts: 410, rating: 4.8, reviews: 18, revenue: 461500,
    status: "active", created: "2026-06-10", updated: "2026-09-22",
    activity: [{ event: "Product created", date: "2026-06-10", detail: "Created as draft" }],
    stockHistory: [{ date: "2026-09-22", change: -4, balance: 8, note: "Orders" }],
  },
  {
    id: "vp3", name: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg",
    gallery: ["/images/women/women-2.jpg"],
    category: "Saree", subCategory: "Silk", brand: "Ayesha Boutique", type: "Simple", tags: ["saree", "silk", "eid"],
    shortDesc: "Rich green silk saree.", description: "<p>Handloom silk saree with zari border.</p>",
    price: 6850, salePrice: 6165, costPrice: 4200, saleStart: "2026-09-01", saleEnd: "2026-09-30",
    stock: 0, lowThreshold: 5, manageStock: true, backorder: true,
    weight: 0.8, length: 36, width: 24, height: 6, shipClass: "Fragile",
    attributes: [],
    variations: [],
    seoTitle: "Silk Saree Green | Ayesha Boutique", seoDesc: "Green silk saree.", slug: "silk-saree-green", keywords: "saree",
    featured: true, visibility: "Public", allowReviews: true, purchaseLimit: 2,
    sold: 96, views: 9120, carts: 720, rating: 4.9, reviews: 31, revenue: 591840,
    status: "out", created: "2026-04-15", updated: "2026-09-20",
    activity: [{ event: "Stock changed", date: "2026-09-20", detail: "Last unit sold" }],
    stockHistory: [{ date: "2026-09-20", change: -1, balance: 0, note: "Order ORD-2031" }],
  },
  {
    id: "vp4", name: "Embroidered Kurti - Blue", sku: "W-KUR-014", image: "/images/women/women-10.jpg",
    gallery: ["/images/women/women-10.jpg"],
    category: "Women", subCategory: "Kurtis", brand: "Ayesha Boutique", type: "Variable", tags: ["kurti"],
    shortDesc: "Blue embroidered kurti.", description: "<p>Georgette kurti with thread embroidery.</p>",
    price: 2790, salePrice: 0, costPrice: 1700, saleStart: "", saleEnd: "",
    stock: 52, lowThreshold: 10, manageStock: true, backorder: false,
    weight: 0.4, length: 30, width: 20, height: 4, shipClass: "Standard",
    attributes: [{ name: "Size", values: ["S", "M", "L"] }],
    variations: [],
    seoTitle: "Embroidered Kurti Blue | Ayesha Boutique", seoDesc: "Blue embroidered kurti.", slug: "embroidered-kurti-blue", keywords: "kurti",
    featured: false, visibility: "Public", allowReviews: true, purchaseLimit: 5,
    sold: 61, views: 3140, carts: 180, rating: 4.5, reviews: 9, revenue: 170190,
    status: "pending", created: "2026-09-18", updated: "2026-09-24",
    activity: [{ event: "Product created", date: "2026-09-18", detail: "Submitted for review" }],
    stockHistory: [{ date: "2026-09-18", change: 52, balance: 52, note: "Initial stock" }],
  },
  {
    id: "vp5", name: "Georgette Hijab Set", sku: "W-HJB-006", image: "/images/women/women-11.jpg",
    gallery: ["/images/women/women-11.jpg"],
    category: "Accessories", subCategory: "Hijab", brand: "Ayesha Boutique", type: "Simple", tags: ["hijab"],
    shortDesc: "Soft georgette hijab combo.", description: "<p>Pack of 2 breathable hijabs.</p>",
    price: 1290, salePrice: 1090, costPrice: 700, saleStart: "2026-09-10", saleEnd: "2026-09-30",
    stock: 3, lowThreshold: 8, manageStock: true, backorder: false,
    weight: 0.2, length: 20, width: 15, height: 3, shipClass: "Standard",
    attributes: [],
    variations: [],
    seoTitle: "Hijab Set | Ayesha Boutique", seoDesc: "Georgette hijab combo.", slug: "georgette-hijab-set", keywords: "hijab",
    featured: false, visibility: "Public", allowReviews: true, purchaseLimit: 10,
    sold: 44, views: 2280, carts: 150, rating: 4.6, reviews: 7, revenue: 47960,
    status: "active", created: "2026-07-01", updated: "2026-09-23",
    activity: [],
    stockHistory: [{ date: "2026-09-23", change: -2, balance: 3, note: "Orders" }],
  },
  {
    id: "vp6", name: "Muslin Dupatta", sku: "W-DUP-002", image: "/images/women/women-12.jpg",
    gallery: ["/images/women/women-12.jpg"],
    category: "Accessories", subCategory: "Dupatta", brand: "Ayesha Boutique", type: "Simple", tags: ["dupatta"],
    shortDesc: "Light muslin dupatta.", description: "<p>Sheer muslin dupatta.</p>",
    price: 890, salePrice: 0, costPrice: 450, saleStart: "", saleEnd: "",
    stock: 77, lowThreshold: 10, manageStock: true, backorder: false,
    weight: 0.15, length: 22, width: 14, height: 2, shipClass: "Standard",
    attributes: [],
    variations: [],
    seoTitle: "Muslin Dupatta | Ayesha Boutique", seoDesc: "Muslin dupatta.", slug: "muslin-dupatta", keywords: "dupatta",
    featured: false, visibility: "Hidden", allowReviews: false, purchaseLimit: 10,
    sold: 23, views: 1140, carts: 60, rating: 4.4, reviews: 4, revenue: 20470,
    status: "draft", created: "2026-09-20", updated: "2026-09-25",
    activity: [],
    stockHistory: [{ date: "2026-09-20", change: 77, balance: 77, note: "Initial stock" }],
  },
];

export interface VendorCustomer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  lastOrder: string;
  returning: boolean;
}

export const demoVendorCustomers: VendorCustomer[] = [
  { id: "vc1", name: "Nusrat Jahan", email: "nusrat@mail.com", orders: 4, spent: 18900, lastOrder: "2026-09-25", returning: true },
  { id: "vc2", name: "Priya Das", email: "priya@mail.com", orders: 3, spent: 15200, lastOrder: "2026-09-12", returning: true },
  { id: "vc3", name: "Tania Sultana", email: "tania@mail.com", orders: 2, spent: 6175, lastOrder: "2026-09-22", returning: true },
  { id: "vc4", name: "Mim Chowdhury", email: "mim@mail.com", orders: 1, spent: 2510, lastOrder: "2026-09-24", returning: false },
  { id: "vc5", name: "Lima Akter", email: "lima@mail.com", orders: 2, spent: 12450, lastOrder: "2026-09-18", returning: true },
  { id: "vc6", name: "Sabbir Khan", email: "sabbir@mail.com", orders: 1, spent: 3310, lastOrder: "2026-09-15", returning: false },
];

export interface VendorReview {
  id: string;
  customer: string;
  product: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  reply?: string;
}

export const demoVendorReviews: VendorReview[] = [
  { id: "vr1", customer: "Priya Das", product: "Silk Saree - Green", rating: 5, text: "Beautiful drape and rich color. Got many compliments!", date: "2026-09-20", replied: true, reply: "Thank you so much, Priya! Glad you loved it." },
  { id: "vr2", customer: "Mim Chowdhury", product: "Printed Kurti - Red", rating: 4, text: "Good fit, color exactly like pictures.", date: "2026-09-24", replied: false },
  { id: "vr3", customer: "Tania Sultana", product: "Cotton Three-Piece", rating: 5, text: "Comfortable cotton, fast delivery.", date: "2026-09-23", replied: false },
  { id: "vr4", customer: "Lima Akter", product: "Silk Saree - Green", rating: 5, text: "Premium feel, worth every taka.", date: "2026-09-19", replied: true, reply: "Thanks Lima! More festive colors coming soon." },
  { id: "vr5", customer: "Sabbir Khan", product: "Cotton Three-Piece", rating: 3, text: "Good but delivery took 5 days.", date: "2026-09-16", replied: false },
];

export interface VendorPayout {
  id: string;
  amount: number;
  method: string;
  date: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export const demoVendorPayouts: VendorPayout[] = [
  { id: "PO-310", amount: 48200, method: "Bank Transfer", date: "2026-09-20", status: "completed" },
  { id: "PO-309", amount: 36400, method: "bKash", date: "2026-09-13", status: "completed" },
  { id: "PO-308", amount: 32500, method: "Bank Transfer", date: "2026-09-26", status: "pending" },
  { id: "PO-307", amount: 29800, method: "Nagad", date: "2026-09-06", status: "completed" },
];

export interface VendorNotification {
  id: string;
  text: string;
  date: string;
  read: boolean;
  kind: "order" | "stock" | "review" | "payout" | "return" | "info";
}

export const demoVendorNotifications: VendorNotification[] = [
  { id: "vn1", text: "New order ORD-2041 received (৳7,395).", date: "2026-09-25", read: false, kind: "order" },
  { id: "vn2", text: "Silk Saree - Green is out of stock.", date: "2026-09-24", read: false, kind: "stock" },
  { id: "vn3", text: "New 4★ review on Printed Kurti - Red.", date: "2026-09-24", read: false, kind: "review" },
  { id: "vn4", text: "Payout PO-310 completed (৳48,200).", date: "2026-09-20", read: true, kind: "payout" },
  { id: "vn5", text: "Return request received for ORD-2037.", date: "2026-09-18", read: true, kind: "return" },
  { id: "vn6", text: "Update store information before Oct 1.", date: "2026-09-15", read: true, kind: "info" },
];

export const demoAnnouncement = {
  title: "Platform Announcement",
  text: "New shipping policy will take effect from October 1. Express rates drop 10% for Dhaka Metro.",
};

export function vendorSalesTrend(): Array<{ x: string; y: number }> {
  return [
    { x: "Apr", y: 320000 }, { x: "May", y: 410000 }, { x: "Jun", y: 380000 },
    { x: "Jul", y: 460000 }, { x: "Aug", y: 520000 }, { x: "Sep", y: 485250 },
  ];
}

export function vendorSummary() {  const sales = 485250;
  const commission = 58230;
  const orders = 192;
  return {
    sales,
    earnings: 425800,
    commission,
    orders,
    products: demoVendorProducts.length,
    activeProducts: demoVendorProducts.filter((p) => p.status === "active").length,
    outOfStock: demoVendorProducts.filter((p) => p.stock === 0).length,
    pending: demoVendorOrders.filter((o) => o.status === "pending").length,
    completed: demoVendorOrders.filter((o) => o.status === "completed").length,
    cancelled: demoVendorOrders.filter((o) => o.status === "cancelled").length,
  };
}

export function normalizeVendorProduct(p: Partial<VendorProduct> & { id: string; name: string }): VendorProduct {
  return {
    sku: "",
    image: "/images/women/women-1.jpg",
    category: "Women",    subCategory: "",
    brand: "Ayesha Boutique",
    type: "Simple",
    shortDesc: "",
    description: "",
    price: 0,
    salePrice: 0,
    costPrice: 0,
    saleStart: "",
    saleEnd: "",
    stock: 0,
    lowThreshold: 10,
    manageStock: true,
    backorder: false,
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    shipClass: "Standard",
    seoTitle: "",
    seoDesc: "",
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    keywords: "",
    featured: false,
    visibility: "Public",
    allowReviews: true,
    purchaseLimit: 5,
    sold: 0,
    views: 0,
    carts: 0,
    rating: 5,
    reviews: 0,
    revenue: 0,
    status: "draft",
    created: "2026-09-26",
    updated: "2026-09-26",
    ...p,
    variations: p.variations ?? [],
    gallery: p.gallery ?? [],
    tags: p.tags ?? [],
    attributes: p.attributes ?? [],
    activity: p.activity ?? [],
    stockHistory: p.stockHistory ?? [],
  };
}
