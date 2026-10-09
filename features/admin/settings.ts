export interface GeneralSettings {
  siteName: string;
  siteTitle: string;
  siteDesc: string;
  siteUrl: string;
  adminName: string;
  adminUrl: string;
  logo: string;
  adminLogo: string;
  favicon: string;
  loginLogo: string;
  loginBg: string;
  country: string;
  division: string;
  city: string;
  address: string;
  postal: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStart: string;
  phone: string;
  phone2: string;
  email: string;
  supportEmail: string;
  whatsapp: string;
  contactAddress: string;
  socials: Record<string, string>;
}

export interface StoreSettings {
  storeName: string;
  storeType: string;
  storeDesc: string;
  storeEmail: string;
  storePhone: string;
  supportEmail: string;
  supportPhone: string;
  status: "open" | "closed" | "maintenance";
  minOrder: number;
  maxOrder: number;
  minQty: number;
  maxQty: number;
  guestCheckout: boolean;
  customerReg: boolean;
  vendorReg: boolean;
  reviews: boolean;
  ratings: boolean;
  wishlist: boolean;
  compare: boolean;
  orderPrefix: string;
  orderStart: number;
  invoicePrefix: string;
  cancelLimit: number;
  autoCancel: boolean;
  autoComplete: boolean;
  orderNotes: boolean;
  customerNotes: boolean;
}

export interface CurrencyRow {
  id: string;
  name: string;
  code: string;
  symbol: string;
  rate: number;
  status: "active" | "inactive";
  isDefault: boolean;
  updated: string;
}

export interface CurrencySettings {
  code: string;
  symbol: string;
  position: "before" | "after";
  decimalSep: string;
  thousandSep: string;
  decimals: number;
  currencies: CurrencyRow[];
}

export interface TaxRateRow {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  postal: string;
  rate: number;
  type: "percentage" | "fixed";
  priority: number;
  status: "active" | "inactive";
  updated: string;
}

