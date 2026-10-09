"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { demoVendorCustomers } from "@/features/vendor/vendor";

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Users className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function VendorCustomersPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demoVendorCustomers;
    return demoVendorCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [query]);

  const newCust = demoVendorCustomers.filter((c) => c.orders <= 1).length;
  const retCust = demoVendorCustomers.length - newCust;
  const aov = Math.round(demoVendorCustomers.reduce((n, c) => n + c.spent, 0) / Math.max(1, demoVendorCustomers.reduce((n, c) => n + c.orders, 0)));

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_customers")}
        title={t("custOverview")}
        subtitle={t("cSubtitle", { count: filtered.length })}
        highlightLabel={t("totalCust")}
        highlightValue={num(demoVendorCustomers.length)}
        highlightIcon={Users}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Mini label={t("totalCust")} value={num(demoVendorCustomers.length)} tile="bg-secondary/15 text-secondary" />
        <Mini label={t("newCust")} value={num(newCust)} tile="bg-green-600/10 text-green-700" />
        <Mini label={t("retCust")} value={num(retCust)} tile="bg-secondary/15 text-secondary" />
        <Mini label={t("aov")} value={money(aov)} tile="bg-primary/15 text-secondary" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("custChart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart
            data={[
              { x: "Apr", y: 2 }, { x: "May", y: 3 }, { x: "Jun", y: 2 },
              { x: "Jul", y: 4 }, { x: "Aug", y: 5 }, { x: "Sep", y: 6 },
            ]}
          />
        </CardContent>
      </Card>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("tCustomer2")}</TableHead>
                <TableHead className="text-right">{t("tOrders")}</TableHead>
                <TableHead className="text-right">{t("tSpent")}</TableHead>
                <TableHead>{t("tLastOrder")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CustomerAvatar name={c.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold whitespace-nowrap">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {num(c.orders)}
                    {c.returning ? <span className="ml-1 bg-secondary/15 px-1 py-0.5 text-[10px] font-bold text-secondary">↺</span> : null}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(c.spent)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{c.lastOrder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
