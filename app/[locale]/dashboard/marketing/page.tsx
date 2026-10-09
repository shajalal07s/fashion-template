"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Flame,
  Gift,
  Megaphone,
  Star,
  Store,
  Tags,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { CommissionTimeline } from "@/components/admin/commission/shared";
import { MarketingStatusBadge } from "@/components/admin/marketing/shared";
import {
  useMktActivity,
  useMktBanners,
  useMktCampaigns,
  useMktCoupons,
  useMktFeatured,
  useMktFlash,
  useMktNewsletters,
  useMktProductOffers,
  useMktPromotions,
  useMktSubscribers,
  useMktVendorOffers,
} from "@/store/marketing.store";

const RANGES = ["today", "7days", "30days", "3months", "6months", "1year"] as const;

const RANGE_DATA: Record<(typeof RANGES)[number], Array<{ x: string; y: number }>> = {
  today: [
    { x: "9AM", y: 42000 }, { x: "11AM", y: 86300 }, { x: "1PM", y: 52900 }, { x: "3PM", y: 96800 }, { x: "5PM", y: 57300 }, { x: "8PM", y: 119000 },
  ],
  "7days": [
    { x: "18", y: 208000 }, { x: "19", y: 527000 }, { x: "20", y: 486000 }, { x: "21", y: 350000 }, { x: "22", y: 410000 }, { x: "23", y: 390000 }, { x: "24", y: 529000 },
  ],
  "30days": [
    { x: "W1", y: 1119000 }, { x: "W2", y: 1440000 }, { x: "W3", y: 1798000 }, { x: "W4", y: 2495000 },
  ],
  "3months": [
    { x: "Jul", y: 4120000 }, { x: "Aug", y: 5580000 }, { x: "Sep", y: 4888000 },
  ],
  "6months": [
    { x: "Apr", y: 2980000 }, { x: "May", y: 3320000 }, { x: "Jun", y: 3950000 }, { x: "Jul", y: 4120000 }, { x: "Aug", y: 5580000 }, { x: "Sep", y: 4888000 },
  ],
  "1year": [
    { x: "Q1", y: 8840000 }, { x: "Q2", y: 10450000 }, { x: "Q3", y: 14588000 }, { x: "Q4", y: 4200000 },
  ],
};

