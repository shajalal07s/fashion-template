import type { VendorOrder, VendorPayout, VendorProduct } from "@/features/vendor/vendor";

/**
 * Vendor financial business logic.
 * Pure, deterministic derivations from orders / payouts / products.
 * In production these values would come from backend APIs scoped to the
 * authenticated vendor — the frontend never invents balances.
 */

// Backend-owned payout / settlement rules (mocked here as config).
export const PAYOUT_RULES = {
  minimum: 5000,
  fee: 0,
  holdDays: 7,
  eligibleWeekday: "Thursday",
} as const;

export interface CommissionRule {
  scope: string;
  rate: number;
  note: string;
}

// Backend-owned commission configuration — never hardcoded in UI.
export const COMMISSION_RULES: CommissionRule[] = [
  { scope: "Default", rate: 12, note: "Standard marketplace rate" },
  { scope: "Women / Kurtis", rate: 12, note: "Apparel rate" },
  { scope: "Saree / Silk", rate: 11, note: "Festive category rate" },
  { scope: "Accessories", rate: 10, note: "Low-ticket rate" },
];

export type TxnType =
  | "sale"
  | "commission"
  | "refund"
  | "payout"
  | "adjustment"
  | "bonus"
  | "penalty"
  | "withdrawal"
  | "chargeback";

export type TxnStatus =
  | "completed"
  | "pending"
  | "processing"
  | "failed"
  | "cancelled"
  | "reversed";

