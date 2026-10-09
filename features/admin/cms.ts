export type CmsStatus = "active" | "inactive" | "draft" | "published" | "scheduled" | "archived" | "expired";

export interface HomepageSection {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  order: number;
  updated: string;
  config: Record<string, string | number | boolean>;
}

export interface CmsBanner {
  id: string;
  name: string;
  position: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  url: string;
  newTab: boolean;
  device: string;
  start: string;
  end: string;
  order: number;
  status: CmsStatus;
  clicks: number;
  views: number;
  updated: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  status: "draft" | "published" | "scheduled" | "archived";
  author: string;
  template: string;
  parent: string;
  created: string;
  updated: string;
  publishDate: string;
  seoTitle: string;
  seoDesc: string;
  keyword: string;
  canonical: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  status: "draft" | "published" | "scheduled" | "archived";
  views: number;
  publishDate: string;
  updated: string;
  seoTitle: string;
  seoDesc: string;
  keyword: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string;
  posts: number;
  status: "active" | "inactive";
  updated: string;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: string;
  newTab: boolean;
  icon: string;
  visible: boolean;
  css: string;
  children: MenuItem[];
}

export interface SiteMenu {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive";
  updated: string;
  items: MenuItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: string[];
  visible: boolean;
  order: number;
}

export interface SocialLink {
  id: string;
  network: string;
  url: string;
  visible: boolean;
  order: number;
}