function Kpi({ label, value, delta, icon: Icon, tile}: { label: string; value: string; delta: number; icon: LucideIcon; tile: string }) {
  const positive = delta >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          <span className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
            {positive ? "+" : ""}{delta}%
          </span>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function MarketingOverviewPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const coupons = useMktCoupons();
  const campaigns = useMktCampaigns();
  const flash = useMktFlash();
  const promotions = useMktPromotions();
  const productOffers = useMktProductOffers();
  const vendorOffers = useMktVendorOffers();
  const banners = useMktBanners();
  const featured = useMktFeatured();
  const subscribers = useMktSubscribers();
  const newsletters = useMktNewsletters();
  const activity = useMktActivity();
  const [range, setRange] = useState<(typeof RANGES)[number]>("30days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rangeKey = (r: (typeof RANGES)[number]) =>
    r === "today" ? "rangeToday" : r === "7days" ? "range7" : r === "30days" ? "range30" : r === "3months" ? "range3m" : r === "6months" ? "range6m" : "range1y";

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const mktRevenue = useMemo(() => campaigns.reduce((n, c) => n + c.revenue, 0), [campaigns]);
  const mktOrders = useMemo(() => campaigns.reduce((n, c) => n + c.orders, 0), [campaigns]);
  const mktDiscount = useMemo(() => campaigns.reduce((n, c) => n + c.discount, 0), [campaigns]);
  const topPromos = useMemo(() => [...promotions].sort((a, b) => b.revenue - a.revenue).slice(0, 5), [promotions]);
  const upcoming = useMemo(
    () =>
      [
        ...campaigns.filter((c) => c.status === "scheduled").map((c) => ({ name: c.name, date: c.start, kind: "Campaign" })),
        ...flash.filter((f) => f.status === "scheduled").map((f) => ({ name: f.name, date: f.start, kind: "Flash Sale" })),
        ...coupons.filter((c) => c.status === "scheduled").map((c) => ({ name: c.name, date: c.start, kind: "Coupon" })),
        ...newsletters.filter((n) => n.status === "scheduled").map((n) => ({ name: n.name, date: n.date, kind: "Newsletter" })),
        ...banners.filter((b) => b.status === "scheduled").map((b) => ({ name: b.name, date: b.start, kind: "Banner" })),
      ]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6),
    [campaigns, flash, coupons, newsletters, banners]
  );

  const kpis = [
    { label: t("kpiCampaigns"), value: num(campaigns.length), delta: 12, icon: Megaphone, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiActiveCampaigns"), value: num(activeCampaigns.length), delta: 8, icon: Flame, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiCoupons"), value: num(coupons.length), delta: 5, icon: TicketPercent, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiActiveCoupons"), value: num(coupons.filter((c) => c.status === "active").length), delta: 3, icon: BadgePercent, tile: "bg-green-600/10 text-green-700" },
    { label: t("kpiFlash"), value: num(flash.length), delta: 20, icon: Flame, tile: "bg-destructive/10 text-destructive" },
    { label: t("kpiPromos"), value: num(promotions.filter((p) => p.status === "active").length), delta: 15, icon: Gift, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiProductOffers"), value: num(productOffers.length), delta: 6, icon: Tags, tile: "bg-primary/15 text-secondary" },
    { label: t("kpiVendorOffers"), value: num(vendorOffers.length), delta: 4, icon: Store, tile: "bg-secondary/15 text-secondary" },
    { label: t("kpiFeatured"), value: num(featured.length), delta: 9, icon: Star, tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("kpiSubs"), value: num(subscribers.length * 5334), delta: 18, icon: Users, tile: "bg-green-600/10 text-green-700" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("mktRevenue")}
        highlightValue={money(mktRevenue)}
        highlightIcon={Megaphone}
      >
        <Link href="/dashboard/marketing/campaigns" className={heroPillClassName}>{t("cpTitle")}</Link>
        <Link href="/dashboard/marketing/coupons" className={heroPillClassName}>{t("cTitle")}</Link>
        <Link href="/dashboard/marketing/flash-sale" className={heroPillClassName}>{t("fTitle")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
          <div>
            <CardTitle className="font-heading text-base font-bold">{t("chartSales")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("mktOrders")}: {num(mktOrders)} · {t("mktDiscount")}: {money(mktDiscount)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map((r) => (
              <Button key={r} variant={range === r ? "default" : "outline"} size="sm" className={range === r ? "h-7 text-xs" : "h-7 bg-card text-xs"} onClick={() => setRange(r)}>
                {t(rangeKey(r))}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart data={RANGE_DATA[range]} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("campaignPerf")}</CardTitle>
            <Link href="/dashboard/marketing/campaigns">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tCampaign")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead className="text-right">{t("tConversion")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 5).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-44 truncate text-sm font-semibold" title={c.name}>{c.name}</TableCell>
                    <TableCell className="text-right text-sm">{num(c.orders)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(c.revenue)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{c.conversion}%</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("topPromos")}</CardTitle>
            <Link href="/dashboard/marketing/promotions">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tPromo")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPromos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-44 truncate text-sm font-semibold" title={p.name}>{p.name}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.type}</TableCell>
                    <TableCell className="text-right text-sm">{num(p.orders)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(p.revenue)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CommissionTimeline
              events={activity.map((a) => ({
                event: a.event,
                date: a.date,
                time: a.time,
                user: a.user,
                description: a.description,
              }))}
            />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("upcoming")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center bg-secondary/15 font-heading text-sm font-bold text-secondary">
                  {u.date.slice(8, 10)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{u.name}</span>
                  <span className="block text-xs text-muted-foreground">{u.kind} · {u.date}</span>
                </span>
                <span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#8a5a00]">
                  {u.kind}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
