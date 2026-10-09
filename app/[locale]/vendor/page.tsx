"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  Megaphone,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Star,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { Field } from "@/components/admin/products/edit/sections";
import { demoAnnouncement, vendorSalesTrend, vendorSummary } from "@/features/vendor/vendor";
import {
  useVendorNotifications,
  useVendorOrders,
  useVendorPayouts,
  useVendorProducts,
  useVendorProfile,
  useVendorReviews,
  useVendorStore,
} from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RANGES = ["Today", "Last 7 Days", "Last 30 Days", "This Month", "This Year"] as const;

function Kpi({ label, value, sub, delta, icon: Icon, tile, action }: { label: string; value: string; sub?: string; delta?: number; icon: LucideIcon; tile: string; action?: React.ReactNode }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          {sub ? <p className="truncate text-[11px] text-muted-foreground">{sub}</p> : null}
          {delta !== undefined ? (
            <span className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {positive ? "+" : ""}{delta}%
            </span>
          ) : null}
          {action}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("size-3.5", s <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground")} aria-hidden="true" />
      ))}
    </span>
  );
}

function Progress({ value, bar = "from-primary to-secondary" }: { value: number; bar?: string }) {
  return (
    <div className="h-2 w-full bg-muted">
      <div className={`h-full bg-gradient-to-r ${bar}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function VendorOverviewPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const profile = useVendorProfile();
  const orders = useVendorOrders();
  const products = useVendorProducts();
  const payouts = useVendorPayouts();
  const reviews = useVendorReviews();
  const notifications = useVendorNotifications();
  const store = useVendorStore();
  const dismissed = useVendorStore((s) => s.announcementDismissed);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 30 Days");
  const [topBy, setTopBy] = useState<"sales" | "revenue" | "orders">("sales");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState(10000);
  const [withdrawMethod, setWithdrawMethod] = useState("Bank Transfer");
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [stockId, setStockId] = useState<string | null>(null);
  const [stockQty, setStockQty] = useState(10);

  const summary = useMemo(() => vendorSummary(), []);
  const trend = useMemo(() => vendorSalesTrend(), []);
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  const topProducts = useMemo(() => {
    const list = [...products];
    if (topBy === "revenue") list.sort((a, b) => b.sold * b.price - a.sold * a.price);
    else if (topBy === "orders") list.sort((a, b) => b.sold - a.sold);
    else list.sort((a, b) => b.sold - a.sold);
    return list.slice(0, 4);
  }, [products, topBy]);

  const lowStock = useMemo(() => products.filter((p) => p.stock < 10), [products]);
  const dist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[5 - r.rating] += 1;
    const total = Math.max(1, reviews.length);
    return counts.map((count, i) => ({ stars: 5 - i, count, pct: Math.round((count / total) * 100) }));
  }, [reviews]);

  const gross = 485250;
  const commission = 58230;
  const refunds = 3310;
  const net = 425800;
  const available = 125450;
  const pendingBal = 32500;

  const firstName = profile.name.split(" ")[0];

  const handleWithdraw = () => {
    if (withdrawAmt <= 0 || withdrawAmt > available) return;
    store.addPayout({
      id: `PO-${311 + payouts.length}`,
      amount: withdrawAmt,
      method: withdrawMethod,
      date: "2026-09-26",
      status: "pending",
    });
    setWithdrawOpen(false);
    toast.success(t("toastWithdraw"));
  };

  const handleReply = () => {
    if (!replyId || !replyText.trim()) return;
    store.replyReview(replyId, replyText.trim());
    setReplyId(null);
    setReplyText("");
    toast.success(t("toastReply"));
  };

  const handleStock = () => {
    const p = products.find((x) => x.id === stockId);
    if (!p) return;
    store.patchProduct(p.id, { stock: p.stock + Math.max(0, stockQty), status: "active" });
    setStockId(null);
    toast.success(t("toastStock"));
  };

  const quick: Array<[string, string, LucideIcon]> = [
    ["/vendor/products", t("addProduct"), Plus],
    ["/vendor/products", t("manageProducts"), Package],
    ["/vendor/orders", t("viewOrders"), ShoppingCart],
    ["/vendor/products", t("updateInventory"), Pencil],
    ["/vendor/earnings", t("viewEarnings"), Wallet],
    ["/vendor/store", t("manageStore"), Store],
    ["/vendor/reviews", t("viewReviews"), Star],
    ["/vendor/earnings", t("createCoupon"), BadgeDollarSign],
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={profile.store}
        title={`${t("hello")}, ${firstName}`}
        subtitle={t("helloSub")}
        highlightLabel={t("availBalance")}
        highlightValue={money(available)}
        highlightIcon={Wallet}
      >
        <button type="button" onClick={() => setWithdrawOpen(true)} className={heroPillClassName}>
          <Wallet className="size-3.5" aria-hidden="true" />
          {t("withdraw")}
        </button>
        <Link href="/vendor/orders" className={heroPillClassName}>{t("viewOrders")}</Link>
        <Link href="/vendor/products" className={heroPillClassName}>{t("addProduct")}</Link>
      </AccountingHero>

      {!dismissed ? (
        <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            <strong>{demoAnnouncement.title}:</strong> {demoAnnouncement.text}
          </p>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs" onClick={() => store.dismissAnnouncement()}>
            {t("dismiss")}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Kpi label={t("kpiSales")} value={money(summary.sales)} sub={t("vsPrev")} delta={12.5} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <Kpi label={t("kpiEarnings")} value={money(summary.earnings)} sub={t("afterCommission")} delta={9.8} icon={Wallet} tile="bg-green-600/10 text-green-700" />
        <Kpi label={t("kpiOrders")} value={num(summary.orders)} sub={t("vsPrev")} delta={7.2} icon={ShoppingCart} tile="bg-primary/15 text-secondary" />
        <Kpi label={t("kpiProducts")} value={`${products.length}`} sub={`${summary.activeProducts} active · ${summary.outOfStock} out`} icon={Package} tile="bg-secondary/15 text-secondary" />
        <Kpi
          label={t("kpiPending")} value={num(summary.pending)} icon={Bell} tile="bg-primary/20 text-[#8a5a00]"
          action={<Link href="/vendor/orders"><span className="text-[11px] font-bold text-secondary hover:underline">{t("viewOrders")}</span></Link>}
        />
        <Kpi label={t("kpiCompleted")} value={num(summary.completed)} sub={`${Math.round((summary.completed / Math.max(1, summary.orders)) * 100)}%`} icon={ShoppingCart} tile="bg-green-600/10 text-green-700" />
        <Kpi label={t("kpiCancelled")} value={num(summary.cancelled)} sub="3.1%" icon={ShoppingCart} tile="bg-destructive/10 text-destructive" />
        <Kpi label={t("availBalance")} value={money(available)} sub={`${t("pendingBalance")}: ${money(pendingBal)}`} icon={Wallet} tile="bg-secondary/15 text-secondary"
          action={<button type="button" onClick={() => setWithdrawOpen(true)} className="text-left text-[11px] font-bold text-secondary hover:underline">{t("withdraw")}</button>}
        />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("salesPerf")}</CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {RANGES.map((r) => (
              <Button key={r} variant={range === r ? "default" : "outline"} size="sm" className={range === r ? "h-7 text-xs" : "h-7 bg-card text-xs"} onClick={() => setRange(r)}>
                {r}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("ordersOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { l: t("pending"), v: 12 }, { l: t("processing"), v: 8 }, { l: t("shipped"), v: 24 },
              { l: t("completed"), v: 148 }, { l: t("cancelled"), v: 6 },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-semibold">{s.l}</span>
                <Progress value={(s.v / 148) * 100} />
                <span className="w-8 text-right font-bold">{s.v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("recentOrders")}</CardTitle>
            <Link href="/vendor/orders">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-10 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead className="text-right">{t("tTotal")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{o.id}</p>
                      <p className="max-w-28 truncate text-xs text-muted-foreground" title={o.customer}>{o.customer}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(o.total)}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", o.status === "completed" ? "bg-green-600/10 text-green-700" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>
                        {t(o.status)}
                      </span>
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
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("topProducts")}</CardTitle>
            <Select value={topBy} onValueChange={(v) => setTopBy((v as "sales" | "revenue" | "orders") ?? "sales")}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">{t("bySales")}</SelectItem>
                <SelectItem value="revenue">{t("byRevenue")}</SelectItem>
                <SelectItem value="orders">{t("byOrders")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="relative block h-11 w-11 shrink-0 overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">{num(p.sold)} sold · {money(p.sold * p.price)}</span>
                </span>
                <Stars value={p.rating} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("invAlerts")}</CardTitle>
            <Link href="/vendor/products">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("manageInventory")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {lowStock.length > 0 ? (
              lowStock.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className={cn("text-xs font-bold", p.stock === 0 ? "text-destructive" : "text-[#8a5a00]")}>
                      {p.stock === 0 ? t("outStock") : `${t("lowStock")}: ${p.stock}`}
                    </span>
                  </span>
                  <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={() => { setStockId(p.id); setStockQty(10); }}>
                    <Pencil className="size-3" aria-hidden="true" />
                    {t("edit")}
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyProducts")} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("earnOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            {[
              [t("grossSales"), money(gross)],
              [t("commission"), `-${money(commission)}`],
              [t("refunds"), `-${money(refunds)}`],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
              <span className="font-bold">{t("netEarnings")}</span>
              <span className="font-heading text-lg font-bold text-secondary">{money(net)}</span>
            </div>
            <Link href="/vendor/earnings">
              <Button variant="outline" size="sm" className="mt-2 w-full bg-card">{t("viewEarnings")}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("revOverview")}</CardTitle>
            <Link href="/vendor/reviews">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-heading text-3xl font-bold">{avgRating}</span>
              <Stars value={avgRating} />
              <span className="text-xs text-muted-foreground">({num(reviews.length)})</span>
            </div>
            {dist.slice(0, 3).map((d) => (
              <div key={d.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-bold">{d.stars}★</span>
                <Progress value={d.pct} />
                <span className="w-9 text-right text-muted-foreground">{d.pct}%</span>
              </div>
            ))}
            {reviews.filter((r) => !r.replied).slice(0, 1).map((r) => (
              <div key={r.id} className="border border-border bg-card p-2 text-xs">
                <p className="font-bold">{r.customer} · {r.product}</p>
                <p className="truncate text-muted-foreground">“{r.text}”</p>
                <Button variant="outline" size="sm" className="mt-1 h-7 bg-card text-xs" onClick={() => { setReplyId(r.id); setReplyText(""); }}>
                  {t("reply")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("storeHealth")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {[
              [t("profileDone"), 92],
              [t("infoDone"), 87],
              [t("fulfillment"), 96],
              [t("responseRate"), 91],
            ].map(([l, v]) => (
              <div key={l as string} className="flex flex-col gap-1">
                <span className="flex items-center justify-between text-xs font-semibold">
                  {l as string}
                  <span className="font-bold text-secondary">{v as number}%</span>
                </span>
                <Progress value={v as number} />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold">{t("custRating")}</span>
              <Stars value={profile.rating} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quick.map(([href, label, Icon]) => (
              <Link key={label} href={href}>
                <span className="flex flex-col items-center gap-1.5 border border-border bg-card px-2 py-3 text-center transition-colors hover:border-secondary">
                  <Icon className="size-5 text-secondary" aria-hidden="true" />
                  <span className="text-[11px] font-bold">{label}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="flex items-center gap-1.5 font-heading text-base font-bold">
              <Bell className="size-4 text-secondary" aria-hidden="true" />
              {t("notifications")} ({notifications.filter((n) => !n.read).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={cn("flex items-center gap-2 py-2 text-xs", !n.read && "font-semibold")}>
                {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" /> : <span className="size-1.5 shrink-0" aria-hidden="true" />}
                <span className="min-w-0 flex-1 truncate">{n.text}</span>
                <span className="shrink-0 text-muted-foreground">{n.date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("storePerf")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              [t("storeViews"), "24,800"],
              [t("prodViews"), num(products.reduce((n, p) => n + p.views, 0))],
              [t("convRate"), "3.4%"],
              [t("aov"), money(2650)],
              [t("revenue"), money(summary.sales)],
              [t("custGrowth"), "+11%"],
            ].map(([l, v]) => (
              <div key={l as string} className="flex items-center justify-between border-b border-border py-1.5">
                <span className="text-muted-foreground">{l as string}</span>
                <span className="font-bold">{v as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("recentPayouts")}</CardTitle>
            <Link href="/vendor/earnings">
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
                {t("viewPayouts")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {payouts.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="font-mono text-xs font-bold">{p.id}</span>
                <span className="text-xs text-muted-foreground">{p.method} · {p.date}</span>
                <span className="ml-auto font-bold text-secondary">{money(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("withdrawTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("withdrawAmt")}>
              <Input type="number" min={0} max={available} value={withdrawAmt} onChange={(e) => setWithdrawAmt(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("withdrawMethod")}>
              <Select value={withdrawMethod} onValueChange={(v) => setWithdrawMethod(v ?? "Bank Transfer")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Bank Transfer", "bKash", "Nagad", "Rocket"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("availBalance")}: {money(available)}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setWithdrawOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleWithdraw} disabled={withdrawAmt <= 0 || withdrawAmt > available}>
              {t("withdraw")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyId} onOpenChange={(open) => !open && setReplyId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("reply")}</DialogTitle>
          </DialogHeader>
          <Field label={t("reply")}>
            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={t("replyPh")} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleReply}>{t("saveReply")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!stockId} onOpenChange={(open) => !open && setStockId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("addStock")}</DialogTitle>
          </DialogHeader>
          <Field label={t("addStock")}>
            <Input type="number" min={0} value={stockQty} onChange={(e) => setStockQty(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setStockId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleStock}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