export interface FooterSettings {
  logo: string;
  about: string;
  email: string;
  phone: string;
  address: string;
  newsletter: boolean;
  payments: string[];
  apps: boolean;
  copyright: string;
  columns: FooterColumn[];
  socials: SocialLink[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: "published" | "draft";
  order: number;
  updated: string;
}

export interface DayHours {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

export interface ContactInfo {
  company: string;
  tagline: string;
  phone: string;
  phone2: string;
  email: string;
  supportEmail: string;
  whatsapp: string;
  address: string;
  city: string;
  division: string;
  country: string;
  postal: string;
  hours: DayHours[];
  socials: SocialLink[];
  mapsUrl: string;
  mapsEmbed: string;
}

export interface SeoSettings {
  siteTitle: string;
  siteDesc: string;
  metaTitle: string;
  metaDesc: string;
  keywords: string;
  canonical: string;
  socialImage: string;
  favicon: string;
  productTpl: string;
  categoryTpl: string;
  blogTpl: string;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDesc: string;
  twitterImage: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "other";
  size: string;
  bytes: number;
  date: string;
  dims: string;
  by: string;
  url: string;
  alt: string;
  caption: string;
  description: string;
}

export interface CmsActivity {
  id: string;
  event: string;
  description: string;
  user: string;
  date: string;
  time: string;
  status: "success" | "info" | "warning";
}

export const demoSections: HomepageSection[] = [
  { id: "hs1", name: "Hero Banner", type: "hero", enabled: true, order: 1, updated: "2026-09-20", config: { title: "Eid Collection 2026", subtitle: "Up to 50% off festive wear", cta: "Shop Now", url: "/women", align: "left", overlay: 40, buttons: true } },
  { id: "hs2", name: "Featured Categories", type: "categories", enabled: true, order: 2, updated: "2026-09-18", config: { title: "Shop by Category", count: 8, layout: "grid", images: true, names: true } },
  { id: "hs3", name: "Featured Products", type: "products", enabled: true, order: 3, updated: "2026-09-18", config: { title: "Featured Products", source: "manual", count: 8, layout: "carousel", columns: 4, viewAll: true, btnText: "View All", btnUrl: "/products" } },
  { id: "hs4", name: "Flash Sale", type: "flash", enabled: true, order: 4, updated: "2026-09-24", config: { title: "Midnight Mega Sale", source: "flash-sale", count: 6, layout: "grid", columns: 3 } },
  { id: "hs5", name: "Promotional Banner", type: "promo", enabled: true, order: 5, updated: "2026-09-15", config: { title: "Puja Dhamaka", cta: "Explore", url: "/campaigns", align: "center" } },
  { id: "hs6", name: "Best Selling Products", type: "products", enabled: true, order: 6, updated: "2026-09-12", config: { title: "Best Sellers", source: "best-selling", count: 8, layout: "grid", columns: 4 } },
  { id: "hs7", name: "New Arrivals", type: "products", enabled: false, order: 7, updated: "2026-09-10", config: { title: "New Arrivals", source: "newest", count: 8, layout: "carousel", columns: 4 } },
  { id: "hs8", name: "Vendor Showcase", type: "vendors", enabled: true, order: 8, updated: "2026-09-08", config: { title: "Top Vendors", count: 6, layout: "grid" } },
  { id: "hs9", name: "Brand Showcase", type: "brands", enabled: false, order: 9, updated: "2026-09-05", config: { title: "Our Brands", count: 8, layout: "carousel" } },
  { id: "hs10", name: "Newsletter", type: "newsletter", enabled: true, order: 10, updated: "2026-09-01", config: { title: "Get style ideas in your inbox", subtitle: "Join 30,000+ readers" } },
  { id: "hs11", name: "Testimonials", type: "testimonials", enabled: true, order: 11, updated: "2026-08-28", config: { title: "What customers say", count: 3, layout: "carousel" } },
  { id: "hs12", name: "Blog Section", type: "blog", enabled: true, order: 12, updated: "2026-08-25", config: { title: "From the Journal", count: 3, layout: "grid", columns: 3 } },
  { id: "hs13", name: "FAQ Section", type: "faq", enabled: false, order: 13, updated: "2026-08-20", config: { title: "Common Questions", count: 5 } },
  { id: "hs14", name: "CTA Section", type: "cta", enabled: true, order: 14, updated: "2026-08-18", config: { title: "Sell on Fashion Store", cta: "Become a Vendor", url: "/vendor-register", align: "center" } },
];

export const demoCmsBanners: CmsBanner[] = [
  { id: "cb1", name: "Eid Hero", position: "Homepage Hero", title: "Eid Collection 2026", subtitle: "Up to 50% off festive wear", description: "Main homepage hero for Eid campaign.", image: "/images/Banner/banne1.png", cta: "Shop Now", url: "/women", newTab: false, device: "Both", start: "2026-09-01", end: "2026-09-30", order: 1, status: "active", clicks: 18400, views: 320000, updated: "2026-09-01" },
  { id: "cb2", name: "Flash Strip", position: "Homepage Promotional", title: "Midnight Mega Sale", subtitle: "Ends in hours", description: "Secondary strip above footer.", image: "/images/Banner/banner2.png", cta: "Grab Deals", url: "/flash", newTab: false, device: "Mobile", start: "2026-09-24", end: "2026-09-27", order: 2, status: "active", clicks: 9200, views: 140000, updated: "2026-09-24" },
  { id: "cb3", name: "Puja Popup", position: "Popup", title: "Puja Dhamaka", subtitle: "Festive deals are coming", description: "Entrance popup for Puja.", image: "/images/Banner/banner3.png", cta: "Notify Me", url: "/campaigns", newTab: true, device: "Desktop", start: "2026-10-01", end: "2026-10-10", order: 3, status: "scheduled", clicks: 0, views: 0, updated: "2026-09-20" },
  { id: "cb4", name: "Blog Sidebar", position: "Sidebar", title: "New Journal", subtitle: "Style stories weekly", description: "Blog sidebar box.", image: "/images/Banner/banner2.png", cta: "Read Blog", url: "/blog", newTab: false, device: "Desktop", start: "2026-09-01", end: "2026-12-31", order: 4, status: "inactive", clicks: 1200, views: 45000, updated: "2026-09-05" },
  { id: "cb5", name: "Winter Shop", position: "Shop Banner", title: "Winter Clearance", subtitle: "Up to 70% off", description: "Shop page top banner.", image: "/images/Banner/banner2.png", cta: "Shop Now", url: "/men", newTab: false, device: "Both", start: "2026-01-05", end: "2026-01-25", order: 5, status: "expired", clicks: 22100, views: 410000, updated: "2026-01-05" },
];

export const demoCmsPages: CmsPage[] = [
  { id: "pg1", title: "About Us", slug: "about", excerpt: "Our story and mission.", content: "<p>Fashion Store started in Dhaka with a mission to bring quality fashion to every doorstep.</p>", image: "/images/women/women-3.jpg", status: "published", author: "Admin", template: "About Page", parent: "—", created: "2026-05-01", updated: "2026-09-10", publishDate: "2026-05-02", seoTitle: "About Us | Fashion Store", seoDesc: "Learn about Fashion Store.", keyword: "about", canonical: "/about" },
  { id: "pg2", title: "Contact", slug: "contact", excerpt: "Get in touch.", content: "<p>Call us at 09612-000000, 9AM–9PM every day.</p>", image: "", status: "published", author: "Admin", template: "Contact Page", parent: "—", created: "2026-05-01", updated: "2026-08-22", publishDate: "2026-05-02", seoTitle: "Contact | Fashion Store", seoDesc: "Contact Fashion Store support.", keyword: "contact", canonical: "/contact" },
  { id: "pg3", title: "Terms & Conditions", slug: "terms", excerpt: "Store policies.", content: "<p>Please read these terms carefully before shopping.</p>", image: "", status: "published", author: "Admin", template: "Default", parent: "—", created: "2026-05-01", updated: "2026-07-15", publishDate: "2026-05-02", seoTitle: "Terms | Fashion Store", seoDesc: "Terms and conditions.", keyword: "terms", canonical: "/terms" },
  { id: "pg4", title: "Vendor Onboarding", slug: "vendor-onboarding", excerpt: "Sell with us.", content: "<p>Join 500+ vendors selling on Fashion Store.</p>", image: "", status: "draft", author: "Admin", template: "Landing Page", parent: "—", created: "2026-09-18", updated: "2026-09-24", publishDate: "2026-10-01", seoTitle: "Sell Online | Fashion Store", seoDesc: "Become a vendor.", keyword: "vendor", canonical: "/vendor-onboarding" },
  { id: "pg5", title: "Winter Lookbook", slug: "winter-lookbook", excerpt: "Seasonal inspiration.", content: "<p>Explore the winter edit.</p>", image: "/images/men/men-2.jpg", status: "scheduled", author: "Editor", template: "Full Width", parent: "—", created: "2026-09-20", updated: "2026-09-25", publishDate: "2026-12-01", seoTitle: "Winter Lookbook | Fashion Store", seoDesc: "Winter fashion inspiration.", keyword: "winter", canonical: "/winter-lookbook" },
  { id: "pg6", title: "Old Promo Page", slug: "old-promo", excerpt: "Retired campaign.", content: "<p>This campaign has ended.</p>", image: "", status: "archived", author: "Admin", template: "Default", parent: "—", created: "2026-01-10", updated: "2026-03-01", publishDate: "2026-01-11", seoTitle: "Promo | Fashion Store", seoDesc: "Old promo.", keyword: "promo", canonical: "/old-promo" },
];

export const demoPosts: BlogPost[] = [
  { id: "bp1", title: "5 Ways to Style Printed Kurtis", slug: "style-printed-kurtis", excerpt: "From office to dinner — style your kurtis.", content: "<p>Kurtis are the most versatile piece in a deshi wardrobe...</p>", image: "/images/women/women-1.jpg", category: "Style Guide", tags: ["kurti", "style"], author: "Ayesha Rahman", status: "published", views: 12400, publishDate: "2026-06-18", updated: "2026-06-18", seoTitle: "Style Printed Kurtis | Fashion Store", seoDesc: "5 ways to style kurtis.", keyword: "kurti style" },
  { id: "bp2", title: "Ultimate Saree Draping Guide", slug: "saree-draping-guide", excerpt: "Master the classic 6-yard drape.", content: "<p>Draping a saree takes practice...</p>", image: "/images/women/women-2.jpg", category: "Heritage", tags: ["saree"], author: "Nusrat Jahan", status: "published", views: 9800, publishDate: "2026-06-10", updated: "2026-06-10", seoTitle: "Saree Guide | Fashion Store", seoDesc: "How to drape a saree.", keyword: "saree" },
  { id: "bp3", title: "Panjabi Fabric Care", slug: "panjabi-fabric-care", excerpt: "Keep festive wear fresh.", content: "<p>Cotton and jacquard need gentle care...</p>", image: "/images/men/men-1.jpg", category: "Care", tags: ["care"], author: "Karim Hasan", status: "scheduled", views: 0, publishDate: "2026-10-05", updated: "2026-09-22", seoTitle: "Panjabi Care | Fashion Store", seoDesc: "Fabric care tips.", keyword: "panjabi care" },
  { id: "bp4", title: "Kids Eid Outfits 2026", slug: "kids-eid-outfits", excerpt: "Comfort meets festive.", content: "<p>Dressing kids for Eid without tears...</p>", image: "/images/kids/kids-1.jpg", category: "Family", tags: ["kids"], author: "Sadia Afrin", status: "draft", views: 0, publishDate: "2026-09-30", updated: "2026-09-24", seoTitle: "Kids Eid | Fashion Store", seoDesc: "Kids festive wear.", keyword: "kids eid" },
  { id: "bp5", title: "Summer Essentials Sale", slug: "summer-essentials", excerpt: "Old summer archive.", content: "<p>Summer picks archive.</p>", image: "/images/men/men-2.jpg", category: "Style Guide", tags: ["summer"], author: "Admin", status: "archived", views: 3200, publishDate: "2026-04-20", updated: "2026-05-01", seoTitle: "Summer | Fashion Store", seoDesc: "Summer archive.", keyword: "summer" },
];

export const demoBlogCategories: BlogCategory[] = [
  { id: "bc1", name: "Style Guide", slug: "style-guide", description: "How-to styling content.", parent: "—", posts: 12, status: "active", updated: "2026-09-01" },
  { id: "bc2", name: "Heritage", slug: "heritage", description: "Traditional wear stories.", parent: "—", posts: 8, status: "active", updated: "2026-08-15" },
  { id: "bc3", name: "Care", slug: "care", description: "Garment care tips.", parent: "—", posts: 5, status: "active", updated: "2026-08-01" },
  { id: "bc4", name: "Family", slug: "family", description: "Kids and family fashion.", parent: "—", posts: 6, status: "inactive", updated: "2026-07-20" },
];

export const demoMenus: SiteMenu[] = [
  {
    id: "mn1", name: "Header Menu", location: "Header", status: "active", updated: "2026-09-20",
    items: [
      { id: "mi1", label: "Home", url: "/", type: "Custom URL", newTab: false, icon: "", visible: true, css: "", children: [] },
      {
        id: "mi2", label: "Shop", url: "/products", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [
          { id: "mi2a", label: "Men", url: "/men", type: "Category", newTab: false, icon: "", visible: true, css: "", children: [] },
          { id: "mi2b", label: "Women", url: "/women", type: "Category", newTab: false, icon: "", visible: true, css: "", children: [] },
          { id: "mi2c", label: "Accessories", url: "/accessories", type: "Category", newTab: false, icon: "", visible: false, css: "", children: [] },
        ],
      },
      { id: "mi3", label: "Blog", url: "/blog", type: "Blog", newTab: false, icon: "", visible: true, css: "", children: [] },
      { id: "mi4", label: "About", url: "/about", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [] },
      { id: "mi5", label: "Contact", url: "/contact", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [] },
    ],
  },
  {
    id: "mn2", name: "Footer Menu", location: "Footer", status: "active", updated: "2026-09-18",
    items: [
      { id: "mf1", label: "Privacy Policy", url: "/privacy", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [] },
      { id: "mf2", label: "Terms", url: "/terms", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [] },
      { id: "mf3", label: "Returns", url: "/returns", type: "Page", newTab: false, icon: "", visible: true, css: "", children: [] },
    ],
  },
  {
    id: "mn3", name: "Mobile Menu", location: "Mobile", status: "active", updated: "2026-09-15",
    items: [
      { id: "mm1", label: "Home", url: "/", type: "Custom URL", newTab: false, icon: "home", visible: true, css: "", children: [] },
      { id: "mm2", label: "Shop", url: "/products", type: "Page", newTab: false, icon: "bag", visible: true, css: "", children: [] },
      { id: "mm3", label: "Wishlist", url: "/wishlist", type: "Page", newTab: false, icon: "heart", visible: true, css: "", children: [] },
    ],
  },
];

export const defaultFooter: FooterSettings = {
  logo: "/images/logo/logo.png",
  about: "Fashion Store brings quality fashion to every doorstep in Bangladesh.",
  email: "support@fashionstore.com.bd",
  phone: "09612-000000",
  address: "House 12, Road 5, Gulshan, Dhaka 1212",
  newsletter: true,
  payments: ["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "COD"],
  apps: true,
  copyright: "© 2026 Fashion Store. All rights reserved.",
  columns: [
    { id: "fc1", title: "Shop", links: ["Men", "Women", "Kids", "Accessories"], visible: true, order: 1 },
    { id: "fc2", title: "Help", links: ["Track Order", "Shipping", "Returns", "FAQ"], visible: true, order: 2 },
    { id: "fc3", title: "Company", links: ["About", "Careers", "Vendors", "Press"], visible: false, order: 3 },
  ],
  socials: [
    { id: "so1", network: "Facebook", url: "https://facebook.com/fashionstore", visible: true, order: 1 },
    { id: "so2", network: "Instagram", url: "https://instagram.com/fashionstore", visible: true, order: 2 },
    { id: "so3", network: "YouTube", url: "https://youtube.com/@fashionstore", visible: true, order: 3 },
    { id: "so4", network: "TikTok", url: "", visible: false, order: 4 },
  ],
};

export const demoFaqs: FaqItem[] = [
  { id: "fq1", question: "How long does delivery take?", answer: "Standard delivery takes 2–4 working days nationwide.", category: "Shipping", status: "published", order: 1, updated: "2026-09-01" },
  { id: "fq2", question: "What is the return policy?", answer: "Unused products with tags can be returned within 7 days.", category: "Returns", status: "published", order: 2, updated: "2026-09-01" },
  { id: "fq3", question: "Which payment methods do you accept?", answer: "COD, bKash, Nagad, Rocket and cards.", category: "Payments", status: "published", order: 3, updated: "2026-08-20" },
  { id: "fq4", question: "How do I track my order?", answer: "Use the tracking number from your confirmation SMS.", category: "Orders", status: "draft", order: 4, updated: "2026-09-22" },
  { id: "fq5", question: "How can I become a vendor?", answer: "Register on the vendor page; approval takes 48 hours.", category: "Vendors", status: "published", order: 5, updated: "2026-08-15" },
];

export const FAQ_CATEGORIES = ["General", "Orders", "Payments", "Shipping", "Returns", "Vendors", "Products", "Account"];

export const defaultContact: ContactInfo = {
  company: "Fashion Store",
  tagline: "Quality fashion to every doorstep.",
  phone: "09612-000000",
  phone2: "01700-000000",
  email: "info@fashionstore.com.bd",
  supportEmail: "support@fashionstore.com.bd",
  whatsapp: "01700-000000",
  address: "House 12, Road 5, Gulshan",
  city: "Dhaka",
  division: "Dhaka",
  country: "Bangladesh",
  postal: "1212",
  hours: [
    { day: "Monday", open: true, from: "09:00", to: "21:00" },
    { day: "Tuesday", open: true, from: "09:00", to: "21:00" },
    { day: "Wednesday", open: true, from: "09:00", to: "21:00" },
    { day: "Thursday", open: true, from: "09:00", to: "21:00" },
    { day: "Friday", open: true, from: "15:00", to: "21:00" },
    { day: "Saturday", open: true, from: "09:00", to: "21:00" },
    { day: "Sunday", open: false, from: "09:00", to: "21:00" },
  ],
  socials: [
    { id: "cs1", network: "Facebook", url: "https://facebook.com/fashionstore", visible: true, order: 1 },
    { id: "cs2", network: "Instagram", url: "https://instagram.com/fashionstore", visible: true, order: 2 },
    { id: "cs3", network: "YouTube", url: "https://youtube.com/@fashionstore", visible: true, order: 3 },
  ],
  mapsUrl: "https://maps.google.com/?q=Gulshan+Dhaka",
  mapsEmbed: "https://maps.google.com/maps?q=Gulshan+Dhaka&output=embed",
};

export const defaultSeo: SeoSettings = {
  siteTitle: "Fashion Store",
  siteDesc: "Quality fashion delivered across Bangladesh.",
  metaTitle: "Fashion Store | Online Shopping in Bangladesh",
  metaDesc: "Shop men, women, kids fashion and accessories with cash on delivery.",
  keywords: "fashion, clothing, ecommerce, bangladesh",
  canonical: "https://fashionstore.com.bd",
  socialImage: "/images/Banner/banne1.png",
  favicon: "/icon.png",
  productTpl: "{product_name} | {site_name}",
  categoryTpl: "{category_name} | {site_name}",
  blogTpl: "{post_title} | {site_name}",
  ogTitle: "Fashion Store",
  ogDesc: "Quality fashion delivered across Bangladesh.",
  ogImage: "/images/Banner/banne1.png",
  twitterCard: "summary_large_image",
  twitterTitle: "Fashion Store",
  twitterDesc: "Quality fashion delivered across Bangladesh.",
  twitterImage: "/images/Banner/banne1.png",
};

export const demoMedia: MediaFile[] = [
  { id: "md1", name: "hero-eid-2026.jpg", type: "image", size: "1.2 MB", bytes: 1258291, date: "2026-09-01", dims: "1740×904", by: "Admin", url: "/images/Banner/banne1.png", alt: "Eid hero banner", caption: "Homepage hero", description: "" },
  { id: "md2", name: "kurti-red-1.jpg", type: "image", size: "860 KB", bytes: 880640, date: "2026-09-10", dims: "1000×1204", by: "Admin", url: "/images/women/women-1.jpg", alt: "Red printed kurti", caption: "", description: "" },
  { id: "md3", name: "launch-video.mp4", type: "video", size: "8.4 MB", bytes: 8808038, date: "2026-09-15", dims: "1920×1080", by: "Editor", url: "#", alt: "Launch video", caption: "", description: "" },
  { id: "md4", name: "return-policy.pdf", type: "document", size: "240 KB", bytes: 245760, date: "2026-08-20", dims: "—", by: "Admin", url: "#", alt: "", caption: "", description: "Return policy document" },
  { id: "md5", name: "panjabi-white.jpg", type: "image", size: "910 KB", bytes: 931840, date: "2026-09-12", dims: "1000×1204", by: "Admin", url: "/images/men/men-1.jpg", alt: "White panjabi", caption: "", description: "" },
  { id: "md6", name: "saree-green.jpg", type: "image", size: "1.1 MB", bytes: 1153433, date: "2026-09-11", dims: "1000×1204", by: "Editor", url: "/images/women/women-2.jpg", alt: "Green silk saree", caption: "", description: "" },
];

export const demoCmsActivity: CmsActivity[] = [
  { id: "ca1", event: "Homepage banner updated", description: "Eid Hero banner content changed", user: "Admin", date: "2026-09-24", time: "10:20 AM", status: "success" },
  { id: "ca2", event: "New blog post created", description: "Kids Eid Outfits 2026 drafted", user: "Editor", date: "2026-09-24", time: "09:05 AM", status: "info" },
  { id: "ca3", event: "Footer information updated", description: "Support email changed", user: "Admin", date: "2026-09-22", time: "03:40 PM", status: "success" },
  { id: "ca4", event: "FAQ item published", description: "How can I become a vendor?", user: "Admin", date: "2026-09-22", time: "11:15 AM", status: "success" },
  { id: "ca5", event: "SEO settings changed", description: "Default meta description updated", user: "Admin", date: "2026-09-20", time: "04:50 PM", status: "warning" },
  { id: "ca6", event: "New media uploaded", description: "6 files added to library", user: "Editor", date: "2026-09-18", time: "01:30 PM", status: "info" },
  { id: "ca7", event: "Header menu reordered", description: "Shop moved above Blog", user: "Admin", date: "2026-09-20", time: "09:12 AM", status: "success" },
];

export const PAGE_TEMPLATES = ["Default", "Full Width", "Landing Page", "Contact Page", "About Page", "FAQ Page", "Services Page"];
export const BANNER_POSITIONS = ["Homepage Hero", "Homepage Promotional", "Shop Banner", "Category Banner", "Product Banner", "Blog Banner", "Sidebar", "Popup"];

export function seoScore(title: string, desc: string, keyword: string, slug: string): Array<{ label: string; ok: boolean; hint: string }> {
  return [
    { label: "Title length", ok: title.length >= 30 && title.length <= 60, hint: `${title.length}/60` },
    { label: "Meta description", ok: desc.length >= 120 && desc.length <= 160, hint: `${desc.length}/160` },
    { label: "Keyword usage", ok: keyword.length > 0 && (title.toLowerCase().includes(keyword.toLowerCase()) || desc.toLowerCase().includes(keyword.toLowerCase())), hint: keyword || "—" },
    { label: "URL structure", ok: /^[a-z0-9-]+$/.test(slug), hint: `/${slug}` },
  ];
}