export interface TaxSettings {
  enabled: boolean;
  inPrice: boolean;
  inShipping: boolean;
  basedOn: string;
  display: string;
  priceMode: string;
  rates: TaxRateRow[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  display: string;
  description: string;
  instructions: string;
  min: number;
  max: number;
  fee: number;
  feeType: "fixed" | "percent";
  sort: number;
  testMode: boolean;
  status: "active" | "inactive";
  isDefault: boolean;
  publicKey: string;
  secretKey: string;
  merchantId: string;
}

export interface ShipMethodRow {
  id: string;
  name: string;
  description: string;
  price: number;
  eta: string;
  sort: number;
  status: "active" | "inactive";
}

export interface ShipZoneRow {
  id: string;
  name: string;
  country: string;
  division: string;
  district: string;
  postal: string;
  methods: string[];
  status: "active" | "inactive";
}

export interface ShippingSettings {
  enabled: boolean;
  defaultMethod: string;
  freeThreshold: number;
  calculation: string;
  shippingTax: boolean;
  etaDisplay: boolean;
  addressRequired: boolean;
  methods: ShipMethodRow[];
  zones: ShipZoneRow[];
}

export interface CommissionSettings {
  enabled: boolean;
  defaultType: "percentage" | "fixed";
  defaultRate: number;
  payoutFreq: string;
  basedOn: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  preview: string;
  content: string;
  status: "active" | "inactive";
  updated: string;
}

export interface EmailSettings {
  senderName: string;
  senderEmail: string;
  replyTo: string;
  supportEmail: string;
  adminEmail: string;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  encryption: string;
  username: string;
  templates: EmailTemplate[];
}

export interface NotifyEvent {
  id: string;
  event: string;
  admin: boolean;
  vendor: boolean;
  customer: boolean;
  email: boolean;
  dashboard: boolean;
  push: boolean;
  sms: boolean;
  status: "active" | "inactive";
}

export interface SecuritySettings {
  twoFactor: boolean;
  attemptLimit: number;
  sessionTimeout: number;
  passwordExpiry: number;
  strongPassword: boolean;
  rememberMe: boolean;
  loginNotify: boolean;
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  historyCount: number;
  idleTimeout: number;
  maxSessions: number;
  rememberDays: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  status: "active" | "inactive";
  updated: string;
  permissions: Record<string, string[]>;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string;
  created: string;
  twoFactor: boolean;
  pwdChanged: string;
  sessions: number;
  welcomeEmail: boolean;
  requirePwdChange: boolean;
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  user: string;
  role: string;
  action: string;
  module: string;
  description: string;
  ip: string;
  device: string;
  browser: string;
  status: "success" | "warning" | "danger" | "info";
  prevValue?: string;
  newValue?: string;
}

export const PERMISSION_MODULES: Array<{ module: string; actions: string[] }> = [
  { module: "Dashboard", actions: ["View Dashboard"] },
  { module: "Orders", actions: ["View Orders", "Create Orders", "Edit Orders", "Cancel Orders", "Refund Orders"] },
  { module: "Products", actions: ["View Products", "Create Products", "Edit Products", "Delete Products"] },
  { module: "Vendors", actions: ["View Vendors", "Approve Vendors", "Edit Vendors", "Suspend Vendors"] },
  { module: "Customers", actions: ["View Customers", "Edit Customers", "Block Customers"] },
  { module: "Marketing", actions: ["View Marketing", "Create Campaign", "Manage Coupons"] },
  { module: "Reports", actions: ["View Reports", "Export Reports"] },
  { module: "CMS", actions: ["Manage Pages", "Manage Blog", "Manage Banners", "Manage Menus"] },
  { module: "Settings", actions: ["View Settings", "Edit Settings"] },
];

export const EMAIL_VARIABLES = [
  "{{customer_name}}",
  "{{order_id}}",
  "{{order_total}}",
  "{{store_name}}",
  "{{support_email}}",
  "{{vendor_name}}",
  "{{tracking_number}}",
];

export const defaultGeneral: GeneralSettings = {
  siteName: "Fashion Store",
  siteTitle: "Fashion Store | Online Shopping in Bangladesh",
  siteDesc: "Quality fashion delivered across Bangladesh.",
  siteUrl: "https://fashionstore.com.bd",
  adminName: "Fashion Admin",
  adminUrl: "https://fashionstore.com.bd/admin-login",
  logo: "/images/logo/logo.png",
  adminLogo: "/images/logo/logo.png",
  favicon: "/icon.png",
  loginLogo: "/images/logo/logo.png",
  loginBg: "/images/Banner/banne1.png",
  country: "Bangladesh",
  division: "Dhaka",
  city: "Dhaka",
  address: "House 12, Road 5, Gulshan",
  postal: "1212",
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  weekStart: "Saturday",
  phone: "09612-000000",
  phone2: "01700-000000",
  email: "info@fashionstore.com.bd",
  supportEmail: "support@fashionstore.com.bd",
  whatsapp: "01700-000000",
  contactAddress: "House 12, Road 5, Gulshan, Dhaka 1212",
  socials: {
    Facebook: "https://facebook.com/fashionstore",
    Instagram: "https://instagram.com/fashionstore",
    YouTube: "https://youtube.com/@fashionstore",
    LinkedIn: "",
    TikTok: "",
    "X/Twitter": "",
  },
};

export const defaultStoreSettings: StoreSettings = {
  storeName: "Fashion Store",
  storeType: "Multi-Vendor",
  storeDesc: "Quality fashion delivered across Bangladesh.",
  storeEmail: "store@fashionstore.com.bd",
  storePhone: "09612-000000",
  supportEmail: "support@fashionstore.com.bd",
  supportPhone: "01700-000000",
  status: "open",
  minOrder: 200,
  maxOrder: 500000,
  minQty: 1,
  maxQty: 50,
  guestCheckout: true,
  customerReg: true,
  vendorReg: true,
  reviews: true,
  ratings: true,
  wishlist: true,
  compare: false,
  orderPrefix: "ORD",
  orderStart: 100000,
  invoicePrefix: "INV",
  cancelLimit: 24,
  autoCancel: true,
  autoComplete: true,
  orderNotes: true,
  customerNotes: false,
};

export const defaultCurrency: CurrencySettings = {
  code: "BDT",
  symbol: "৳",
  position: "before",
  decimalSep: ".",
  thousandSep: ",",
  decimals: 2,
  currencies: [
    { id: "c1", name: "Bangladeshi Taka", code: "BDT", symbol: "৳", rate: 1, status: "active", isDefault: true, updated: "2026-09-01" },
    { id: "c2", name: "US Dollar", code: "USD", symbol: "$", rate: 117.5, status: "active", isDefault: false, updated: "2026-09-01" },
    { id: "c3", name: "Euro", code: "EUR", symbol: "€", rate: 127.2, status: "inactive", isDefault: false, updated: "2026-08-15" },
    { id: "c4", name: "British Pound", code: "GBP", symbol: "£", rate: 148.9, status: "inactive", isDefault: false, updated: "2026-08-15" },
    { id: "c5", name: "Indian Rupee", code: "INR", symbol: "₹", rate: 1.4, status: "active", isDefault: false, updated: "2026-09-01" },
  ],
};

export const defaultTax: TaxSettings = {
  enabled: true,
  inPrice: false,
  inShipping: false,
  basedOn: "Shipping Address",
  display: "Including Tax",
  priceMode: "Excluding Tax",
  rates: [
    { id: "tx1", name: "Standard VAT", country: "Bangladesh", state: "All", city: "All", postal: "All", rate: 7.5, type: "percentage", priority: 1, status: "active", updated: "2026-09-01" },
    { id: "tx2", name: "Dhaka City Tax", country: "Bangladesh", state: "Dhaka", city: "Dhaka", postal: "1000–1349", rate: 2, type: "percentage", priority: 2, status: "active", updated: "2026-08-20" },
    { id: "tx3", name: "Import Duty Flat", country: "Bangladesh", state: "All", city: "All", postal: "All", rate: 150, type: "fixed", priority: 3, status: "inactive", updated: "2026-07-10" },
  ],
};

export const demoPayments: PaymentMethod[] = [
  { id: "pay1", name: "cod", display: "Cash on Delivery", description: "Pay in cash when you receive the order.", instructions: "Keep exact change ready.", min: 0, max: 50000, fee: 0, feeType: "fixed", sort: 1, testMode: false, status: "active", isDefault: true, publicKey: "", secretKey: "", merchantId: "" },
  { id: "pay2", name: "bkash", display: "bKash", description: "Pay with your bKash account.", instructions: "You will be redirected to bKash.", min: 10, max: 100000, fee: 1.5, feeType: "percent", sort: 2, testMode: true, status: "active", isDefault: false, publicKey: "pk_test_***", secretKey: "sk_test_***", merchantId: "01700000000" },
  { id: "pay3", name: "nagad", display: "Nagad", description: "Pay with Nagad.", instructions: "Confirm from your Nagad app.", min: 10, max: 100000, fee: 1.2, feeType: "percent", sort: 3, testMode: true, status: "active", isDefault: false, publicKey: "pk_test_***", secretKey: "sk_test_***", merchantId: "01800000000" },
  { id: "pay4", name: "card", display: "Card Payment", description: "Visa, Mastercard and Amex.", instructions: "Secured by SSLCommerz.", min: 50, max: 500000, fee: 2.5, feeType: "percent", sort: 4, testMode: false, status: "active", isDefault: false, publicKey: "pk_live_***", secretKey: "sk_live_***", merchantId: "SSLCZ-91" },
  { id: "pay5", name: "bank", display: "Bank Transfer", description: "Direct bank deposit.", instructions: "Upload deposit slip after payment.", min: 500, max: 1000000, fee: 0, feeType: "fixed", sort: 5, testMode: false, status: "inactive", isDefault: false, publicKey: "", secretKey: "", merchantId: "AC-001122" },
];

export const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  defaultMethod: "Standard Delivery",
  freeThreshold: 2000,
  calculation: "Per Order",
  shippingTax: false,
  etaDisplay: true,
  addressRequired: true,
  methods: [
    { id: "sm1", name: "Standard Delivery", description: "2–5 business days.", price: 60, eta: "2–5 Days", sort: 1, status: "active" },
    { id: "sm2", name: "Express Delivery", description: "1–2 business days.", price: 120, eta: "1–2 Days", sort: 2, status: "active" },
    { id: "sm3", name: "Free Shipping", description: "Orders above ৳2,000.", price: 0, eta: "3–7 Days", sort: 3, status: "active" },
    { id: "sm4", name: "Local Pickup", description: "Collect from Gulshan outlet.", price: 0, eta: "Same Day", sort: 4, status: "inactive" },
    { id: "sm5", name: "Vendor Shipping", description: "Ships directly from vendor.", price: 100, eta: "3–7 Days", sort: 5, status: "inactive" },
  ],
  zones: [
    { id: "sz1", name: "Dhaka Metro", country: "Bangladesh", division: "Dhaka", district: "Dhaka", postal: "1000–1349", methods: ["Standard Delivery", "Express Delivery"], status: "active" },
    { id: "sz2", name: "Nationwide", country: "Bangladesh", division: "All", district: "All", postal: "All", methods: ["Standard Delivery"], status: "active" },
  ],
};

