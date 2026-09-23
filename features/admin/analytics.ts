import { products } from "@/features/shop/products";
import type { Product } from "@/types/product";

export type AdminOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface AdminOrderItem {
  productId: string;
  name: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  items: AdminOrderItem[];
  payment: "cod" | "bkash" | "nagad" | "card";
  status: AdminOrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
}

export interface AdminCustomer {
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  lastOrder: string;
}

/** Deterministic PRNG so SSR and client renders always match. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Arif",
  "Nusrat",
  "Tanvir",
  "Mim",
  "Rakib",
  "Sadia",
  "Fahim",
  "Priya",
  "Hasan",
  "Tania",
  "Sabbir",
  "Rina",
  "Mahmud",
  "Lima",
  "Shakil",
  "Dipa",
  "Rahim",
  "Nabila",
  "Karim",
  "Sumi",
];

const LAST_NAMES = [
  "Hossain",
  "Akter",
  "Rahman",
  "Begum",
  "Khan",
  "Islam",
  "Chowdhury",
  "Ahmed",
  "Sultana",
  "Uddin",
];

const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur"];

const PAYMENTS: AdminOrder["payment"][] = ["cod", "bkash", "nagad", "card"];

const STATUS_POOL: AdminOrderStatus[] = [
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "shipped",
  "shipped",
  "processing",
  "processing",
  "pending",
  "cancelled",
];

function monthLabels(count: number, end = new Date()): string[] {
  const labels: string[] = [];
  const d = new Date(end.getFullYear(), end.getMonth(), 1);
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    labels.push(m.toLocaleString("en", { month: "short" }));
  }
  return labels;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Builds a stable demo order history spread across the trailing 12 months. */
export function buildDemoOrders(now = new Date()): AdminOrder[] {
  const rand = mulberry32(20260922);
  const catalog = products.filter((p) => p.isActive);
  const orders: AdminOrder[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let seq = 1001;
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const growth = 1 + m * 0.09;
    const count = Math.round((10 + rand() * 8) * growth);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rand() * 28);
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(day, 28));
      const itemCount = 1 + Math.floor(rand() * 3);
      const items: AdminOrderItem[] = [];
      let subtotal = 0;
      for (let k = 0; k < itemCount; k++) {
        const product = catalog[Math.floor(rand() * catalog.length)];
        const quantity = 1 + Math.floor(rand() * 2);
        subtotal += product.price * quantity;
        items.push({
          productId: product.id,
          name: product.name,
          image: product.images[0] ?? "",
          category: product.category ?? "Women",
          price: product.price,
          quantity,
        });
      }
      const shipping = subtotal >= 2000 ? 0 : 120;
      const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
      const city = CITIES[Math.floor(rand() * CITIES.length)];
      orders.push({
        id: `FS-${monthKey(date).replace("-", "")}-${seq++}`,
        date: date.toISOString(),
        customerName: `${first} ${last}`,
        customerEmail: `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(rand() * 90 + 10)}@example.com`,
        customerPhone: `01${Math.floor(300000000 + rand() * 699999999)}`,
        city,
        items,
        payment: PAYMENTS[Math.floor(rand() * PAYMENTS.length)],
        status: STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)],
        subtotal,
        shipping,
        total: subtotal + shipping,
      });
    }
  }
  return orders.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const demoOrders: AdminOrder[] = buildDemoOrders();

