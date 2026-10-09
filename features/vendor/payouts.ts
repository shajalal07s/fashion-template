import { z } from "zod";
import { PAYOUT_RULES } from "@/features/vendor/earnings";
import type { VendorPayout } from "@/features/vendor/vendor";

// Backend-owned payout configuration (mocked as config, never hardcoded in UI).
export const PAYOUT_CONFIG = {
  minimum: PAYOUT_RULES.minimum,
  maximum: 500000,
  feeFlat: PAYOUT_RULES.fee,
  feePct: 0,
  schedule: "Weekly · every Thursday",
  methods: ["Bank Transfer", "bKash", "Nagad", "Rocket"],
  providers: ["bKash", "Nagad", "Rocket"],
} as const;

export type PayoutMethod = (typeof PAYOUT_CONFIG.methods)[number];

export interface PayoutAccount {
  id: string;
  type: "bank" | "mobile" | "paypal" | "stripe";
  label: string;
  holder: string;
  bank?: string;
  branch?: string;
  masked: string;
  provider?: string;
  mobile?: string;
  verified: boolean;
  isDefault: boolean;
  updated: string;
}

export const demoPayoutAccounts: PayoutAccount[] = [
  {
    id: "pa-1", type: "bank", label: "Bank Account", holder: "Ayesha Rahman",
    bank: "Dutch-Bangla Bank", branch: "Banani", masked: "**** **** 4582",
    verified: true, isDefault: true, updated: "2026-09-10",
  },
  {
    id: "pa-2", type: "mobile", label: "Mobile Banking", holder: "Ayesha Rahman",
    provider: "bKash", mobile: "01711-223344", masked: "****1234",
    verified: true, isDefault: false, updated: "2026-09-12",
  },
];

export interface PayoutDetails extends VendorPayout {
  fee: number;
  net: number;
  account: string;
  txnId: string;
  reference: string;
  requested: string;
  expected: string;
  processed: string;
  completed: string;
  failureReason: string;
}

export function enrichPayout(p: VendorPayout): PayoutDetails {
  const fee = PAYOUT_CONFIG.feeFlat + Math.round(p.amount * (PAYOUT_CONFIG.feePct / 100));
  const isBank = p.method === "Bank Transfer";
  return {
    ...p,
    fee,
    net: Math.max(0, p.amount - fee),
    account: isBank ? "**** **** 4582" : p.method === "bKash" ? "****1234" : "***",
    txnId: `TXN-PO-${p.id.replace("PO-", "")}`,
    reference: `REF-${p.id}`,
    requested: p.date,
    expected: p.status === "completed" ? p.date : "2026-10-05",
    processed: p.status === "pending" ? "" : p.date,
    completed: p.status === "completed" ? p.date : "",
    failureReason: p.status === "failed" ? "Bank rejected the transfer. Verify account details." : "",
  };
}

export function payoutTimeline(d: PayoutDetails): Array<{ label: string; done: boolean; date: string }> {
  if (d.status === "failed") {
    return [
      { label: "Payout Requested", done: true, date: d.requested },
      { label: "Processing", done: true, date: d.processed || d.requested },
      { label: "Failed", done: true, date: d.processed || d.requested },
    ];
  }
  return [
    { label: "Payout Requested", done: true, date: d.requested },
    { label: "Under Review", done: d.status !== "pending", date: d.processed || d.expected },
    { label: "Processing", done: d.status === "completed", date: d.processed || d.expected },
    { label: "Completed", done: d.status === "completed", date: d.completed || d.expected },
  ];
}

export function payoutEligibility(args: {
  available: number;
  accountMissing: boolean;
  verified: boolean;
  disabled: boolean;
  hasPendingRestriction: boolean;
}): { ok: boolean; reason: string } {
  if (args.disabled) return { ok: false, reason: "Payouts are temporarily disabled." };
  if (!args.verified) return { ok: false, reason: "Vendor account is not verified." };
  if (args.accountMissing) return { ok: false, reason: "No verified payout account. Add one first." };
  if (args.hasPendingRestriction) return { ok: false, reason: "A payout restriction is active on this account." };
  if (args.available < PAYOUT_CONFIG.minimum)
    return { ok: false, reason: `Balance is below minimum payout of ৳${PAYOUT_CONFIG.minimum.toLocaleString()}.` };
  return { ok: true, reason: "Eligible" };
}

export const payoutRequestSchema = z.object({
  amount: z.number()
    .min(PAYOUT_CONFIG.minimum, `Minimum payout is ৳${PAYOUT_CONFIG.minimum}`)
    .max(PAYOUT_CONFIG.maximum, `Maximum payout is ৳${PAYOUT_CONFIG.maximum}`),
  method: z.enum(PAYOUT_CONFIG.methods as unknown as [string, ...string[]]),
  accountId: z.string().min(1, "Select a payout account"),
  note: z.string().max(200).optional(),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

export function maskAccount(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return `****${digits}`;
  return `**** **** ${digits.slice(-4)}`;
}
