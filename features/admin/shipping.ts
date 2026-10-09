export type ShipStatus = "active" | "inactive" | "draft" | "scheduled";
export type ShipModel = "admin" | "vendor" | "hybrid";
export type RateKind = "flat" | "price" | "weight" | "quantity" | "distance" | "vendor";
export type ProviderType = "courier" | "local" | "international" | "pickup" | "3pl";

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  countries: string[];
  regions: string[];
  cities: string[];
  postals: string;
  methods: number;
  vendors: number;
  status: ShipStatus;
  priority: number;
  created: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  type: string;
  description: string;
  zones: string[];
  rateType: string;
  minDays: number;
  maxDays: number;
  note: string;
  vendors: number;
  status: ShipStatus;
  priority: number;
  freeShipping: boolean;
  pickup: boolean;
}

export interface ShippingRate {
  id: string;
  name: string;
  zone: string;
  method: string;
  kind: RateKind;
  condition: string;
  min: number;
  max: number;
  unit: string;
  cost: number;
  freeAbove: number;
  status: ShipStatus;
}

export interface VendorShipping {
  id: string;
  vendor: string;
  store: string;
  model: ShipModel;
  zone: string;
  methods: string[];
  rate: number;
  delivery: string;
  handlingFee: number;
  handlingKind: "fixed" | "percent";
  freeShipping: boolean;
  localDelivery: boolean;
  pickup: boolean;
  status: ShipStatus;
}

export interface DeliverySettings {
  defaultMethod: string;
  defaultTime: string;
  minDays: number;
  maxDays: number;
  processingHours: number;
  handlingHours: number;
  weekend: boolean;
  sameDay: boolean;
  nextDay: boolean;
  cutoff: string;
  businessDays: string[];
  restrictedCountries: string;
  restrictedRegions: string;
  restrictedPostals: string;
  freeEnabled: boolean;
  freeMinAmount: number;
  freeMinQty: number;
  freeZone: string;
  freeVendor: string;
  standardMin: number;
  standardMax: number;
  expressMin: number;
  expressMax: number;
}

export interface ShippingProvider {
  id: string;
  name: string;
  type: ProviderType;
  description: string;
  website: string;
  contact: string;
  coverage: string[];
  services: string[];
  minDays: number;
  maxDays: number;
  shipments: number;
  delivered: number;
  delayed: number;
  failed: number;
  avgDays: number;
  status: ShipStatus;
  isDefault: boolean;
}

export const demoZones: ShippingZone[] = [
  { id: "z1", name: "Dhaka Metro", description: "Same-day eligible metro area.", countries: ["Bangladesh"], regions: ["Dhaka"], cities: ["Dhaka", "Narayanganj", "Gazipur"], postals: "1000–1349", methods: 3, vendors: 24, status: "active", priority: 1, created: "2026-01-05" },
  { id: "z2", name: "Chattogram", description: "Port city and surroundings.", countries: ["Bangladesh"], regions: ["Chattogram"], cities: ["Chattogram", "Cox's Bazar"], postals: "4000–4399", methods: 3, vendors: 18, status: "active", priority: 2, created: "2026-01-05" },
  { id: "z3", name: "Other Cities", description: "All remaining districts.", countries: ["Bangladesh"], regions: ["Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh"], cities: ["Sylhet", "Rajshahi", "Khulna"], postals: "1400–9999", methods: 2, vendors: 21, status: "active", priority: 3, created: "2026-02-01" },
  { id: "z4", name: "Bangladesh", description: "Nationwide fallback zone.", countries: ["Bangladesh"], regions: ["All"], cities: ["All"], postals: "All", methods: 2, vendors: 30, status: "active", priority: 4, created: "2026-01-01" },
  { id: "z5", name: "South Asia", description: "India, Nepal, Bhutan, Pakistan.", countries: ["India", "Nepal", "Bhutan", "Pakistan"], regions: ["South Asia"], cities: [], postals: "—", methods: 1, vendors: 6, status: "scheduled", priority: 5, created: "2026-09-10" },
  { id: "z6", name: "International", description: "DHL/FedEx worldwide coverage.", countries: ["Worldwide"], regions: ["Global"], cities: [], postals: "—", methods: 1, vendors: 4, status: "inactive", priority: 6, created: "2026-03-01" },
];

