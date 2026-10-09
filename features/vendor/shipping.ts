import { z } from "zod";

// Platform-owned shipping configuration (mocked as config; backend-authoritative in production).
export const SHIPPING_CONFIG = {
  calcTypes: ["flat", "perItem", "weight", "price", "free", "zone"] as const,
  methods: ["Standard Delivery", "Express Delivery", "Same-Day Delivery", "Next-Day Delivery", "Local Pickup", "Scheduled Delivery"] as const,
  weightUnit: "kg",
  dimUnit: "cm",
  maxWeight: 50,
} as const;

export type RateCalcType = (typeof SHIPPING_CONFIG.calcTypes)[number];

export interface ShippingOrigin {
  country: string;
  division: string;
  city: string;
  area: string;
  postal: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

export interface ShippingSettings {
  enabled: boolean;
  origin: ShippingOrigin;
  minProcessDays: number;
  maxProcessDays: number;
  sameDay: boolean;
  weekendProcessing: boolean;
  holidayProcessing: boolean;
  calcMode: string;
  defaultWeight: number;
  defaultLength: number;
  defaultWidth: number;
  defaultHeight: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  countries: string[];
  regions: string[];
  cities: string[];
  postals: string[];
  priority: number;
  active: boolean;
  updated: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  zoneId: string;
  calcType: RateCalcType;
  baseRate: number;
  perExtra: number;
  minOrder: number;
  maxOrder: number;
  minWeight: number;
  maxWeight: number;
  minQty: number;
  maxQty: number;
  minDays: number;
  maxDays: number;
  businessDays: boolean;
  active: boolean;
  updated: string;
}

export interface DeliverySettings {
  procMin: number;
  procMax: number;
  shipMin: number;
  shipMax: number;
  weekday: boolean;
  weekend: boolean;
  holiday: boolean;
  sameDayCutoff: string;
  processCutoff: string;
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  pickupHours: string;
  pickupContact: string;
  pickupPhone: string;
  customerNotes: boolean;
  handlingNotes: string;
  maxOrderWeight: number;
  codRestricted: boolean;
}

export const demoShippingSettings: ShippingSettings = {
  enabled: true,
  origin: {
    country: "Bangladesh", division: "Dhaka", city: "Dhaka", area: "Banani",
    postal: "1213", address: "House 7, Road 11, Banani, Dhaka",
    contactName: "Ayesha Rahman", contactPhone: "01711-223344",
  },
  minProcessDays: 1, maxProcessDays: 3,
  sameDay: false, weekendProcessing: true, holidayProcessing: false,
  calcMode: "Zone Based",
  defaultWeight: 0.5, defaultLength: 30, defaultWidth: 20, defaultHeight: 4,
};

export const demoShippingZones: ShippingZone[] = [
  {
    id: "sz-1", name: "Dhaka City", description: "Inside Dhaka metro.",
    countries: ["Bangladesh"], regions: ["Dhaka"], cities: ["Dhaka"], postals: ["1000–1299"],
    priority: 1, active: true, updated: "2026-09-20",
  },
  {
    id: "sz-2", name: "Bangladesh", description: "Nationwide outside Dhaka.",
    countries: ["Bangladesh"], regions: ["Chattogram", "Sylhet", "Rajshahi", "Khulna"], cities: [], postals: [],
    priority: 2, active: true, updated: "2026-09-18",
  },
  {
    id: "sz-3", name: "International", description: "Cross-border (paused).",
    countries: ["United States", "United Kingdom", "UAE"], regions: [], cities: [], postals: [],
    priority: 3, active: false, updated: "2026-08-30",
  },
];

export const demoShippingRates: ShippingRate[] = [
  {
    id: "sr-1", name: "Standard Delivery", zoneId: "sz-1", calcType: "flat",
    baseRate: 80, perExtra: 0, minOrder: 0, maxOrder: 0, minWeight: 0, maxWeight: 0,
    minQty: 0, maxQty: 0, minDays: 2, maxDays: 4, businessDays: true, active: true, updated: "2026-09-20",
  },
  {
    id: "sr-2", name: "Express Delivery", zoneId: "sz-1", calcType: "flat",
    baseRate: 130, perExtra: 0, minOrder: 0, maxOrder: 0, minWeight: 0, maxWeight: 0,
    minQty: 0, maxQty: 0, minDays: 1, maxDays: 2, businessDays: true, active: true, updated: "2026-09-19",
  },
  {
    id: "sr-3", name: "Free Delivery", zoneId: "sz-1", calcType: "free",
    baseRate: 0, perExtra: 0, minOrder: 2000, maxOrder: 0, minWeight: 0, maxWeight: 0,
    minQty: 0, maxQty: 0, minDays: 2, maxDays: 4, businessDays: true, active: true, updated: "2026-09-15",
  },
  {
    id: "sr-4", name: "Nationwide Standard", zoneId: "sz-2", calcType: "weight",
    baseRate: 60, perExtra: 40, minOrder: 0, maxOrder: 0, minWeight: 0, maxWeight: 5,
    minQty: 0, maxQty: 0, minDays: 3, maxDays: 5, businessDays: true, active: true, updated: "2026-09-18",
  },
  {
    id: "sr-5", name: "Saver Slab", zoneId: "sz-2", calcType: "price",
    baseRate: 100, perExtra: 0, minOrder: 0, maxOrder: 1999, minWeight: 0, maxWeight: 0,
    minQty: 0, maxQty: 0, minDays: 3, maxDays: 6, businessDays: true, active: false, updated: "2026-09-10",
  },
];

export const demoDeliverySettings: DeliverySettings = {
  procMin: 1, procMax: 2, shipMin: 2, shipMax: 4,
  weekday: true, weekend: true, holiday: false,
  sameDayCutoff: "14:00", processCutoff: "17:00",
  pickupEnabled: true, pickupAddress: "House 7, Road 11, Banani, Dhaka",
  pickupInstructions: "Call on arrival. Counter open 10am–8pm.",
  pickupHours: "10:00–20:00", pickupContact: "Ayesha Rahman", pickupPhone: "01711-223344",
  customerNotes: true, handlingNotes: "Keep dry. Do not bend saree boxes.",
  maxOrderWeight: 20, codRestricted: false,
};

export const CALC_TYPE_LABELS: Record<RateCalcType, string> = {
  flat: "Flat Rate", perItem: "Per Item", weight: "Weight Based",
  price: "Price Based", free: "Free Shipping", zone: "Zone Based",
};

export interface RateQuote {
  zoneName: string;
  method: string;
  fee: number;
  eta: string;
}

/** Frontend estimate preview. Authoritative calculation always happens server-side. */
export function estimateRate(
  rates: ShippingRate[],
  zones: ShippingZone[],
  args: { zoneId: string; amount: number; weight: number; qty: number }
): RateQuote | null {
  const zone = zones.find((z) => z.id === args.zoneId && z.active);
  if (!zone) return null;
  const candidates = rates.filter((r) => r.zoneId === zone.id && r.active);
  for (const r of candidates.sort((a, b) => a.baseRate - b.baseRate)) {
    if (r.calcType === "free" && args.amount < r.minOrder) continue;
    if (r.calcType === "price") {
      if (args.amount < r.minOrder) continue;
      if (r.maxOrder > 0 && args.amount > r.maxOrder) continue;
    }
    if (r.calcType === "weight") {
      if (args.weight < r.minWeight) continue;
      if (r.maxWeight > 0 && args.weight > r.maxWeight) continue;
    }
    let fee = r.baseRate;
    if (r.calcType === "weight") fee = r.baseRate + Math.max(0, Math.ceil(args.weight - 1)) * r.perExtra;
    if (r.calcType === "perItem") fee = r.baseRate + Math.max(0, args.qty - 1) * r.perExtra;
    return {
      zoneName: zone.name, method: r.name, fee: Math.max(0, Math.round(fee)),
      eta: `${r.minDays}–${r.maxDays} ${r.businessDays ? "Business Days" : "Days"}`,
    };
  }
  return null;
}

export function deliveryWindowText(r: Pick<ShippingRate, "minDays" | "maxDays" | "businessDays">): string {
  return `${r.minDays}–${r.maxDays} ${r.businessDays ? "Business Days" : "Days"}`;
}

export const shippingSettingsSchema = z.object({
  minProcessDays: z.number().min(0).max(30),
  maxProcessDays: z.number().min(0).max(30),
  defaultWeight: z.number().min(0).max(SHIPPING_CONFIG.maxWeight),
  defaultLength: z.number().min(0),
  defaultWidth: z.number().min(0),
  defaultHeight: z.number().min(0),
}).refine((d) => d.minProcessDays <= d.maxProcessDays, "Min days must be ≤ max days");

export const zoneSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().max(200).optional(),
  priority: z.number().min(1).max(100),
});

export const rateSchema = z.object({
  name: z.string().min(3).max(60),
  zoneId: z.string().min(1, "Select a zone"),
  baseRate: z.number().min(0),
  minDays: z.number().min(0).max(60),
  maxDays: z.number().min(0).max(60),
}).refine((d) => d.minDays <= d.maxDays, "Min days must be ≤ max days");