export const defaultCommissionSettings: CommissionSettings = {
  enabled: true,
  defaultType: "percentage",
  defaultRate: 10,
  payoutFreq: "Weekly",
  basedOn: "Order Subtotal",
};

export const demoEmailTemplates: EmailTemplate[] = [
  { id: "et1", name: "Welcome Email", trigger: "Customer registers", subject: "Welcome to {{store_name}}, {{customer_name}}!", preview: "Thanks for joining us.", content: "<p>Hi {{customer_name}},</p><p>Welcome to {{store_name}}! Your account is ready.</p><p>Support: {{support_email}}</p>", status: "active", updated: "2026-09-01" },
  { id: "et2", name: "Order Confirmation", trigger: "Order placed", subject: "Order {{order_id}} confirmed — {{order_total}}", preview: "We received your order.", content: "<p>Hi {{customer_name}},</p><p>Order {{order_id}} for {{order_total}} is confirmed.</p>", status: "active", updated: "2026-09-01" },
  { id: "et3", name: "Order Shipped", trigger: "Order shipped", subject: "Your order is on the way! Track {{tracking_number}}", preview: "Track your parcel.", content: "<p>Hi {{customer_name}},</p><p>Order {{order_id}} shipped. Track: {{tracking_number}}</p>", status: "active", updated: "2026-08-20" },
  { id: "et4", name: "Order Delivered", trigger: "Order delivered", subject: "Delivered: {{order_id}}", preview: "Enjoy your purchase.", content: "<p>Hi {{customer_name}},</p><p>Order {{order_id}} was delivered. Leave a review!</p>", status: "active", updated: "2026-08-20" },
  { id: "et5", name: "Password Reset", trigger: "Reset requested", subject: "Reset your password", preview: "Secure reset link inside.", content: "<p>Hi {{customer_name}},</p><p>Use this link to reset your password. Contact {{support_email}} for help.</p>", status: "inactive", updated: "2026-07-15" },
  { id: "et6", name: "Vendor Payout", trigger: "Payout released", subject: "{{vendor_name}}, your payout is on the way", preview: "Payout released.", content: "<p>Hi {{vendor_name}},</p><p>Your payout of {{order_total}} has been released.</p>", status: "active", updated: "2026-09-10" },
];

