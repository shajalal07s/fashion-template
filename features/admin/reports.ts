export interface DistrictStat {
  slug: string;
  name: string;
  division: string;
  country: string;
  orders: number;
  sales: number;
  revenue: number;
  customers: number;
  vendors: number;
  products: number;
  refunds: number;
  tax: number;
}

export interface DivisionStat {
  slug: string;
  name: string;
  country: string;
  districts: string[];
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const DIVISIONS: Array<{ name: string; districts: string[] }> = [
  { name: "Dhaka Division", districts: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Kishoreganj", "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Faridpur", "Gopalganj", "Madaripur", "Shariatpur"] },
  { name: "Chattogram Division", districts: ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali", "Lakshmipur", "Chandpur", "Brahmanbaria", "Khagrachhari", "Rangamati", "Bandarban"] },
  { name: "Rajshahi Division", districts: ["Rajshahi", "Bogura", "Pabna", "Natore", "Naogaon", "Chapainawabganj", "Sirajganj", "Joypurhat"] },
  { name: "Khulna Division", districts: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Chuadanga", "Jhenaidah", "Magura", "Meherpur", "Narail"] },
  { name: "Barishal Division", districts: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokati"] },
  { name: "Sylhet Division", districts: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"] },
  { name: "Rangpur Division", districts: ["Rangpur", "Dinajpur", "Kurigram", "Lalmonirhat", "Nilphamari", "Gaibandha", "Thakurgaon", "Panchagarh"] },
  { name: "Mymensingh Division", districts: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"] },
];

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function getDivisions(): DivisionStat[] {
  return DIVISIONS.map((d) => ({ slug: slugify(d.name), name: d.name, country: "Bangladesh", districts: d.districts }));
}

export function getDivision(slug: string): DivisionStat | null {
  return getDivisions().find((d) => d.slug === slug) ?? null;
}

export function districtStats(name: string, division: string): DistrictStat {
  const h = hashStr(`geo:${name}`);
  const orders = 400 + (h % 12000);
  const aov = 1800 + (h % 2200);
  const sales = orders * aov;
  return {
    slug: slugify(name),
    name,
    division,
    country: "Bangladesh",
    orders,
    sales,
    revenue: Math.round(sales * 0.86),
    customers: Math.round(orders * (0.55 + ((h >> 3) % 20) / 100)),
    vendors: 8 + ((h >> 5) % 120),
    products: orders * 2 + ((h >> 7) % 500),
    refunds: Math.round(sales * 0.045),
    tax: Math.round(sales * 0.075),
  };
}

export function divisionStats(div: DivisionStat): DistrictStat {
  const districts = div.districts.map((d) => districtStats(d, div.name));
  const sum = (k: keyof DistrictStat): number =>
    districts.reduce((n, d) => n + (typeof d[k] === "number" ? (d[k] as number) : 0), 0);
  return {
    slug: div.slug,
    name: div.name,
    division: div.name,
    country: "Bangladesh",
    orders: sum("orders"),
    sales: sum("sales"),
    revenue: sum("revenue"),
    customers: sum("customers"),
    vendors: sum("vendors"),
    products: sum("products"),
    refunds: sum("refunds"),
    tax: sum("tax"),
  };
}

export function countryStats(): DistrictStat & { divisions: number } {
  const divs = getDivisions();
  const agg: DistrictStat = {
    slug: "bangladesh", name: "Bangladesh", division: "—", country: "Bangladesh",
    orders: 0, sales: 0, revenue: 0, customers: 0, vendors: 0, products: 0, refunds: 0, tax: 0,
  };
  for (const d of divs) {
    const s = divisionStats(d);
    (Object.keys(agg) as Array<keyof DistrictStat>).forEach((k) => {
      if (typeof s[k] === "number" && typeof agg[k] === "number") {
        (agg[k] as number) = (agg[k] as number) + (s[k] as number);
      }
    });
  }
  return { ...agg, divisions: divs.length };
}

export function aovOf(s: { orders: number; sales: number }): number {
  return s.orders > 0 ? Math.round(s.sales / s.orders) : 0;
}

export function districtTrend(seed: string): Array<{ x: string; y: number }> {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const h = hashStr(`trend:${seed}`);
  return months.map((x, i) => ({ x, y: 20000 + ((h >> (i * 3)) % 90000) }));
}

export function districtTopProducts(seed: string): Array<{ product: string; vendor: string; orders: number; qty: number; revenue: number; refund: number }> {
  const catalog = [
    ["Printed Kurti - Red", "Ayesha Boutique"],
    ["Silk Saree - Green", "Nusrat Fashion"],
    ["Denim Shirt - Blue", "Karim Wholesale"],
    ["Classic Panjabi - White", "TH Lifestyle"],
    ["Kids Eid Set", "Sadia Kids"],
    ["Cotton Three-Piece", "Dhaka Boutique"],
  ];
  const h = hashStr(`prod:${seed}`);
  return catalog.map(([product, vendor], i) => {
    const orders = 20 + ((h >> (i * 4)) % 300);
    const revenue = orders * (1500 + ((h >> (i * 2)) % 3000));
    return { product, vendor, orders, qty: orders * 2, revenue, refund: Math.round(revenue * 0.04) };
  });
}

export function districtTopVendors(seed: string): Array<{ vendor: string; orders: number; sales: number; revenue: number; commission: number; payout: number; refund: number }> {
  const vendors = ["Ayesha Boutique", "Karim Wholesale", "Nusrat Fashion", "TH Lifestyle", "Sadia Kids"];
  const h = hashStr(`ven:${seed}`);
  return vendors.map((vendor, i) => {
    const sales = 50000 + ((h >> (i * 5)) % 800000);
    const commission = Math.round(sales * 0.1);
    return { vendor, orders: 30 + ((h >> i) % 400), sales, revenue: Math.round(sales * 0.9), commission, payout: Math.round(sales * 0.85), refund: Math.round(sales * 0.03) };
  });
}

export function districtCustomers(seed: string): Array<{ customer: string; orders: number; spent: number; refund: number; last: string }> {
  const names = ["Ayesha Rahman", "Karim Uddin", "Nusrat Jahan", "Tanvir Hasan", "Sadia Afrin", "Rahim Uddin"];
  const h = hashStr(`cus:${seed}`);
  return names.map((customer, i) => {
    const orders = 1 + ((h >> (i * 3)) % 12);
    const spent = orders * (1800 + ((h >> i) % 4000));
    return { customer, orders, spent, refund: Math.round(spent * 0.03), last: `2026-09-${String(1 + ((h + i * 4) % 25)).padStart(2, "0")}` };
  });
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const DATE_FILTERS = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Last 90 Days", "This Month", "Last Month", "This Year"] as const;