export interface Kpi {
  revenue: number;
  revenueDelta: number;
  orders: number;
  ordersDelta: number;
  avgOrder: number;
  avgOrderDelta: number;
  customers: number;
  customersDelta: number;
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeKpis(orders: AdminOrder[]): Kpi {
  const now = new Date();
  const thisKey = monthKey(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = monthKey(prev);
  const inMonth = (key: string) => orders.filter((o) => monthKey(new Date(o.date)) === key);
  const cur = inMonth(thisKey);
  const prv = inMonth(prevKey);

  const sum = (list: AdminOrder[]) => list.reduce((n, o) => n + o.total, 0);
  const curRevenue = sum(cur);
  const prevRevenue = sum(prv);
  const curAvg = cur.length ? Math.round(curRevenue / cur.length) : 0;
  const prevAvg = prv.length ? Math.round(prevRevenue / prv.length) : 0;
  const uniq = (list: AdminOrder[]) => new Set(list.map((o) => o.customerEmail)).size;

  return {
    revenue: orders.reduce((n, o) => n + o.total, 0),
    revenueDelta: pctDelta(curRevenue, prevRevenue),
    orders: orders.length,
    ordersDelta: pctDelta(cur.length, prv.length),
    avgOrder: orders.length ? Math.round(sum(orders) / orders.length) : 0,
    avgOrderDelta: pctDelta(curAvg, prevAvg),
    customers: uniq(orders),
    customersDelta: pctDelta(uniq(cur), uniq(prv)),
  };
}

export interface RevenuePoint {
  x: string;
  y: number;
}

export function monthlyRevenue(orders: AdminOrder[]): RevenuePoint[] {
  const labels = monthLabels(12);
  const now = new Date();
  const buckets = new Map<string, number>();
  for (const o of orders) {
    const key = monthKey(new Date(o.date));
    buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  return labels.map((label, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { x: label, y: buckets.get(monthKey(d)) ?? 0 };
  });
}

export interface CategorySales {
  category: string;
  sales: number;
  orders: number;
  [key: string]: string | number;
}

export function salesByCategory(orders: AdminOrder[]): CategorySales[] {
  const map = new Map<string, CategorySales>();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = map.get(item.category) ?? { category: item.category, sales: 0, orders: 0 };
      entry.sales += item.price * item.quantity;
      entry.orders += item.quantity;
      map.set(item.category, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.sales - a.sales);
}

export interface StatusSlice {
  id: string;
  label: string;
  value: number;
}

export function ordersByStatus(orders: AdminOrder[]): StatusSlice[] {
  const map = new Map<string, number>();
  for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
  return [...map.entries()].map(([id, value]) => ({
    id: id[0].toUpperCase() + id.slice(1),
    label: id[0].toUpperCase() + id.slice(1),
    value,
  }));
}

export function topProducts(orders: AdminOrder[], limit = 5) {
  const map = new Map<string, { product: Product; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const entry = map.get(item.productId) ?? { product, qty: 0, revenue: 0 };
      entry.qty += item.quantity;
      entry.revenue += item.price * item.quantity;
      map.set(item.productId, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function lowStockProducts(limit = 5): Product[] {
  return [...products].filter((p) => p.isActive).sort((a, b) => a.stock - b.stock).slice(0, limit);
}

export interface ProductSaleSummary {
  id: string;
  name: string;
  image: string;
  qty: number;
  orders: number;
  revenue: number;
  customers: Array<{ name: string; qty: number }>;
}

export function productSalesSummary(orders: AdminOrder[]): ProductSaleSummary[] {
  const map = new Map<string, ProductSaleSummary & { buyers: Map<string, number> }>();
  for (const o of orders) {
    for (const item of o.items) {
      const product = products.find((p) => p.id === item.productId);
      const entry = map.get(item.productId) ?? {
        id: item.productId,
        name: item.name,
        image: item.image || product?.images[0] || "",
        qty: 0,
        orders: 0,
        revenue: 0,
        customers: [],
        buyers: new Map<string, number>(),
      };
      entry.qty += item.quantity;
      entry.orders += 1;
      entry.revenue += item.price * item.quantity;
      entry.buyers.set(o.customerName, (entry.buyers.get(o.customerName) ?? 0) + item.quantity);
      map.set(item.productId, entry);
    }
  }
  return [...map.values()]
    .map((e) => ({
      ...e,
      customers: [...e.buyers.entries()]
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function buildCustomers(orders: AdminOrder[]): AdminCustomer[] {
  const map = new Map<string, AdminCustomer>();
  for (const o of orders) {
    const entry = map.get(o.customerEmail) ?? {
      name: o.customerName,
      email: o.customerEmail,
      phone: o.customerPhone,
      city: o.city,
      orders: 0,
      spent: 0,
      lastOrder: o.date,
    };
    entry.orders += 1;
    entry.spent += o.total;
    if (new Date(o.date) > new Date(entry.lastOrder)) entry.lastOrder = o.date;
    map.set(o.customerEmail, entry);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}
