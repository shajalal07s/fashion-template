export type ReviewStatus = "published" | "pending" | "rejected" | "hidden" | "reported";
export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";
export type ReviewPriority = "normal" | "high" | "urgent";
export type ReviewKind = "product" | "vendor";

export interface ProductReview {
  id: string;
  customer: string;
  email: string;
  product: string;
  sku: string;
  image: string;
  vendor: string;
  rating: number;
  title: string;
  text: string;
  images: number;
  date: string;
  updated: string;
  status: ReviewStatus;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  reports: number;
  moderationReason?: string;
  moderationDate?: string;
}

export interface VendorReview {
  id: string;
  customer: string;
  email: string;
  vendor: string;
  store: string;
  rating: number;
  text: string;
  orderId: string;
  orderDate: string;
  orderAmount: number;
  date: string;
  status: ReviewStatus;
  verified: boolean;
  reports: number;
  moderationReason?: string;
  moderationDate?: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  kind: ReviewKind;
  customer: string;
  target: string;
  rating: number;
  text: string;
  reportedBy: string;
  reporterType: string;
  reason: string;
  explanation: string;
  date: string;
  reviewStatus: ReviewStatus;
  status: ReportStatus;
}

export interface ModerationEvent {
  event: string;
  date: string;
  user: string;
  description: string;
}

