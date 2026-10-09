"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, RefreshCw, RotateCcw, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { useVendorOrders, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorOrderReturnsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const store = useVendorStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = orders.filter((o) => ["returned", "refunded", "cancelled"].includes(o.status));
    if (status !== "all") rows = rows.filter((o) => o.status === status);
    if (q) {
      rows = rows.filter((o) =>
        `${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => +new Date(b.updated) - +new Date(a.updated));
  }, [orders, query, status]);

  const counts = useMemo(() => ({
    returned: orders.filter((o) => o.status === "returned").length,
    refunded: orders.filter((o) => o.status === "refunded" || o.payStatus === "refunded").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refundTotal: orders.filter((o) => o.payStatus === "refunded").reduce((n, o) => n + (o.refunded || o.total), 0),
  }), [orders]);

  const exportRows = () => {
    const lines = [
      ["order", "customer", "status", "payStatus", "total", "refunded"].join(","),
      ...list.map((o) => [o.id, o.customer, o.status, o.payStatus, o.total, o.refunded].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-returns.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exported"));
  };

  const processRefund = (id: string, full: boolean) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    store.patchOrder(id, {
      status: "refunded",
      payStatus: "refunded",
      refunded: full ? o.total : Math.round(o.total / 2),
    });
    store.logOrderEvent(id, "Refunded", full ? t("refundFull") : t("refundPartial"));
    toast.success(t("toastOrder"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_orders")}
        title={t("refunds")}
        subtitle={`${num(list.length)} · ${t("refundAmount")}: ${money(counts.refundTotal)}`}
        highlightLabel={t("sReturned")}
        highlightValue={num(counts.returned)}
        highlightIcon={RotateCcw}
      >
        <Link href="/vendor/orders" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("oTitle")}
        </Link>
        <button type="button" onClick={exportRows} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <div className="flex gap-2" role="tablist" aria-label={t("oTitle")}>
        <Link
          href="/vendor/orders"
          className="border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
        >
          {t("oTitle")}
        </Link>
        <Link
          href="/vendor/orders/returns"
          aria-current="page"
          className="border border-secondary bg-secondary px-4 py-2 text-sm font-bold text-white"
        >
          {t("refunds")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t("sReturned"), value: counts.returned },
          { label: t("sRefunded"), value: counts.refunded },
          { label: t("sCancelled"), value: counts.cancelled },
          { label: t("refundAmount"), value: money(counts.refundTotal) },
        ].map((c, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-3">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</p>
              <p className="font-heading text-xl font-bold">{typeof c.value === "number" ? num(c.value) : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="bg-card pl-9"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="h-9 w-44 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sAll")}</SelectItem>
            <SelectItem value="returned">{t("returned")}</SelectItem>
            <SelectItem value="refunded">{t("refunded")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {list.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="text-right">{t("tTotal")}</TableHead>
                  <TableHead className="text-right">{t("refundAmount")}</TableHead>
                  <TableHead className="w-48">{t("refundTitle")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">
                        #{o.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <CustomerAvatar name={o.customer} size="sm" />
                        <span className="max-w-28 truncate text-sm font-semibold">{o.customer}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
                        o.status === "refunded" ? "bg-green-600/10 text-green-700"
                        : o.status === "cancelled" ? "bg-destructive/10 text-destructive"
                        : "bg-primary/20 text-[#8a5a00]")}>
                        {t(o.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">{money(o.total)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(o.refunded)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {o.payStatus !== "refunded" ? (
                          <>
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => processRefund(o.id, false)}>
                              {t("refundPartial")}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => processRefund(o.id, true)}>
                              {t("refundFull")}
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-green-700">{t("refunded")}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={RotateCcw} title={t("emptyTitle")} description={t("emptyOrders")} />
            </div>
          )}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {list.length > 0 ? list.map((o) => (
            <div key={o.id} className="flex flex-col gap-2 border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold">#{o.id}</Link>
                <span className="ml-auto px-2 py-0.5 text-[11px] font-bold bg-muted">{t(o.status)}</span>
              </div>
              <p className="truncate text-sm font-semibold">{o.customer}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">{money(o.total)}</span>
                <span className="text-muted-foreground">{t("refundAmount")}: {money(o.refunded)}</span>
              </div>
              {o.payStatus !== "refunded" ? (
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-8 flex-1" onClick={() => processRefund(o.id, false)}>{t("refundPartial")}</Button>
                  <Button size="sm" variant="outline" className="h-8 flex-1 bg-card" onClick={() => processRefund(o.id, true)}>{t("refundFull")}</Button>
                </div>
              ) : null}
            </div>
          )) : (
            <EmptyState icon={RotateCcw} title={t("emptyTitle")} description={t("emptyOrders")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