export const demoNotifyEvents: NotifyEvent[] = [
  { id: "ne1", event: "New Order", admin: true, vendor: true, customer: true, email: true, dashboard: true, push: false, sms: true, status: "active" },
  { id: "ne2", event: "Order Cancelled", admin: true, vendor: true, customer: true, email: true, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne3", event: "Payment Received", admin: true, vendor: false, customer: true, email: true, dashboard: true, push: false, sms: true, status: "active" },
  { id: "ne4", event: "Order Shipped", admin: false, vendor: true, customer: true, email: true, dashboard: true, push: true, sms: true, status: "active" },
  { id: "ne5", event: "Order Delivered", admin: false, vendor: false, customer: true, email: true, dashboard: true, push: true, sms: false, status: "active" },
  { id: "ne6", event: "New Customer", admin: true, vendor: false, customer: false, email: false, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne7", event: "New Vendor", admin: true, vendor: false, customer: false, email: true, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne8", event: "Vendor Approved", admin: true, vendor: true, customer: false, email: true, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne9", event: "New Review", admin: true, vendor: true, customer: false, email: false, dashboard: true, push: false, sms: false, status: "inactive" },
  { id: "ne10", event: "New Return Request", admin: true, vendor: true, customer: false, email: true, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne11", event: "Refund Processed", admin: true, vendor: false, customer: true, email: true, dashboard: true, push: false, sms: true, status: "active" },
  { id: "ne12", event: "Payout Completed", admin: true, vendor: true, customer: false, email: true, dashboard: true, push: false, sms: false, status: "active" },
  { id: "ne13", event: "Low Stock", admin: true, vendor: true, customer: false, email: false, dashboard: true, push: true, sms: false, status: "active" },
];

export const defaultSecurity: SecuritySettings = {
  twoFactor: false,
  attemptLimit: 5,
  sessionTimeout: 60,
  passwordExpiry: 90,
  strongPassword: true,
  rememberMe: true,
  loginNotify: true,
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSpecial: false,
  historyCount: 5,
  idleTimeout: 15,
  maxSessions: 3,
  rememberDays: 30,
};

export const demoRoles: Role[] = [
  { id: "rl1", name: "Super Admin", description: "Full access to everything.", users: 2, status: "active", updated: "2026-09-01", permissions: { Dashboard: ["View Dashboard"], Orders: ["View Orders", "Create Orders", "Edit Orders", "Cancel Orders", "Refund Orders"], Products: ["View Products", "Create Products", "Edit Products", "Delete Products"], Settings: ["View Settings", "Edit Settings"] } },
  { id: "rl2", name: "Admin", description: "Day-to-day operations.", users: 4, status: "active", updated: "2026-09-10", permissions: { Dashboard: ["View Dashboard"], Orders: ["View Orders", "Edit Orders"], Products: ["View Products", "Edit Products"] } },
  { id: "rl3", name: "Manager", description: "Catalog and orders.", users: 3, status: "active", updated: "2026-08-20", permissions: { Orders: ["View Orders"], Products: ["View Products", "Edit Products"] } },
  { id: "rl4", name: "Support", description: "Customer support desk.", users: 6, status: "active", updated: "2026-09-15", permissions: { Customers: ["View Customers"], Orders: ["View Orders"] } },
  { id: "rl5", name: "Content Manager", description: "Pages, blog and banners.", users: 2, status: "active", updated: "2026-08-01", permissions: { CMS: ["Manage Pages", "Manage Blog", "Manage Banners"] } },
  { id: "rl6", name: "Finance Manager", description: "Payouts and reports.", users: 1, status: "inactive", updated: "2026-07-01", permissions: { Reports: ["View Reports", "Export Reports"] } },
  { id: "rl7", name: "Marketing Manager", description: "Campaigns and coupons.", users: 2, status: "active", updated: "2026-09-05", permissions: { Marketing: ["View Marketing", "Create Campaign", "Manage Coupons"] } },
];

export const demoAdmins: AdminUser[] = [
  { id: "ad1", firstName: "Shajalal", lastName: "Admin", email: "admin@fashion.com", phone: "01700-000001", role: "Super Admin", status: "active", lastLogin: "2026-09-26 09:12 AM", created: "2026-01-05", twoFactor: true, pwdChanged: "2026-08-01", sessions: 2, welcomeEmail: true, requirePwdChange: false },
  { id: "ad2", firstName: "Nusrat", lastName: "Jahan", email: "nusrat@fashion.com", phone: "01700-000002", role: "Admin", status: "active", lastLogin: "2026-09-25 06:40 PM", created: "2026-03-12", twoFactor: false, pwdChanged: "2026-07-20", sessions: 1, welcomeEmail: true, requirePwdChange: false },
  { id: "ad3", firstName: "Karim", lastName: "Hasan", email: "karim@fashion.com", phone: "01700-000003", role: "Support", status: "active", lastLogin: "2026-09-26 08:02 AM", created: "2026-05-20", twoFactor: false, pwdChanged: "2026-09-01", sessions: 1, welcomeEmail: false, requirePwdChange: true },
  { id: "ad4", firstName: "Rina", lastName: "Akter", email: "rina@fashion.com", phone: "01700-000004", role: "Content Manager", status: "inactive", lastLogin: "2026-08-30 11:00 AM", created: "2026-06-15", twoFactor: false, pwdChanged: "2026-06-15", sessions: 0, welcomeEmail: true, requirePwdChange: false },
];

export const demoActivityLogs: ActivityLog[] = [
  { id: "al1", date: "2026-09-26", time: "11:42 AM", user: "Shajalal Admin", role: "Super Admin", action: "Updated Store Settings", module: "Settings", description: "Changed store configuration.", ip: "103.12.45.8", device: "Desktop", browser: "Chrome 126", status: "success", prevValue: "USD", newValue: "BDT" },
  { id: "al2", date: "2026-09-26", time: "10:15 AM", user: "Nusrat Jahan", role: "Admin", action: "Approved Return", module: "Returns", description: "Approved RET-10480.", ip: "103.12.45.21", device: "Desktop", browser: "Chrome 126", status: "success", prevValue: "Pending", newValue: "Approved" },
  { id: "al3", date: "2026-09-25", time: "06:40 PM", user: "Karim Hasan", role: "Support", action: "Blocked Customer", module: "Customers", description: "Blocked suspicious account.", ip: "103.12.45.33", device: "Mobile", browser: "Safari 17", status: "warning", prevValue: "Active", newValue: "Blocked" },
  { id: "al4", date: "2026-09-25", time: "02:20 PM", user: "System", role: "System", action: "Failed Login", module: "Security", description: "5 failed attempts from unknown IP.", ip: "45.118.90.2", device: "Unknown", browser: "Unknown", status: "danger", prevValue: "—", newValue: "Locked 15 min" },
  { id: "al5", date: "2026-09-24", time: "09:00 AM", user: "Shajalal Admin", role: "Super Admin", action: "Published Campaign", module: "Marketing", description: "Eid Mega Campaign went live.", ip: "103.12.45.8", device: "Desktop", browser: "Chrome 126", status: "info", prevValue: "Draft", newValue: "Active" },
  { id: "al6", date: "2026-09-23", time: "04:55 PM", user: "Nusrat Jahan", role: "Admin", action: "Updated Tax Rate", module: "Settings", description: "Standard VAT 7% → 7.5%.", ip: "103.12.45.21", device: "Desktop", browser: "Chrome 126", status: "success", prevValue: "7%", newValue: "7.5%" },
];

export function formatCurrencyPreview(code: string, symbol: string, position: "before" | "after", decimals: number, value: number): string {
  const fixed = value.toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const num = decimals > 0 ? `${grouped}.${dec}` : grouped;
  void code;
  return position === "before" ? `${symbol}${num}` : `${num}${symbol}`;
}

export function orderNumberPreview(prefix: string, start: number): string {
  return `${prefix}-2026-${String(start + 25).padStart(6, "0")}`;
}

export function taxPreview(price: number, rate: number, type: "percentage" | "fixed"): { tax: number; total: number } {
  const tax = type === "percentage" ? Math.round(price * (rate / 100)) : rate;
  return { tax, total: price + tax };
}

export function commissionPreview(total: number, type: "percentage" | "fixed", rate: number, fixed: number): { commission: number; earning: number } {
  const commission = type === "percentage" ? Math.round(total * (rate / 100)) : fixed;
  return { commission, earning: total - commission };
}