export const demoProductReviews: ProductReview[] = [
  { id: "PR-101", customer: "Ayesha Rahman", email: "ayesha@mail.com", product: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", vendor: "Ayesha Boutique", rating: 5, title: "Excellent sound and fit", text: "Fabric quality is excellent and delivery was faster than expected. The color is exactly like the pictures.", images: 3, date: "2026-09-20", updated: "2026-09-20", status: "published", verified: true, helpful: 24, notHelpful: 1, reports: 0 },
  { id: "PR-102", customer: "Karim Uddin", email: "karim@mail.com", product: "Denim Shirt - Blue", sku: "M-SHI-014", image: "/images/men/men-2.jpg", vendor: "Karim Wholesale", rating: 4, title: "Good value", text: "Good fit for the price. Stitching could be slightly better but overall satisfied.", images: 1, date: "2026-09-19", updated: "2026-09-19", status: "published", verified: true, helpful: 11, notHelpful: 2, reports: 0 },
  { id: "PR-103", customer: "Nusrat Jahan", email: "nusrat@mail.com", product: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", vendor: "Nusrat Fashion", rating: 5, title: "Premium feel", text: "Premium feel, worth every taka. Loved the packaging. Highly recommended seller.", images: 4, date: "2026-09-18", updated: "2026-09-18", status: "pending", verified: true, helpful: 0, notHelpful: 0, reports: 0 },
  { id: "PR-104", customer: "Tanvir Hasan", email: "tanvir@mail.com", product: "Classic Panjabi - White", sku: "M-PAN-012", image: "/images/men/men-1.jpg", vendor: "TH Lifestyle", rating: 2, title: "Size issue", text: "Size runs small and the color faded after first wash. Exchange process was smooth though.", images: 2, date: "2026-09-17", updated: "2026-09-18", status: "reported", verified: true, helpful: 5, notHelpful: 8, reports: 3, moderationReason: "Under review", moderationDate: "2026-09-18" },
  { id: "PR-105", customer: "Sadia Afrin", email: "sadia@mail.com", product: "Kids Eid Set", sku: "K-EID-003", image: "/images/kids/kids-1.jpg", vendor: "Sadia Kids", rating: 5, title: "Kids loved it", text: "My daughter loved the dress. Soft fabric, perfect for sensitive skin.", images: 2, date: "2026-09-15", updated: "2026-09-15", status: "published", verified: true, helpful: 18, notHelpful: 0, reports: 0 },
  { id: "PR-106", customer: "Rahim Uddin", email: "rahim@mail.com", product: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", vendor: "Dhaka Boutique", rating: 1, title: "Fake product?", text: "This looks fake, totally different from pictures. Do not buy from this seller!!! cheap cheap cheap.", images: 0, date: "2026-09-14", updated: "2026-09-14", status: "reported", verified: false, helpful: 2, notHelpful: 15, reports: 5, moderationReason: "Suspected fake review", moderationDate: "2026-09-15" },
  { id: "PR-107", customer: "Jannatul Ferdous", email: "jannatul@mail.com", product: "Baby Frock - Pink", sku: "K-FRK-007", image: "/images/kids/kids-2.jpg", vendor: "Sadia Kids", rating: 4, title: "Cute and comfy", text: "Cute design, comfortable for my baby. Delivery took one extra day.", images: 1, date: "2026-09-12", updated: "2026-09-12", status: "published", verified: true, helpful: 7, notHelpful: 1, reports: 0 },
  { id: "PR-108", customer: "Mim Chowdhury", email: "mim@mail.com", product: "Printed Kurti - Red", sku: "W-KUR-001", image: "/images/women/women-1.jpg", vendor: "Ayesha Boutique", rating: 3, title: "Average", text: "Average product. Visit my page for more deals and discounts, best prices guaranteed!", images: 0, date: "2026-09-11", updated: "2026-09-11", status: "hidden", verified: false, helpful: 1, notHelpful: 4, reports: 2, moderationReason: "Promotional content", moderationDate: "2026-09-12" },
  { id: "PR-109", customer: "Rakib Hasan", email: "rakib@mail.com", product: "Denim Shirt - Blue", sku: "M-SHI-014", image: "/images/men/men-2.jpg", vendor: "Karim Wholesale", rating: 5, title: "Perfect shirt", text: "Perfect fitting shirt, great denim quality. Will order more colors.", images: 0, date: "2026-09-10", updated: "2026-09-10", status: "pending", verified: true, helpful: 0, notHelpful: 0, reports: 0 },
  { id: "PR-110", customer: "Priya Das", email: "priya@mail.com", product: "Silk Saree - Green", sku: "W-SAR-008", image: "/images/women/women-2.jpg", vendor: "Nusrat Fashion", rating: 5, title: "Beautiful saree", text: "Beautiful drape and rich color. Got many compliments at the event.", images: 5, date: "2026-09-08", updated: "2026-09-08", status: "published", verified: true, helpful: 31, notHelpful: 2, reports: 0 },
  { id: "PR-111", customer: "Fahim Ahmed", email: "fahim@mail.com", product: "Classic Panjabi - White", sku: "M-PAN-012", image: "/images/men/men-1.jpg", vendor: "TH Lifestyle", rating: 1, title: "Terrible", text: "Worst purchase ever. Seller is a fraud, phone number 01XXXXXXXXX call me.", images: 0, date: "2026-09-06", updated: "2026-09-06", status: "rejected", verified: false, helpful: 0, notHelpful: 9, reports: 4, moderationReason: "Personal information", moderationDate: "2026-09-07" },
  { id: "PR-112", customer: "Tania Sultana", email: "tania@mail.com", product: "Cotton Three-Piece", sku: "W-3PC-030", image: "/images/women/women-3.jpg", vendor: "Dhaka Boutique", rating: 4, title: "Nice set", text: "Nice three-piece set, comfortable cotton. Colors matched the catalog.", images: 2, date: "2026-09-04", updated: "2026-09-04", status: "published", verified: true, helpful: 9, notHelpful: 1, reports: 0 },
  { id: "PR-113", customer: "Sabbir Khan", email: "sabbir@mail.com", product: "Kids Eid Set", sku: "K-EID-003", image: "/images/kids/kids-1.jpg", vendor: "Sadia Kids", rating: 2, title: "Not as expected", text: "Misleading information in description, actual size chart is wrong.", images: 1, date: "2026-09-02", updated: "2026-09-02", status: "pending", verified: true, helpful: 3, notHelpful: 1, reports: 1 },
  { id: "PR-114", customer: "Lima Akter", email: "lima@mail.com", product: "Baby Frock - Pink", sku: "K-FRK-007", image: "/images/kids/kids-2.jpg", vendor: "Sadia Kids", rating: 5, title: "Adorable", text: "Adorable frock, soft material. Quick delivery to Chattogram.", images: 3, date: "2026-08-30", updated: "2026-08-30", status: "published", verified: true, helpful: 14, notHelpful: 0, reports: 0 },
];

export const demoVendorReviews: VendorReview[] = [
  { id: "VR-201", customer: "Ayesha Rahman", email: "ayesha@mail.com", vendor: "Karim Traders", store: "Karim Wholesale", rating: 5, text: "Fast delivery and excellent communication. Bulk order handled professionally.", orderId: "ORD-1041", orderDate: "2026-09-19", orderAmount: 3980, date: "2026-09-20", status: "published", verified: true, reports: 0 },
  { id: "VR-202", customer: "Tanvir Hasan", email: "tanvir@mail.com", vendor: "Nusrat Jahan", store: "Nusrat Fashion", rating: 4, text: "Good packaging, slight delay in shipping but support was responsive.", orderId: "ORD-1040", orderDate: "2026-09-18", orderAmount: 6850, date: "2026-09-19", status: "published", verified: true, reports: 0 },
  { id: "VR-203", customer: "Rahim Uddin", email: "rahim@mail.com", vendor: "TH Lifestyle", store: "TH Lifestyle", rating: 1, text: "Fraud seller!!! Never buy from them, they cheat customers.", orderId: "ORD-1039", orderDate: "2026-09-17", orderAmount: 3490, date: "2026-09-18", status: "reported", verified: false, reports: 4, moderationReason: "Harassment", moderationDate: "2026-09-18" },
  { id: "VR-204", customer: "Sadia Afrin", email: "sadia@mail.com", vendor: "Dhaka Boutique", store: "Dhaka Boutique", rating: 5, text: "Wonderful store, authentic products and quick refunds when needed.", orderId: "ORD-1038", orderDate: "2026-09-15", orderAmount: 6500, date: "2026-09-16", status: "published", verified: true, reports: 0 },
  { id: "VR-205", customer: "Mim Chowdhury", email: "mim@mail.com", vendor: "Sadia Kids", store: "Sadia Kids", rating: 3, text: "Average experience, check my shop for better kids wear deals!", orderId: "ORD-1037", orderDate: "2026-09-14", orderAmount: 1890, date: "2026-09-15", status: "pending", verified: true, reports: 1 },
  { id: "VR-206", customer: "Fahim Ahmed", email: "fahim@mail.com", vendor: "JF Accessories", store: "JF Accessories", rating: 2, text: "Product was okay but delivery took 9 days with no updates.", orderId: "ORD-1036", orderDate: "2026-09-12", orderAmount: 1290, date: "2026-09-13", status: "hidden", verified: true, reports: 0, moderationReason: "Irrelevant content", moderationDate: "2026-09-14" },
  { id: "VR-207", customer: "Priya Das", email: "priya@mail.com", vendor: "RU Electronics", store: "RU Electronics", rating: 4, text: "Genuine products, fair prices. Will shop again.", orderId: "ORD-1035", orderDate: "2026-09-11", orderAmount: 3980, date: "2026-09-12", status: "published", verified: true, reports: 0 },
  { id: "VR-208", customer: "Sabbir Khan", email: "sabbir@mail.com", vendor: "Ayesha Boutique", store: "Ayesha Boutique", rating: 5, text: "Best boutique online! Stitching quality is top class.", orderId: "ORD-1034", orderDate: "2026-09-10", orderAmount: 3250, date: "2026-09-11", status: "rejected", verified: false, reports: 2, moderationReason: "Fake review", moderationDate: "2026-09-12" },
];

export const demoReviewReports: ReviewReport[] = [
  { id: "RP-301", reviewId: "PR-106", kind: "product", customer: "Rahim Uddin", target: "Cotton Three-Piece", rating: 1, text: "This looks fake, totally different from pictures.", reportedBy: "Dhaka Boutique", reporterType: "Vendor", reason: "Fake Review", explanation: "Customer never purchased this variant; order shows different SKU.", date: "2026-09-15", reviewStatus: "reported", status: "open" },
  { id: "RP-302", reviewId: "PR-104", kind: "product", customer: "Tanvir Hasan", target: "Classic Panjabi - White", rating: 2, text: "Size runs small and the color faded after first wash.", reportedBy: "Karim Uddin", reporterType: "Customer", reason: "Misleading Information", explanation: "Review mentions a different product color than ordered.", date: "2026-09-18", reviewStatus: "reported", status: "under_review" },
  { id: "RP-303", reviewId: "PR-111", kind: "product", customer: "Fahim Ahmed", target: "Classic Panjabi - White", rating: 1, text: "Worst purchase ever. Seller is a fraud.", reportedBy: "Admin", reporterType: "Admin", reason: "Personal Information", explanation: "Review contains a phone number.", date: "2026-09-07", reviewStatus: "rejected", status: "resolved" },
  { id: "RP-304", reviewId: "VR-203", kind: "vendor", customer: "Rahim Uddin", target: "TH Lifestyle", rating: 1, text: "Fraud seller! Never buy from them.", reportedBy: "TH Lifestyle", reporterType: "Vendor", reason: "Harassment", explanation: "Abusive language toward the seller.", date: "2026-09-18", reviewStatus: "reported", status: "open" },
  { id: "RP-305", reviewId: "PR-108", kind: "product", customer: "Mim Chowdhury", target: "Printed Kurti - Red", rating: 3, text: "Average product. Visit my page for more deals!", reportedBy: "System", reporterType: "System", reason: "Promotional Content", explanation: "Auto-flagged promotional link pattern.", date: "2026-09-12", reviewStatus: "hidden", status: "dismissed" },
];

export const REPORT_REASONS = [
  "Spam",
  "Offensive Language",
  "Fake Review",
  "Misleading Information",
  "Personal Information",
  "Harassment",
  "Irrelevant Content",
  "Promotional Content",
  "Other",
];

export const MODERATION_REASONS = [
  "Spam",
  "Offensive Content",
  "Fake Review",
  "Irrelevant Review",
  "Promotional Content",
  "Policy Violation",
  "Other",
];

export function reviewPriority(reports: number, status: ReviewStatus, date: string): "normal" | "high" | "urgent" {
  const ageDays = Math.max(0, Math.round((Date.now() - +new Date(date)) / 86400000));
  if (reports >= 4 || (status === "reported" && ageDays > 7)) return "urgent";
  if (reports >= 2 || ageDays > 4) return "high";
  return "normal";
}

export function ratingDistribution(reviews: Array<{ rating: number }>): Array<{ stars: number; count: number; pct: number }> {
  const total = Math.max(1, reviews.length);
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return { stars, count, pct: Math.round((count / total) * 100) };
  });
}

export function averageRating(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10;
}

export function reviewsTrend(): Array<{ x: string; y: number }> {
  return [
    { x: "Apr", y: 42 }, { x: "May", y: 58 }, { x: "Jun", y: 51 },
    { x: "Jul", y: 67 }, { x: "Aug", y: 84 }, { x: "Sep", y: 96 },
  ];
}

export function moderationHistoryFor(date: string, status: ReviewStatus): ModerationEvent[] {
  const events: ModerationEvent[] = [
    { event: "Review submitted", date, user: "Customer", description: "Review submitted for moderation." },
  ];
  if (status === "reported") {
    events.push({ event: "Flagged by reporter", date, user: "Reporter", description: "Review was reported and flagged." });
    events.push({ event: "Moved to moderation", date, user: "System", description: "Review moved to the moderation queue." });
  }
  if (status === "published") events.push({ event: "Approved by Admin", date, user: "Admin", description: "Review approved and published." });
  if (status === "rejected") events.push({ event: "Rejected by Admin", date, user: "Admin", description: "Review rejected per policy." });
  if (status === "hidden") events.push({ event: "Hidden by Admin", date, user: "Admin", description: "Review hidden from storefront." });
  return events;
}
