"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Ban,
  CheckCircle2,
  Eye,
  HandCoins,
  MapPin,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { CommissionTimeline } from "@/components/admin/commission/shared";
import {
  BlockCustomerDialog,
  CustomerStatusBadge,
} from "@/components/admin/customers/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers, type AdminOrder } from "@/features/admin/analytics";
import { decodeCustomerKey, encodeCustomerKey } from "@/features/admin/customer-key";
import {
  addressesForCustomer,
  activityForCustomer,
  defaultStatus,
  isVerified,
  reviewsForCustomer,
  walletForCustomer,
  type BlockInfo,
  type CustomerAddress,
  type CustomerReview,
  type ReviewStatus,
  type WalletTx,
} from "@/features/admin/customer-mgmt";
import { useAdminCustomersStore } from "@/store/admin-customers.store";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all text-foreground", bold && "font-bold text-secondary")}>
        {value}
      </span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("size-3.5", s <= value ? "fill-primary text-primary" : "text-muted-foreground")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const REVIEW_CLASS: Record<ReviewStatus, string> = {
  published: "bg-green-600/10 text-green-700",
  pending: "bg-primary/20 text-[#8a5a00]",
  hidden: "bg-muted text-muted-foreground",
  reported: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
};

export default function CustomerDetailsPage() {
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const params = useParams<{ email: string }>();
  const email = decodeCustomerKey(params.email);
  const orders = useAdminOrders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const overrides = useAdminCustomersStore((s) => s.overrides);
  const deleted = useAdminCustomersStore((s) => s.deleted);
  const manual = useAdminCustomersStore((s) => s.manual);
  const mgmt = useCustomerMgmtStore();
  const k = email.toLowerCase();

  const [tab, setTab] = useState("overview");
  const [blockOpen, setBlockOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);
  const [viewReview, setViewReview] = useState<CustomerReview | null>(null);
  const [responseText, setResponseText] = useState("");
  const [viewTx, setViewTx] = useState<WalletTx | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjKind, setAdjKind] = useState<"add" | "deduct">("add");
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjReason, setAdjReason] = useState("");
  const [addrDialog, setAddrDialog] = useState<null | { mode: "add" | "edit"; id?: string }>(null);
  const [confirmDeleteAddr, setConfirmDeleteAddr] = useState<string | null>(null);
  const [confirmDeleteReview, setConfirmDeleteReview] = useState<string | null>(null);
  const [orderQuery, setOrderQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [formAddr, setFormAddr] = useState<CustomerAddress>({
    id: "",
    label: "Home",
    kind: "home",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal: "",
    country: "Bangladesh",
    isDefault: false,
    isBilling: false,
  });

  const base = useMemo(() => {
    const fromManual = manual.find((m) => m.email.toLowerCase() === k);
    if (fromManual && !deleted.includes(k)) return fromManual;
    const found = buildCustomers(orders).find((c) => c.email.toLowerCase() === k);
    if (!found || deleted.includes(k)) return null;
    const patch = overrides[k] ?? {};
    return { ...found, name: patch.name ?? found.name, phone: patch.phone ?? found.phone, city: patch.city ?? found.city };
  }, [manual, orders, overrides, deleted, k]);

  const status = mgmt.statusOverrides[k] ?? (base ? defaultStatus(base.email) : "active");
  const verified = mgmt.verifiedOverrides[k] ?? (base ? isVerified(base.email) : false);
  const blockInfo = mgmt.blockInfo[k];

  const customerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.customerEmail.toLowerCase() === k)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [orders, k]
  );

  const walletBase = useMemo(
    () => (base ? walletForCustomer(base.email, base.spent, base.orders) : { balance: 0, txs: [] }),
    [base]
  );
  const walletExtra = mgmt.walletExtra;
  const walletTxs = useMemo(() => [...(walletExtra[k] ?? []), ...walletBase.txs], [walletExtra, k, walletBase]);
  const walletBalance = walletTxs.length > 0 ? walletTxs[0].balanceAfter : walletBase.balance;

  const reviewsBase = useMemo(
    () => (base ? reviewsForCustomer(base.email, base.name, orders) : []),
    [base, orders]
  );
  const reviews = useMemo(
    () =>
      reviewsBase
        .filter((r) => !mgmt.deletedReviews.includes(r.id))
        .map((r) => ({
          ...r,
          status: mgmt.reviewStatus[r.id] ?? r.status,
          response: mgmt.reviewResponses[r.id] ?? r.response,
        })),
    [reviewsBase, mgmt.deletedReviews, mgmt.reviewStatus, mgmt.reviewResponses]
  );

  const addresses = useMemo<CustomerAddress[]>(() => {
    if (mgmt.addressOverrides[k]) return mgmt.addressOverrides[k];
    if (!base) return [];
    const ship = orders.find((o) => o.customerEmail.toLowerCase() === k);
    return addressesForCustomer(base.name, base.phone, ship?.address ?? "", ship?.city ?? base.city);
  }, [mgmt.addressOverrides, k, base, orders]);

  const activities = useMemo(
    () => (base ? activityForCustomer(base.email, base.name, orders) : []),
    [base, orders]
  );

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    if (!q) return customerOrders;
    return customerOrders.filter((o) => o.id.toLowerCase().includes(q));
  }, [customerOrders, orderQuery]);

  const filteredActivity = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    return activities.filter(
      (a) =>
        (activityType === "all" || a.type === activityType) &&
        (!q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    );
  }, [activities, activityQuery, activityType]);

  const activityTypes = useMemo(() => [...new Set(activities.map((a) => a.type))], [activities]);

  const purchase = useMemo(() => {
    const done = customerOrders.filter((o) => o.status === "delivered").length;
    const pending = customerOrders.filter((o) => o.status === "pending" || o.status === "processing").length;
    const cancelled = customerOrders.filter((o) => o.status === "cancelled").length;
    return { done, pending, cancelled, returned: 0, refunded: cancelled };
  }, [customerOrders]);

  const spending = useMemo(() => {
    const totals = customerOrders.map((o) => o.total);
    const highest = totals.length > 0 ? Math.max(...totals) : 0;
    return {
      total: base?.spent ?? 0,
      aov: customerOrders.length > 0 ? Math.round((base?.spent ?? 0) / customerOrders.length) : 0,
      highest,
      discount: Math.round((base?.spent ?? 0) * 0.06),
      refund: purchase.refunded * 1200,
    };
  }, [customerOrders, base, purchase]);

  const statusSlices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of customerOrders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    return [...counts.entries()].map(([s, value]) => ({
      id: s[0].toUpperCase() + s.slice(1),
      label: s,
      value,
    }));
  }, [customerOrders]);

  const spendSeries = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const o of [...customerOrders].reverse()) {
      const d = new Date(o.date);
      const key = d.toLocaleString("en", { month: "short" });
      byMonth.set(key, (byMonth.get(key) ?? 0) + o.total);
    }
    return [...byMonth.entries()].map(([x, y]) => ({ x, y }));
  }, [customerOrders]);

  const vendorSlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of customerOrders) {
      for (const item of o.items) map.set(item.category, (map.get(item.category) ?? 0) + item.price * item.quantity);
    }
    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
  }, [customerOrders]);

  if (!base) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={ts("customers")}
          title={tm("title")}
          highlightLabel={tm("tOrders")}
          highlightValue="0"
          highlightIcon={Users}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={tm("emptyTitle")} description={tm("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const openAddAddress = () => {
    setFormAddr({
      id: "",
      label: "Home",
      kind: "home",
      name: base.name,
      phone: base.phone,
      line1: "",
      line2: "",
      city: base.city,
      state: "",
      postal: "",
      country: "Bangladesh",
      isDefault: addresses.length === 0,
      isBilling: addresses.length === 0,
    });
    setAddrDialog({ mode: "add" });
  };

  const openEditAddress = (a: CustomerAddress) => {
    setFormAddr({ ...a });
    setAddrDialog({ mode: "edit", id: a.id });
  };

  const saveAddress = () => {
    if (!formAddr.line1.trim() || !formAddr.city.trim()) return;
    let next: CustomerAddress[];
    if (addrDialog?.mode === "edit" && addrDialog.id) {
      next = addresses.map((a) => (a.id === addrDialog.id ? { ...formAddr, id: a.id } : a));
    } else {
      next = [...addresses, { ...formAddr, id: `addr-${addresses.length}-${formAddr.line1.length}` }];
    }
    if (formAddr.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === (addrDialog?.id ?? next[next.length - 1].id) }));
    mgmt.saveAddresses(base.email, next);
    setAddrDialog(null);
    toast.success(tm("toastSaved"));
  };

  const handleAdjust = () => {
    if (adjAmount <= 0 || !adjReason.trim()) return;
    const delta = adjKind === "add" ? adjAmount : -adjAmount;
    mgmt.adjustWallet(base.email, {
      id: `WTX-A${walletTxs.length}${adjAmount}${base.email.length}`,
      type: "adjustment",
      description: adjReason.trim(),
      amount: delta,
      balanceAfter: Math.max(0, walletBalance + delta),
      status: "completed",
      date: "2026-09-26",
      reference: "ADMIN",
    });
    setAdjustOpen(false);
    setAdjAmount(0);
    setAdjReason("");
    toast.success(tm("toastSaved"));
  };

  const payStatusOf = (o: AdminOrder) =>
    o.status === "cancelled" ? "refunded" : o.status === "delivered" ? "paid" : "pending";

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={base.name}
        subtitle={`${base.email} · ${base.phone}`}
        highlightLabel={tm("pSpent")}
        highlightValue={money(base.spent)}
        highlightIcon={Users}
      >
        <Link href={`/dashboard/customers/${encodeCustomerKey(base.email)}/edit`} className={heroPillClassName}>
          <Pencil className="size-3.5" aria-hidden="true" />
          {tm("editTitle")}
        </Link>
        <button
          type="button"
          onClick={() => setBlockOpen(true)}
          className={heroPillClassName}
        >
          {status === "blocked" ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : (
            <Ban className="size-3.5" aria-hidden="true" />
          )}
          {status === "blocked" ? tm("unblockBtn") : tm("blockBtn")}
        </button>
      </AccountingHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label={tm("tOrders")} value={String(base.orders)} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <MiniStat label={tm("pAov")} value={money(spending.aov)} icon={Receipt} tile="bg-primary/15 text-secondary" />
        <MiniStat label={tm("pWallet")} value={money(walletBalance)} icon={Wallet} tile="bg-green-600/10 text-green-700" />
        <MiniStat label={tm("pReviews")} value={String(reviews.length)} icon={Star} tile="bg-primary/20 text-[#8a5a00]" />
        <MiniStat label={tm("pRefunds")} value={money(spending.refund)} icon={Receipt} tile="bg-purple-600/10 text-purple-700" />
        <MiniStat label={tm("pReturns")} value={String(purchase.returned)} icon={ArrowDown} tile="bg-muted text-muted-foreground" />
        <MiniStat label={tm("pLastOrder")} value={dateOf(base.lastOrder)} icon={ShoppingCart} tile="bg-secondary/15 text-secondary" />
        <div className="flex flex-col justify-center gap-1.5 border border-border bg-card p-4">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{tm("accStatus")}</p>
          <CustomerStatusBadge status={status} />
          {status === "blocked" && blockInfo ? (
            <p className="text-xs text-muted-foreground">
              {blockInfo.reason} · {blockInfo.date}
            </p>
          ) : null}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="overview">{tm("tabOverview")}</TabsTrigger>
          <TabsTrigger value="orders">{tm("tabOrders")} ({customerOrders.length})</TabsTrigger>
          <TabsTrigger value="reviews">{tm("tabReviews")} ({reviews.length})</TabsTrigger>
          <TabsTrigger value="wallet">{tm("tabWallet")}</TabsTrigger>
          <TabsTrigger value="addresses">{tm("tabAddresses")} ({addresses.length})</TabsTrigger>
          <TabsTrigger value="activity">{tm("tabActivity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6 pt-2">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <SectionCard title={tm("personalInfo")}>
              <KV label={tm("fName")} value={base.name} />
              <KV label={tm("fEmail")} value={base.email} />
              <KV label={tm("fPhone")} value={base.phone} />
              <KV label={tm("fDob")} value="1995-04-12" />
              <KV label={tm("fGender")} value="—" />
              <KV label={tm("customerId")} value={`CUS-${base.email.length}0${base.orders}1`} />
            </SectionCard>
            <SectionCard title={tm("accountInfo")}>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{tm("accStatus")}</span>
                <CustomerStatusBadge status={status} />
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{tm("emailVer")}</span>
                <button type="button" onClick={() => mgmt.toggleVerified(base.email, verified)} className="flex items-center gap-1.5 font-semibold">
                  <Checkbox checked={verified} aria-label={tm("emailVer")} />
                  <span className={verified ? "text-green-600" : "text-muted-foreground"}>{tm(verified ? "verified" : "unverified")}</span>
                </button>
              </div>
              <KV label={tm("phoneVer")} value={tm(verified ? "verified" : "unverified")} />
              <KV label={tm("joined")} value={dateOf(base.lastOrder)} />
              <KV label={tm("lastLogin")} value={dateOf(base.lastOrder)} />
              <KV label={tm("lastActive")} value={dateOf(base.lastOrder)} />
            </SectionCard>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <SectionCard title={tm("purchaseSummary")}>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: tm("completedOrders"), v: purchase.done },
                  { l: tm("pendingOrders"), v: purchase.pending },
                  { l: tm("cancelledOrders"), v: purchase.cancelled },
                  { l: tm("returnedOrders"), v: purchase.returned },
                  { l: tm("refundedOrders"), v: purchase.refunded },
                  { l: tm("tOrders"), v: base.orders },
                ].map((s) => (
                  <div key={s.l} className="border border-border bg-card px-2 py-3">
                    <p className="font-heading text-lg font-bold">{s.v}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title={tm("spendingSummary")}>
              <KV label={tm("pSpent")} value={money(spending.total)} bold />
              <KV label={tm("pAov")} value={money(spending.aov)} />
              <KV label={tm("highestOrder")} value={money(spending.highest)} />
              <KV label={tm("discountUsed")} value={money(spending.discount)} />
              <KV label={tm("refundAmount")} value={money(spending.refund)} />
            </SectionCard>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{tm("statSpend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={spendSeries.length > 0 ? spendSeries : [{ x: "—", y: 0 }]} />
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{tm("statStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={statusSlices.length > 0 ? statusSlices : [{ id: "Pending", label: "pending", value: 0 }]} unitLabel={tm("tOrders")} />
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{tm("statVendor")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={vendorSlices.length > 0 ? vendorSlices : [{ id: "—", label: "—", value: 0 }]} unitLabel={tm("pSpent")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="flex flex-col gap-4 pt-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} placeholder={tm("searchPlaceholder")} className="bg-card pl-9" />
          </div>
          <Card className="border-border bg-card">
            <CardContent className="overflow-x-auto p-0">
              {filteredOrders.length > 0 ? (
                <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead>{tm("tOrder")}</TableHead>
                      <TableHead>{tm("tDate")}</TableHead>
                      <TableHead className="text-center">{tm("tItems")}</TableHead>
                      <TableHead className="text-right">{tm("tTotal")}</TableHead>
                      <TableHead>{tm("tPayStatus")}</TableHead>
                      <TableHead>{tm("tOrderStatus")}</TableHead>
                      <TableHead className="w-20">{tm("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs font-bold whitespace-nowrap">{o.id}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(o.date)}</TableCell>
                        <TableCell className="text-center font-semibold">{o.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                        <TableCell className="text-right font-bold whitespace-nowrap text-secondary">{money(o.total)}</TableCell>
                        <TableCell>
                          <Badge className={cn("font-semibold", payStatusOf(o) === "paid" ? "bg-green-600/10 text-green-700" : payStatusOf(o) === "refunded" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>
                            {payStatusOf(o)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" onClick={() => setViewOrder(o)} aria-label={`${tm("orderDetails")} ${o.id}`} title={tm("orderDetails")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8">
                  <EmptyState icon={ShoppingCart} title={tm("emptyTitle")} description={tm("emptyOrders")} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="flex flex-col gap-4 pt-2">
          <Card className="border-border bg-card">
            <CardContent className="overflow-x-auto p-0">
              {reviews.length > 0 ? (
                <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead>{tm("tProduct")}</TableHead>
                      <TableHead className="text-center">{tm("tRating")}</TableHead>
                      <TableHead>{tm("tReview")}</TableHead>
                      <TableHead>{tm("tReviewStatus")}</TableHead>
                      <TableHead className="w-32">{tm("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="max-w-44 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                          <p className="text-xs text-muted-foreground">{dateOf(r.date)}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Stars value={r.rating} />
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-xs text-muted-foreground" title={r.text}>
                          {r.text}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-semibold whitespace-nowrap", REVIEW_CLASS[r.status])}>
                            {tm(`r${r.status[0].toUpperCase()}${r.status.slice(1)}` as "rPublished")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => { setViewReview(r); setResponseText(r.response ?? ""); }} aria-label={`${tm("viewTitle")} ${r.id}`} title={tm("viewTitle")}>
                              <Eye className="size-4" aria-hidden="true" />
                            </Button>
                            {r.status !== "published" ? (
                              <Button variant="ghost" size="icon-sm" onClick={() => { mgmt.setReviewStatus(r.id, "published"); toast.success(tm("toastSaved")); }} aria-label={`${tm("rPublished")} ${r.id}`} title={tm("rPublished")}>
                                <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon-sm" onClick={() => { mgmt.setReviewStatus(r.id, "hidden"); toast.success(tm("toastSaved")); }} aria-label={`${tm("rHidden")} ${r.id}`} title={tm("rHidden")}>
                                <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDeleteReview(r.id)} aria-label={r.id}>
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8">
                  <EmptyState icon={Star} title={tm("emptyTitle")} description={tm("emptyReviews")} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="flex flex-col gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MiniStat label={tm("wBalance")} value={money(walletBalance)} icon={Wallet} tile="bg-secondary/15 text-secondary" />
            <MiniStat label={tm("wCredits")} value={money(walletTxs.filter((x) => x.amount > 0).reduce((n, x) => n + x.amount, 0))} icon={HandCoins} tile="bg-green-600/10 text-green-700" />
            <MiniStat label={tm("wDebits")} value={money(Math.abs(walletTxs.filter((x) => x.amount < 0).reduce((n, x) => n + x.amount, 0)))} icon={Receipt} tile="bg-destructive/10 text-destructive" />
            <MiniStat label={tm("wRefunds")} value={money(walletTxs.filter((x) => x.type === "refund").reduce((n, x) => n + Math.abs(x.amount), 0))} icon={Receipt} tile="bg-purple-600/10 text-purple-700" />
            <MiniStat label={tm("wPending")} value={money(walletTxs.filter((x) => x.status === "pending").reduce((n, x) => n + Math.abs(x.amount), 0))} icon={ShoppingCart} tile="bg-primary/20 text-[#8a5a00]" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setAdjustOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              {tm("adjustTitle")}
            </Button>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{tm("tTx")}</TableHead>
                    <TableHead>{tm("tType")}</TableHead>
                    <TableHead>{tm("tDesc")}</TableHead>
                    <TableHead className="text-right">{tm("tAmount")}</TableHead>
                    <TableHead className="text-right">{tm("tBalanceAfter")}</TableHead>
                    <TableHead>{tm("tTxStatus")}</TableHead>
                    <TableHead className="w-20">{tm("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletTxs.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>
                        <p className="font-mono text-xs font-bold whitespace-nowrap">{x.id}</p>
                        <p className="text-xs whitespace-nowrap text-muted-foreground">{x.date}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">
                          {tm(`ty${x.type[0].toUpperCase()}${x.type.slice(1)}` as "tyCredit")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-xs text-muted-foreground" title={x.description}>{x.description}</TableCell>
                      <TableCell className={cn("text-right text-sm font-bold whitespace-nowrap", x.amount >= 0 ? "text-green-600" : "text-destructive")}>
                        {x.amount >= 0 ? "+" : ""}{money(x.amount)}
                      </TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap">{money(x.balanceAfter)}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-semibold", x.status === "completed" ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>
                          {tm(`st${x.status[0].toUpperCase()}${x.status.slice(1)}` as "stCompleted")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTx(x)} aria-label={`${tm("viewTitle")} ${x.id}`} title={tm("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="flex flex-col gap-4 pt-2">
          <div className="flex justify-end">
            <Button size="sm" className="h-8 gap-1.5" onClick={openAddAddress}>
              <Plus className="size-3.5" aria-hidden="true" />
              {tm("addAddress")}
            </Button>
          </div>
          {addresses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((a) => (
                <Card key={a.id} className="border-border bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
                      <MapPin className="size-4 text-secondary" aria-hidden="true" />
                      {a.label}
                      {a.isDefault ? <Badge className="bg-secondary/15 text-[10px] font-bold text-secondary">{tm("defaultBadge")}</Badge> : null}
                      {a.isBilling ? <Badge className="bg-primary/20 text-[10px] font-bold text-[#8a5a00]">{tm("billing")}</Badge> : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 text-sm">
                    <p className="font-semibold">{a.name} · <span className="font-mono font-normal">{a.phone}</span></p>
                    <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                    <p className="text-muted-foreground">{a.city}, {a.state} {a.postal}</p>
                    <p className="text-muted-foreground">{a.country} · {tm(`ty${a.kind[0].toUpperCase()}${a.kind.slice(1)}` as "tyHome")}</p>
                    <div className="flex flex-wrap items-center gap-1 pt-2">
                      {!a.isDefault ? (
                        <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={() => { mgmt.saveAddresses(base.email, addresses.map((x) => ({ ...x, isDefault: x.id === a.id }))); toast.success(tm("toastSaved")); }}>
                          {tm("setDefault")}
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditAddress(a)}>
                        {tm("editTitle")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDeleteAddr(a.id)}>
                        {tm("deleteAddress")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="py-8">
                <EmptyState icon={MapPin} title={tm("emptyTitle")} description={tm("emptyAddresses")} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={activityQuery} onChange={(e) => setActivityQuery(e.target.value)} placeholder={tm("acSearch")} className="bg-card pl-9" />
            </div>
            <Select value={activityType} onValueChange={(v) => setActivityType(v ?? "all")}>
              <SelectTrigger size="sm" className="h-8 w-44 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tm("all")}</SelectItem>
                {activityTypes.map((ty) => (
                  <SelectItem key={ty} value={ty}>{ty.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              {filteredActivity.length > 0 ? (
                <CommissionTimeline
                  events={filteredActivity.map((a) => ({
                    event: a.title,
                    date: a.date,
                    time: a.time,
                    user: base.name,
                    description: a.description,
                  }))}
                />
              ) : (
                <EmptyState icon={Eye} title={tm("emptyTitle")} description={tm("emptyActivity")} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BlockCustomerDialog
        open={blockOpen}
        customerName={base.name}
        mode={status === "blocked" ? "unblock" : "block"}
        onClose={() => setBlockOpen(false)}
        onConfirm={(info?: BlockInfo) => {
          if (status === "blocked") mgmt.setStatus(base.email, "active");
          else mgmt.setStatus(base.email, "blocked", info);
        }}
      />

      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {viewOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {tm("orderDetails")} · <span className="font-mono">{viewOrder.id}</span>
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={tm("orderDetails")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <KV label={tm("tOrder")} value={viewOrder.id} />
                  <KV label={tm("tDate")} value={dateOf(viewOrder.date)} />
                  <KV label={tm("tPayStatus")} value={payStatusOf(viewOrder)} />
                  <KV label={tm("fPhone")} value={viewOrder.payment.toUpperCase()} />
                </div>
              </SectionCard>
              <SectionCard title={tm("products")}>
                {(() => {
                  const groups = new Map<string, AdminOrder["items"]>();
                  for (const item of viewOrder.items) {
                    const arr = groups.get(item.category) ?? [];
                    arr.push(item);
                    groups.set(item.category, arr);
                  }
                  return [...groups.entries()].map(([vendor, items]) => (
                    <div key={vendor} className="border border-border">
                      <p className="border-b border-border bg-muted px-3 py-2 text-xs font-bold tracking-wider uppercase">
                        {tm("tVendors")}: {vendor}
                      </p>
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate font-medium">{item.name} × {item.quantity}</span>
                          <span className="font-bold whitespace-nowrap text-secondary">{money(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </SectionCard>
              <SectionCard title={tm("priceSummary")}>
                <KV label={tm("dSubtotal")} value={money(viewOrder.subtotal)} />
                <KV label={tm("dDiscount")} value={money(Math.max(0, viewOrder.subtotal - viewOrder.total + viewOrder.shipping))} />
                <KV label={tm("dShipping")} value={money(viewOrder.shipping)} />
                <KV label={tm("dTotal")} value={money(viewOrder.total)} bold />
              </SectionCard>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
        <DialogContent className="sm:max-w-md">
          {viewReview ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewReview.product}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Stars value={viewReview.rating} />
                <span className="text-xs text-muted-foreground">{dateOf(viewReview.date)}</span>
              </div>
              <p className="text-sm">{viewReview.text}</p>
              {viewReview.response ? (
                <div className="border border-border bg-muted px-3 py-2">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tm("adminResponse")}</p>
                  <p className="text-sm">{viewReview.response}</p>
                </div>
              ) : null}
              <Field label={tm("respond")}>
                <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder={tm("responsePh")} className="bg-card" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewReview(null)}>{tm("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { mgmt.setReviewResponse(viewReview.id, responseText); setViewReview(null); toast.success(tm("toastSaved")); }}>
                  {tm("saveBtn")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTx} onOpenChange={(open) => !open && setViewTx(null)}>
        <DialogContent className="sm:max-w-md">
          {viewTx ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {tm("viewTitle")} · <span className="font-mono">{viewTx.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <KV label={tm("tTx")} value={viewTx.id} />
                <KV label={tm("tType")} value={viewTx.type} />
                <KV label={tm("tAmount")} value={money(viewTx.amount)} bold />
                <KV label={tm("tBalanceAfter")} value={money(viewTx.balanceAfter)} />
                <KV label={tm("tRef")} value={viewTx.reference} />
                <KV label={tm("tDesc")} value={viewTx.description} />
                <KV label={tm("tTxDate")} value={viewTx.date} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewTx(null)}>{tm("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{tm("adjustTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tm("adjAmount")}>
              <Input type="number" min={0} value={adjAmount} onChange={(e) => setAdjAmount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={tm("tType")}>
              <Select value={adjKind} onValueChange={(v) => setAdjKind((v as "add" | "deduct") ?? "add")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">{tm("adjAdd")}</SelectItem>
                  <SelectItem value="deduct">{tm("adjDeduct")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={tm("adjReason")}>
            <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className="bg-card" />
          </Field>
          <div className="flex flex-col items-stretch border border-dashed border-secondary/40 bg-secondary/5 p-3">
            {[`${tm("currentBal")}: ${money(walletBalance)}`, `${adjKind === "add" ? "+" : "-"}${money(adjAmount)}`, `${tm("newBal")}: ${money(Math.max(0, walletBalance + (adjKind === "add" ? adjAmount : -adjAmount)))}`].map((s, i, arr) => (
              <div key={i} className="flex flex-col items-center">
                <span className={i === arr.length - 1 ? "w-full py-1 text-center text-sm font-bold text-secondary" : "w-full py-1 text-center text-sm"}>{s}</span>
                {i < arr.length - 1 ? <ArrowDown className="size-3.5 text-secondary" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdjustOpen(false)}>{tm("cancelBtn")}</Button>
            <Button size="sm" onClick={handleAdjust}>{tm("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addrDialog} onOpenChange={(open) => !open && setAddrDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {addrDialog?.mode === "edit" ? tm("editAddress") : tm("addAddress")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tm("fFullName")}>
              <Input value={formAddr.name} onChange={(e) => setFormAddr((p) => ({ ...p, name: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fPhone")}>
              <Input value={formAddr.phone} onChange={(e) => setFormAddr((p) => ({ ...p, phone: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fLine1")}>
              <Input value={formAddr.line1} onChange={(e) => setFormAddr((p) => ({ ...p, line1: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fLine2")}>
              <Input value={formAddr.line2} onChange={(e) => setFormAddr((p) => ({ ...p, line2: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fCity")}>
              <Input value={formAddr.city} onChange={(e) => setFormAddr((p) => ({ ...p, city: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fState")}>
              <Input value={formAddr.state} onChange={(e) => setFormAddr((p) => ({ ...p, state: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fPostal")}>
              <Input value={formAddr.postal} onChange={(e) => setFormAddr((p) => ({ ...p, postal: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fCountry")}>
              <Input value={formAddr.country} onChange={(e) => setFormAddr((p) => ({ ...p, country: e.target.value }))} className="bg-card" />
            </Field>
            <Field label={tm("fType")}>
              <Select value={formAddr.kind} onValueChange={(v) => setFormAddr((p) => ({ ...p, kind: (v as CustomerAddress["kind"]) ?? "home", label: v ?? "Home" }))}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">{tm("tyHome")}</SelectItem>
                  <SelectItem value="office">{tm("tyOffice")}</SelectItem>
                  <SelectItem value="other">{tm("tyOther")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm font-medium">
              <Checkbox checked={formAddr.isDefault} onCheckedChange={(v) => setFormAddr((p) => ({ ...p, isDefault: v === true }))} aria-label={tm("fDefault")} />
              {tm("fDefault")}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddrDialog(null)}>{tm("cancelBtn")}</Button>
            <Button size="sm" onClick={saveAddress}>{tm("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteAddr} onOpenChange={(open) => !open && setConfirmDeleteAddr(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{tm("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tm("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteAddr(null)}>{tm("cancelBtn")}</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                mgmt.saveAddresses(base.email, addresses.filter((a) => a.id !== confirmDeleteAddr));
                setConfirmDeleteAddr(null);
                toast.success(tm("toastDeleted", { count: 1 }));
              }}
            >
              {tm("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteReview} onOpenChange={(open) => !open && setConfirmDeleteReview(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{tm("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tm("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteReview(null)}>{tm("cancelBtn")}</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteReview) mgmt.deleteReview(confirmDeleteReview);
                setConfirmDeleteReview(null);
                toast.success(tm("toastDeleted", { count: 1 }));
              }}
            >
              {tm("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, tile }: { label: string; value: string; icon: typeof Users; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-lg font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}
