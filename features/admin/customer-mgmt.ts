import type { AdminOrder } from "@/features/admin/analytics";

export type CustomerStatus = "active" | "inactive" | "blocked" | "pending";

export interface BlockInfo {
  reason: string;
  note: string;
  date: string;
}

export type ReviewStatus = "published" | "pending" | "hidden" | "reported" | "rejected";

export interface CustomerReview {
  id: string;
  email: string;
  customer: string;
  product: string;
  image: string;
  vendor: string;
  rating: number;
  text: string;
  date: string;
  status: ReviewStatus;
  response?: string;
}

export type WalletTxType =
  | "credit"
  | "debit"
  | "refund"
  | "cashback"
  | "adjustment"
  | "purchase"
  | "withdrawal";

export type WalletTxStatus = "completed" | "pending" | "failed" | "cancelled";

export interface WalletTx {
  id: string;
  type: WalletTxType;
  description: string;
  amount: number;
  balanceAfter: number;
  status: WalletTxStatus;
  date: string;
  reference: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  kind: "home" | "office" | "other";
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  isDefault: boolean;
  isBilling: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  entity?: string;
  status: "success" | "info" | "warning" | "danger";
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function defaultStatus(email: string): CustomerStatus {
  const h = hashStr(email.toLowerCase()) % 20;
  if (h === 0) return "blocked";
  if (h <= 2) return "inactive";
  if (h === 3) return "pending";
  return "active";
}

export function isVerified(email: string): boolean {
  return hashStr(`v:${email.toLowerCase()}`) % 5 !== 0;
}

const REVIEW_TEXTS = [
  "Fabric quality is excellent and delivery was faster than expected.",
  "Good fit, color is exactly like the pictures. Will order again.",
  "Average product, stitching could be better for the price.",
  "Loved the packaging and the product. Highly recommended seller.",
  "Size runs a bit small, exchange process was smooth though.",
  "Premium feel, worth every taka. My second purchase from this store.",
];

export function reviewsForCustomer(
  email: string,
  name: string,
  orders: AdminOrder[]
): CustomerReview[] {
  const mine = orders.filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase());
  const reviews: CustomerReview[] = [];
  mine.forEach((o, oi) => {
    o.items.slice(0, 2).forEach((item, ii) => {
      if ((hashStr(`${email}${o.id}${ii}`) % 3) === 2) return;
      const h = hashStr(`r:${email}${o.id}${ii}`);
      const statuses: ReviewStatus[] = ["published", "published", "published", "pending", "hidden", "reported"];
      reviews.push({
        id: `REV-${(h % 8000) + 1000}-${oi}${ii}`,
        email,
        customer: name,
        product: item.name,
        image: item.image,
        vendor: item.category,
        rating: 3 + (h % 3),
        text: REVIEW_TEXTS[h % REVIEW_TEXTS.length],
        date: o.date,
        status: statuses[h % statuses.length],
        response: h % 4 === 0 ? "Thank you for shopping with us! We appreciate your feedback." : undefined,
      });
    });
  });
  return reviews.slice(0, 8);
}

export function walletForCustomer(
  email: string,
  spent: number,
  orderCount: number
): { balance: number; txs: WalletTx[] } {
  const h = hashStr(`w:${email.toLowerCase()}`);
  const balance = Math.round(spent * (0.02 + ((h % 8) / 100)));
  const txs: WalletTx[] = [];
  let running = balance + 1200;
  const types: WalletTxType[] = ["cashback", "purchase", "refund", "credit", "purchase", "withdrawal"];
  for (let i = 0; i < Math.min(6, 2 + orderCount); i++) {
    const type = types[(h + i) % types.length];
    const amount = 100 + ((h >> (i + 2)) % 900);
    const debit = type === "purchase" || type === "withdrawal" || type === "debit";
    running = Math.max(0, running + (debit ? -amount : amount));
    const day = String(1 + ((h + i * 3) % 27)).padStart(2, "0");
    txs.push({
      id: `WTX-${(h % 7000) + 1000 + i}`,
      type,
      description:
        type === "cashback"
          ? "Cashback from order"
          : type === "refund"
            ? "Refund for returned item"
            : type === "withdrawal"
              ? "Withdraw to bKash"
              : type === "purchase"
                ? "Wallet payment for order"
                : "Balance top-up",
      amount: debit ? -amount : amount,
      balanceAfter: running,
      status: i === 0 && h % 5 === 0 ? "pending" : "completed",
      date: `2026-09-${day}`,
      reference: `ORD-${1030 + ((h + i) % 20)}`,
    });
  }
  return { balance, txs: txs.reverse() };
}

export function addressesForCustomer(
  name: string,
  phone: string,
  address: string,
  city: string
): CustomerAddress[] {
  return [
    {
      id: "addr-1",
      label: "Home",
      kind: "home",
      name,
      phone,
      line1: address || "House 12, Road 5",
      line2: "Block C",
      city: city || "Dhaka",
      state: "Dhaka",
      postal: "1212",
      country: "Bangladesh",
      isDefault: true,
      isBilling: true,
    },
    {
      id: "addr-2",
      label: "Office",
      kind: "office",
      name,
      phone,
      line1: "Level 4, Gulshan Avenue",
      line2: "",
      city: city || "Dhaka",
      state: "Dhaka",
      postal: "1212",
      country: "Bangladesh",
      isDefault: false,
      isBilling: false,
    },
  ];
}

const ACTIVITY_POOL: Array<{ type: string; status: ActivityItem["status"] }> = [
  { type: "login", status: "info" },
  { type: "profile_updated", status: "info" },
  { type: "password_changed", status: "warning" },
  { type: "email_verified", status: "success" },
  { type: "wishlist_added", status: "info" },
  { type: "product_viewed", status: "info" },
  { type: "address_added", status: "info" },
  { type: "review_submitted", status: "success" },
  { type: "wallet_credited", status: "success" },
];

export function activityForCustomer(
  email: string,
  name: string,
  orders: AdminOrder[]
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const mine = orders
    .filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  items.push({
    id: `${email}-created`,
    type: "account_created",
    title: "Account Created",
    description: `${name} created an account`,
    date: mine.length > 0 ? mine[mine.length - 1].date : "2026-06-01",
    time: "09:12 AM",
    status: "success",
  });
  mine.slice(0, 4).forEach((o, i) => {
    items.push({
      id: `${email}-order-${o.id}`,
      type: "order_created",
      title: "Order Created",
      description: `Order ${o.id} placed for ${o.total}`,
      date: o.date,
      time: "02:40 PM",
      entity: o.id,
      status: "info",
    });
    if (i % 2 === 0) {
      items.push({
        id: `${email}-delivered-${o.id}`,
        type: "order_delivered",
        title: "Order Delivered",
        description: `Order ${o.id} was delivered`,
        date: o.date,
        time: "05:15 PM",
        entity: o.id,
        status: "success",
      });
    }
  });
  const h = hashStr(`a:${email.toLowerCase()}`);
  ACTIVITY_POOL.forEach((a, i) => {
    if ((h >> i) % 2 === 0) return;
    const day = String(1 + ((h + i * 5) % 27)).padStart(2, "0");
    items.push({
      id: `${email}-act-${i}`,
      type: a.type,
      title: a.type.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
      description: `${name} · ${a.type.replace(/_/g, " ")}`,
      date: `2026-09-${day}`,
      time: "11:05 AM",
      status: a.status,
    });
  });
  return items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 20);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
