"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, RefreshCw, ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { downloadCsv, earningsSummary } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorOrderEarningsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();
  const [q, setQ] = useState("");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const summary = useMemo(() => earningsSummary(orders, payouts), [orders, payouts]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = orders.filter((o) => !o.archived && o.status !== "cancelled");
    if (needle) list = list.filter((o) => `${o.id} ${o.customer}`.toLowerCase().includes(needle));
    return [...list].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [orders, q]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eOrdersEarn")}
        subtitle={`${num(rows.length)} · ${money(summary.net)}`}
        highlightLabel={t("vendorEarning")}
        highlightValue={money(summary.net)}
        highlightIcon={ShoppingCart}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("order-earnings.csv", ["order", "customer", "total", "commission", "refund", "earning", "status", "date"],
              rows.map((o) => [o.id, o.customer, o.total, o.commission, o.refunded, o.earning, o.status, o.date]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <EarnTabs />

      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card sm:max-w-md" aria-label={t("searchPlaceholder")} />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("eOrdersEarn")} · {num(rows.length)}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tProducts")}</TableHead>
                  <TableHead className="text-right">{t("tTotal")}</TableHead>
                  <TableHead className="text-right">{t("commission")}</TableHead>
                  <TableHead className="text-right">{t("refunds")}</TableHead>
                  <TableHead className="text-right">{t("vendorEarning")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell><Link href={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">#{o.id}</Link></TableCell>
                    <TableCell className="max-w-28 truncate text-sm">{o.customer}</TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground">{o.items.map((i) => i.name).join(", ")}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(o.total)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-destructive">−{money(o.commission)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(o.refunded)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">+{money(o.earning)}</TableCell>
                    <TableCell><span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#8a5a00]">{t(o.status)}</span></TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(o.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <div className="py-8"><EmptyState icon={ShoppingCart} title={t("emptyTitle")} description={t("emptyOrders")} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