export interface VendorTransaction {
  id: string;
  date: string;
  updated: string;
  type: TxnType;
  status: TxnStatus;
  description: string;
  orderId: string;
  payoutId: string;
  refundId: string;
  product: string;
  customer: string;
  gross: number;
  fee: number;
  commission: number;
  net: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface EarningsSummary {
  gross: number;
  discounts: number;
  refunds: number;
  shipping: number;
  tax: number;
  commission: number;
  net: number;
  released: number;
  pending: number;
  available: number;
  withdrawn: number;
  pendingWithdrawal: number;
  withdrawable: number;
  shortfall: number;
  totalOrders: number;
  totalSales: number;
  avgRate: number;
  monthCommission: number;
  yearCommission: number;
  commissionRefunds: number;
}

const toTime = (iso: string) => (iso ? +new Date(iso) : 0);

function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function earningsSummary(orders: VendorOrder[], payouts: VendorPayout[]): EarningsSummary {
  const live = orders.filter((o) => !o.archived && o.status !== "cancelled");
  const gross = live.reduce((n, o) => n + o.total, 0);
  const discounts = live.reduce((n, o) => n + o.discount + o.coupon, 0);
  const refunds = orders.reduce((n, o) => n + (o.refunded || 0), 0);
  const shipping = live.reduce((n, o) => n + o.shipping, 0);
  const tax = live.reduce((n, o) => n + o.tax, 0);
  const commission = live.reduce((n, o) => n + o.commission, 0);
  const net = live.reduce((n, o) => n + o.earning, 0);
  const released = orders
    .filter((o) => !o.archived && o.status === "completed" && o.payStatus === "paid")
    .reduce((n, o) => n + o.earning, 0);
  const pending = orders
    .filter((o) => !o.archived && ["pending", "processing", "shipped"].includes(o.status))
    .reduce((n, o) => n + o.earning, 0);
  const withdrawn = payouts
    .filter((p) => p.status === "completed")
    .reduce((n, p) => n + p.amount, 0);
  const pendingWithdrawal = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((n, p) => n + p.amount, 0);
  const available = Math.max(0, released - withdrawn);
  const withdrawable = Math.max(0, available - PAYOUT_RULES.fee);
  const shortfall = Math.max(0, PAYOUT_RULES.minimum - withdrawable);
  const monthCommission = live
    .filter((o) => o.date.startsWith("2026-09"))
    .reduce((n, o) => n + o.commission, 0);
  const yearCommission = live
    .filter((o) => o.date.startsWith("2026"))
    .reduce((n, o) => n + o.commission, 0);
  const avgRate = gross > 0 ? Math.round((commission / gross) * 1000) / 10 : 0;
  return {
    gross, discounts, refunds, shipping, tax, commission, net,
    released, pending, available, withdrawn, pendingWithdrawal,
    withdrawable, shortfall,
    totalOrders: live.length,
    totalSales: gross,
    avgRate, monthCommission, yearCommission,
    commissionRefunds: 0,
  };
}

export interface PendingRelease {
  orderId: string;
  customer: string;
  earning: number;
  status: string;
  reason: string;
  expected: string;
}

export function pendingReleases(orders: VendorOrder[]): PendingRelease[] {
  const reasonFor = (o: VendorOrder): string => {
    if (o.status === "pending") return "Order still processing";
    if (o.status === "processing") return "Order not delivered";
    if (o.status === "shipped") return "Settlement period";
    return "Payment verification";
  };
  return orders
    .filter((o) => !o.archived && ["pending", "processing", "shipped"].includes(o.status))
    .map((o) => ({
      orderId: o.id,
      customer: o.customer,
      earning: o.earning,
      status: o.status,
      reason: reasonFor(o),
      expected: addDays(o.date || o.updated, PAYOUT_RULES.holdDays),
    }))
    .sort((a, b) => a.expected.localeCompare(b.expected));
}

export function buildVendorTransactions(
  orders: VendorOrder[],
  payouts: VendorPayout[]
): VendorTransaction[] {
  const rows: Array<Omit<VendorTransaction, "id" | "balanceBefore" | "balanceAfter">> = [];
  const ordered = [...orders].filter((o) => !o.archived).sort((a, b) => toTime(a.date) - toTime(b.date));
  for (const o of ordered) {
    rows.push({
      date: o.date, updated: o.updated, type: "sale", status: o.status === "cancelled" ? "cancelled" : o.payStatus === "paid" ? "completed" : "pending",
      description: `Sale — ${o.items[0]?.name ?? "Order"}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}`,
      orderId: o.id, payoutId: "", refundId: "", product: o.items[0]?.name ?? "", customer: o.customer,
      gross: o.total, fee: 0, commission: 0, net: o.earning,
    });
    if (o.commission > 0 && o.status !== "cancelled") {
      rows.push({
        date: o.date, updated: o.updated, type: "commission", status: o.payStatus === "paid" ? "completed" : "pending",
        description: `Commission — ${o.id}`,
        orderId: o.id, payoutId: "", refundId: "", product: o.items[0]?.name ?? "", customer: o.customer,
        gross: 0, fee: 0, commission: o.commission, net: -o.commission,
      });
    }
    if ((o.refunded || 0) > 0) {
      rows.push({
        date: o.updated, updated: o.updated, type: "refund", status: "completed",
        description: `Refund — ${o.id}${o.cancelReason ? ` (${o.cancelReason})` : ""}`,
        orderId: o.id, payoutId: "", refundId: `RF-${o.id}`, product: o.items[0]?.name ?? "", customer: o.customer,
        gross: 0, fee: 0, commission: 0, net: -(o.refunded || 0),
      });
    }
  }
  const payoutRows = [...payouts].sort((a, b) => toTime(a.date) - toTime(b.date));
  for (const p of payoutRows) {
    rows.push({
      date: p.date, updated: p.date, type: "payout",
      status: p.status === "completed" ? "completed" : p.status === "failed" ? "failed" : p.status === "processing" ? "processing" : "pending",
      description: `Payout — ${p.method}`,
      orderId: "", payoutId: p.id, refundId: "", product: "", customer: "",
      gross: 0, fee: PAYOUT_RULES.fee, commission: 0, net: -p.amount,
    });
  }
  rows.sort((a, b) => toTime(b.date) - toTime(a.date) || b.type.localeCompare(a.type));
  let balance = 0;
  const withBalance = [...rows].reverse().map((r, i) => ({
    ...r,
    id: `TXN-${1001 + i}`,
    balanceBefore: 0,
    balanceAfter: 0,
  }));
  for (const r of withBalance) {
    r.balanceBefore = balance;
    balance = Math.round((balance + r.net) * 100) / 100;
    r.balanceAfter = balance;
  }
  return withBalance.reverse();
}

export interface BalanceRow {
  date: string;
  opening: number;
  credits: number;
  debits: number;
  payouts: number;
  refunds: number;
  closing: number;
}

export function balanceHistory(txns: VendorTransaction[]): BalanceRow[] {
  const byDate = new Map<string, BalanceRow>();
  const asc = [...txns].sort((a, b) => toTime(a.date) - toTime(b.date));
  let running = 0;
  for (const t of asc) {
    const row = byDate.get(t.date) ?? {
      date: t.date, opening: running, credits: 0, debits: 0, payouts: 0, refunds: 0, closing: running,
    };
    if (t.type === "sale") row.credits += t.net;
    else if (t.type === "payout") row.payouts += -t.net;
    else if (t.type === "refund") row.refunds += -t.net;
    else row.debits += -t.net;
    running = Math.round((running + t.net) * 100) / 100;
    row.closing = running;
    byDate.set(t.date, row);
  }
  return [...byDate.values()].sort((a, b) => toTime(b.date) - toTime(a.date));
}

export interface PeriodRow {
  period: string;
  sales: number;
  commission: number;
  earnings: number;
  orders: number;
}

export function earningsByMonth(orders: VendorOrder[]): PeriodRow[] {
  const map = new Map<string, PeriodRow>();
  for (const o of orders.filter((x) => !x.archived && x.status !== "cancelled")) {
    const key = o.date.slice(0, 7);
    const row = map.get(key) ?? { period: key, sales: 0, commission: 0, earnings: 0, orders: 0 };
    row.sales += o.total;
    row.commission += o.commission;
    row.earnings += o.earning;
    row.orders += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export interface ProductEarning {
  sku: string;
  name: string;
  image: string;
  units: number;
  gross: number;
  discounts: number;
  refunds: number;
  commission: number;
  net: number;
  productId: string;
}

export function productEarnings(orders: VendorOrder[], products: VendorProduct[]): ProductEarning[] {
  const map = new Map<string, ProductEarning>();
  for (const o of orders.filter((x) => !x.archived && x.status !== "cancelled")) {
    const orderRate = o.total > 0 ? o.commission / o.total : 0;
    for (const item of o.items) {
      const prod = products.find((p) => p.sku === item.sku);
      const row = map.get(item.sku) ?? {
        sku: item.sku, name: item.name, image: item.image,
        units: 0, gross: 0, discounts: 0, refunds: 0, commission: 0, net: 0,
        productId: prod?.id ?? "",
      };
      const line = item.price * item.qty;
      row.units += item.qty;
      row.gross += line;
      row.commission += Math.round(line * orderRate);
      row.net += Math.round(line * (1 - orderRate));
      map.set(item.sku, row);
    }
  }
  return [...map.values()].sort((a, b) => b.net - a.net);
}

export interface FinanceEvent {
  event: string;
  amount: number;
  date: string;
  ref: string;
  kind: "credit" | "debit" | "info";
}

export function financialActivity(
  orders: VendorOrder[],
  payouts: VendorPayout[]
): FinanceEvent[] {
  const events: FinanceEvent[] = [];
  for (const o of orders.filter((x) => !x.archived)) {
    events.push({ event: "Sale added", amount: o.earning, date: o.date, ref: o.id, kind: "credit" });
    if (o.commission > 0) events.push({ event: "Commission deducted", amount: -o.commission, date: o.date, ref: o.id, kind: "debit" });
    if (o.status === "completed") events.push({ event: "Earnings released", amount: o.earning, date: o.updated, ref: o.id, kind: "credit" });
    if ((o.refunded || 0) > 0) events.push({ event: "Refund deducted", amount: -(o.refunded || 0), date: o.updated, ref: o.id, kind: "debit" });
  }
  for (const p of payouts) {
    events.push({
      event: p.status === "completed" ? "Payout completed" : p.status === "failed" ? "Payout failed" : "Payout requested",
      amount: -p.amount, date: p.date, ref: p.id, kind: p.status === "failed" ? "info" : "debit",
    });
  }
  return events.sort((a, b) => toTime(b.date) - toTime(a.date)).slice(0, 12);
}

export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>): void {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