export const demoMethods: ShippingMethod[] = [
  { id: "m1", name: "Standard Delivery", type: "Standard", description: "Affordable nationwide delivery.", zones: ["Dhaka Metro", "Chattogram", "Other Cities"], rateType: "Price Based", minDays: 2, maxDays: 5, note: "2–5 Business Days", vendors: 28, status: "active", priority: 1, freeShipping: false, pickup: false },
  { id: "m2", name: "Express Delivery", type: "Express", description: "Priority dispatch and routing.", zones: ["Dhaka Metro", "Chattogram"], rateType: "Flat Rate", minDays: 1, maxDays: 2, note: "1–2 Business Days", vendors: 19, status: "active", priority: 2, freeShipping: false, pickup: false },
  { id: "m3", name: "Free Shipping", type: "Free", description: "Free over ৳2,000.", zones: ["Dhaka Metro", "Bangladesh"], rateType: "Free Shipping", minDays: 3, maxDays: 7, note: "3–7 Business Days", vendors: 22, status: "active", priority: 3, freeShipping: true, pickup: false },
  { id: "m4", name: "Same Day Delivery", type: "Same Day", description: "Order before 5 PM cut-off.", zones: ["Dhaka Metro"], rateType: "Distance Based", minDays: 0, maxDays: 1, note: "Within 24 Hours", vendors: 9, status: "active", priority: 4, freeShipping: false, pickup: false },
  { id: "m5", name: "Store Pickup", type: "Pickup", description: "Collect from Gulshan outlet.", zones: ["Dhaka Metro"], rateType: "Free Shipping", minDays: 0, maxDays: 1, note: "Ready in 4 Hours", vendors: 5, status: "scheduled", priority: 5, freeShipping: true, pickup: true },
  { id: "m6", name: "Vendor Shipping", type: "Vendor", description: "Ships directly from vendor.", zones: ["Other Cities", "Bangladesh"], rateType: "Vendor Based", minDays: 3, maxDays: 7, note: "3–7 Business Days", vendors: 14, status: "inactive", priority: 6, freeShipping: false, pickup: false },
];

export const demoRates: ShippingRate[] = [
  { id: "rt1", name: "Dhaka Standard", zone: "Dhaka Metro", method: "Standard Delivery", kind: "flat", condition: "Flat", min: 0, max: 0, unit: "৳", cost: 60, freeAbove: 2000, status: "active" },
  { id: "rt2", name: "Nationwide 0-999", zone: "Bangladesh", method: "Standard Delivery", kind: "price", condition: "Order Amount", min: 0, max: 999, unit: "৳", cost: 80, freeAbove: 0, status: "active" },
  { id: "rt3", name: "Nationwide 1000+", zone: "Bangladesh", method: "Standard Delivery", kind: "price", condition: "Order Amount", min: 1000, max: 1999, unit: "৳", cost: 50, freeAbove: 2000, status: "active" },
  { id: "rt4", name: "Light Parcel 0-1KG", zone: "Dhaka Metro", method: "Express Delivery", kind: "weight", condition: "Weight", min: 0, max: 1, unit: "KG", cost: 80, freeAbove: 0, status: "active" },
  { id: "rt5", name: "Heavy Parcel 1-3KG", zone: "Dhaka Metro", method: "Express Delivery", kind: "weight", condition: "Weight", min: 1, max: 3, unit: "KG", cost: 120, freeAbove: 0, status: "scheduled" },
  { id: "rt6", name: "Small Pack 1-2", zone: "Chattogram", method: "Standard Delivery", kind: "quantity", condition: "Quantity", min: 1, max: 2, unit: "items", cost: 60, freeAbove: 0, status: "active" },
  { id: "rt7", name: "City 0-5KM", zone: "Dhaka Metro", method: "Same Day Delivery", kind: "distance", condition: "Distance", min: 0, max: 5, unit: "KM", cost: 50, freeAbove: 0, status: "active" },
  { id: "rt8", name: "Vendor Direct", zone: "Other Cities", method: "Vendor Shipping", kind: "vendor", condition: "Vendor", min: 0, max: 0, unit: "৳", cost: 100, freeAbove: 0, status: "inactive" },
];

