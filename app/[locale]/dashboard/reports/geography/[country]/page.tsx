"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, GeoBreadcrumb } from "@/components/admin/reports/shared";
import { aovOf, divisionStats, getDivisions } from "@/features/admin/reports";

export default function CountryReportPage() {
  const t = useTranslations("Dashboard.reports");
  const params = useParams<{ country: string }>();
  const country = params.country;
  const format = useFormatter();
  const [query, setQuery] = useState("");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const isBangladesh = country === "bangladesh";
  const divisions = useMemo(() => (isBangladesh ? getDivisions() : []), [isBangladesh]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = divisions.map((d) => divisionStats(d));
    if (!q) return list;
    return list.filter((r) => r.name.toLowerCase().includes(q));
  }, [divisions, query]);

  const totals = useMemo(
    () => rows.reduce((n, r) => ({ orders: n.orders + r.orders, sales: n.sales + r.sales, revenue: n.revenue + r.revenue }), { orders: 0, sales: 0, revenue: 0 }),
    [rows]
  );

  if (!isBangladesh) {
    return (
      <div className="flex flex-col gap-6">
        <GeoBreadcrumb
          trail={[
            { label: t("title"), href: "/dashboard/reports" },
            { label: t("gTitle"), href: "/dashboard/reports/geography" },
          ]}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Globe} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GeoBreadcrumb
        trail={[
          { label: t("title"), href: "/dashboard/reports" },
          { label: t("gTitle"), href: "/dashboard/reports/geography" },
          { label: "Bangladesh" },
        ]}
      />
      <AccountingHero
        eyebrow={t("gTitle")}
        title="Bangladesh"
        subtitle={`${t("tDivision")}: ${num(divisions.length)}`}
        highlightLabel={t("tOrders")}
        highlightValue={num(totals.orders)}
        highlightIcon={Globe}
      >
        <ExportReportButton
          reportType="country-bangladesh"
          headers={["division", "orders", "sales", "revenue", "customers", "vendors", "refunds", "tax"]}
          rows={rows.map((r) => [r.name, r.orders, r.sales, r.revenue, r.customers, r.vendors, r.refunds, r.tax])}
        />
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchDivision")} className="bg-card" aria-label={t("searchDivision")} />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("tDivision")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tDivision")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tSales")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead className="text-right">{t("tCustomers")}</TableHead>
                  <TableHead className="text-right">{t("tVendors")}</TableHead>
                  <TableHead className="text-right">{t("tAov")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.slug}>
                    <TableCell>
                      <Link href={`/dashboard/reports/geography/bangladesh/${r.slug}`} className="text-sm font-bold text-secondary hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(r.orders)}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.sales)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">{num(r.customers)}</TableCell>
                    <TableCell className="text-right text-sm">{num(r.vendors)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{money(aovOf(r))}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/reports/geography/bangladesh/${r.slug}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          {t("viewDistrict")}
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Globe} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
