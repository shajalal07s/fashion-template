import { z } from "zod";
import type { VendorProduct, VendorReview } from "@/features/vendor/vendor";

// Backend-owned review policy (mocked as config).
export const REVIEW_POLICY = {
  lowRatingThreshold: 3,
  responseMin: 10,
  responseMax: 500,
  allowVendorPublish: false,
} as const;

export type EnrichedStatus = "published" | "pending" | "hidden" | "reported" | "removed";

export interface EnrichedReview extends VendorReview {
  title: string;
  productId: string;
  sku: string;
  image: string;
  images: string[];
  verified: boolean;
  helpful: number;
  reports: number;
  status: EnrichedStatus;
  orderId: string;
  responseDate: string;
}

const STATUS_BY_ID: Record<string, EnrichedStatus> = {
  vr1: "published", vr2: "published", vr3: "pending", vr4: "published", vr5: "reported",
};

export function enrichReviews(reviews: VendorReview[], products: VendorProduct[]): EnrichedReview[] {
  return reviews.map((r, i) => {
    const p = products.find((x) => x.name === r.product);
    return {
      ...r,
      title: r.rating >= 4 ? "Highly recommended" : r.rating === 3 ? "Average experience" : "Needs improvement",
      productId: p?.id ?? "",
      sku: p?.sku ?? "",
      image: p?.image ?? "/images/women/women-1.jpg",
      images: i % 2 === 0 ? [p?.image ?? "/images/women/women-1.jpg"] : [],
      verified: r.id !== "vr5",
      helpful: [24, 11, 6, 18, 3][i % 5],
      reports: r.id === "vr5" ? 2 : 0,
      status: STATUS_BY_ID[r.id] ?? "published",
      orderId: ["ORD-2031", "ORD-2039", "ORD-2036", "ORD-2031", "ORD-2028"][i % 5],
      responseDate: r.replied ? r.date : "",
    };
  });
}

export interface RatingDist {
  stars: number;
  count: number;
  pct: number;
}

export function ratingDistribution(reviews: Array<{ rating: number }>): RatingDist[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[5 - r.rating] += 1;
  }
  const total = Math.max(1, reviews.length);
  return counts.map((count, i) => ({ stars: 5 - i, count, pct: Math.round((count / total) * 100) }));
}

export function averageRating(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10;
}

export interface ProductRating {
  productId: string;
  name: string;
  image: string;
  sku: string;
  count: number;
  avg: number;
  dist: [number, number, number, number, number];
  positive: number;
  lastDate: string;
  trend: number;
}

export function productRatings(reviews: EnrichedReview[]): ProductRating[] {
  const map = new Map<string, ProductRating>();
  for (const r of reviews) {
    const row = map.get(r.product) ?? {
      productId: r.productId, name: r.product, image: r.image, sku: r.sku,
      count: 0, avg: 0, dist: [0, 0, 0, 0, 0] as [number, number, number, number, number],
      positive: 0, lastDate: r.date, trend: 0,
    };
    row.count += 1;
    row.avg = Math.round(((row.avg * (row.count - 1) + r.rating) / row.count) * 10) / 10;
    row.dist[5 - r.rating] += 1;
    if (r.rating >= 4) row.positive += 1;
    if (r.date > row.lastDate) row.lastDate = r.date;
    map.set(r.product, row);
  }
  return [...map.values()]
    .map((row) => ({ ...row, positive: Math.round((row.positive / Math.max(1, row.count)) * 100), trend: row.avg >= REVIEW_POLICY.lowRatingThreshold ? 1 : -1 }))
    .sort((a, b) => b.count - a.count);
}

export type FeedbackType = "product" | "store" | "delivery" | "packaging" | "service" | "general";
export type FeedbackStatus = "new" | "read" | "review" | "responded" | "resolved" | "archived";

export interface CustomerFeedback {
  id: string;
  customer: string;
  type: FeedbackType;
  product: string;
  productId: string;
  rating: number;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  status: FeedbackStatus;
  responded: boolean;
  reply?: string;
  date: string;
}

export const demoFeedback: CustomerFeedback[] = [
  { id: "fb-1", customer: "Nusrat Jahan", type: "delivery", product: "Printed Kurti - Red", productId: "vp1", rating: 4, text: "Delivery took a day longer than promised, but packaging was excellent.", sentiment: "neutral", status: "new", responded: false, date: "2026-09-24" },
  { id: "fb-2", customer: "Priya Das", type: "product", product: "Silk Saree - Green", productId: "vp3", rating: 5, text: "Fabric quality exceeded expectations. Will order again!", sentiment: "positive", status: "responded", responded: true, reply: "Thank you Priya! New colors arriving soon.", date: "2026-09-20" },
  { id: "fb-3", customer: "Sabbir Khan", type: "packaging", product: "Cotton Three-Piece", productId: "vp2", rating: 2, text: "Box arrived crushed. Product is fine but please improve packaging.", sentiment: "negative", status: "review", responded: false, date: "2026-09-16" },
  { id: "fb-4", customer: "Tania Sultana", type: "service", product: "Cotton Three-Piece", productId: "vp2", rating: 5, text: "Support helped me exchange size quickly. Very happy.", sentiment: "positive", status: "resolved", responded: true, reply: "Glad we could help, Tania!", date: "2026-09-23" },
];

export const reviewResponseSchema = z.object({
  response: z.string().min(REVIEW_POLICY.responseMin, `Minimum ${REVIEW_POLICY.responseMin} characters`).max(REVIEW_POLICY.responseMax, `Maximum ${REVIEW_POLICY.responseMax} characters`),
});

export const feedbackResponseSchema = z.object({
  response: z.string().min(5).max(500),
});

export function reviewTimeline(r: EnrichedReview): Array<{ label: string; date: string; done: boolean }> {
  return [
    { label: "Review Submitted", date: r.date, done: true },
    { label: r.status === "pending" ? "Awaiting Publish" : "Review Published", date: r.date, done: r.status !== "pending" },
    { label: "Vendor Responded", date: r.responseDate || r.date, done: r.replied },
    { label: "Customer Interaction", date: r.responseDate || r.date, done: r.replied && r.helpful > 10 },
  ];
}