export const demoVendorShipping: VendorShipping[] = [
  { id: "vs1", vendor: "Ayesha Rahman", store: "Ayesha Boutique", model: "hybrid", zone: "Dhaka Metro", methods: ["Standard", "Express", "Free Shipping"], rate: 60, delivery: "2–4 Days", handlingFee: 20, handlingKind: "fixed", freeShipping: true, localDelivery: true, pickup: false, status: "active" },
  { id: "vs2", vendor: "Karim Traders", store: "Karim Wholesale", model: "vendor", zone: "Bangladesh", methods: ["Standard", "Vendor Shipping"], rate: 100, delivery: "3–7 Days", handlingFee: 2, handlingKind: "percent", freeShipping: false, localDelivery: false, pickup: true, status: "active" },
  { id: "vs3", vendor: "Nusrat Jahan", store: "Nusrat Fashion", model: "admin", zone: "Dhaka Metro", methods: ["Standard", "Same Day"], rate: 60, delivery: "1–3 Days", handlingFee: 0, handlingKind: "fixed", freeShipping: true, localDelivery: true, pickup: true, status: "active" },
  { id: "vs4", vendor: "Sadia Afrin", store: "Sadia Kids", model: "admin", zone: "Other Cities", methods: ["Standard"], rate: 80, delivery: "3–5 Days", handlingFee: 0, handlingKind: "fixed", freeShipping: false, localDelivery: false, pickup: false, status: "inactive" },
];

export const defaultDeliverySettings: DeliverySettings = {
  defaultMethod: "Standard Delivery",
  defaultTime: "2–5 Days",
  minDays: 1,
  maxDays: 7,
  processingHours: 24,
  handlingHours: 12,
  weekend: true,
  sameDay: true,
  nextDay: true,
  cutoff: "17:00",
  businessDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  restrictedCountries: "",
  restrictedRegions: "",
  restrictedPostals: "",
  freeEnabled: true,
  freeMinAmount: 2000,
  freeMinQty: 3,
  freeZone: "Dhaka Metro",
  freeVendor: "All Vendors",
  standardMin: 2,
  standardMax: 5,
  expressMin: 1,
  expressMax: 2,
};

export const demoProviders: ShippingProvider[] = [
  { id: "sp1", name: "Pathao", type: "courier", description: "Largest on-demand courier network.", website: "pathao.com", contact: "09612-727272", coverage: ["Dhaka Metro", "Chattogram", "Other Cities"], services: ["Standard", "Express", "Same Day"], minDays: 1, maxDays: 3, shipments: 18400, delivered: 17200, delayed: 900, failed: 300, avgDays: 1.8, status: "active", isDefault: true },
  { id: "sp2", name: "Steadfast", type: "courier", description: "E-commerce focused delivery.", website: "steadfast.com.bd", contact: "09678-045045", coverage: ["Bangladesh"], services: ["Standard", "Express"], minDays: 2, maxDays: 4, shipments: 12600, delivered: 11900, delayed: 500, failed: 200, avgDays: 2.4, status: "active", isDefault: false },
  { id: "sp3", name: "RedX", type: "courier", description: "Tech-driven logistics.", website: "redx.com.bd", contact: "09610-073073", coverage: ["Dhaka Metro", "Chattogram"], services: ["Standard", "Same Day", "Next Day"], minDays: 1, maxDays: 2, shipments: 9800, delivered: 9100, delayed: 600, failed: 100, avgDays: 1.5, status: "active", isDefault: false },
  { id: "sp4", name: "Sundarban Courier", type: "courier", description: "Nationwide traditional courier.", website: "sundarbancourier.com", contact: "02-9562459", coverage: ["Bangladesh"], services: ["Standard"], minDays: 3, maxDays: 7, shipments: 7200, delivered: 6700, delayed: 400, failed: 100, avgDays: 3.8, status: "inactive", isDefault: false },
  { id: "sp5", name: "DHL", type: "international", description: "Global express shipping.", website: "dhl.com", contact: "+880-2-9885571", coverage: ["Worldwide"], services: ["International", "Express"], minDays: 3, maxDays: 6, shipments: 1400, delivered: 1350, delayed: 40, failed: 10, avgDays: 4.1, status: "scheduled", isDefault: false },
];

export function previewShippingCost(orderValue: number, weight: number, qty: number, method: string): number {
  if (method.includes("Free") && orderValue >= 2000) return 0;
  if (method.includes("Express")) return weight <= 1 ? 80 : 120;
  if (method.includes("Same Day")) return 50 + Math.min(70, Math.round(weight * 20));
  if (orderValue >= 2000) return 0;
  if (orderValue >= 1000) return 50;
  const qtyFee = qty <= 2 ? 60 : qty <= 5 ? 90 : 120;
  return Math.max(60, qtyFee);
}

export function shipmentsTrend(): Array<{ x: string; y: number }> {
  return [
    { x: "Apr", y: 8200 }, { x: "May", y: 9400 }, { x: "Jun", y: 8800 },
    { x: "Jul", y: 10200 }, { x: "Aug", y: 11800 }, { x: "Sep", y: 9600 },
  ];
}
