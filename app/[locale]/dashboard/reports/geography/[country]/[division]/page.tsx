"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowRight, Globe, MapPin } from "lucide-react";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, GeoBreadcrumb } from "@/components/admin/reports/shared";
import { aovOf, districtStats, getDivision } from "@/features/admin/reports";

export default function DivisionReportPage() {
  const t = useTranslations("Dashboard.reports");
  const params = useParams<{ country: string; division: string }>();
  const format = useFormatter();
  const [query, setQuery] = useState("");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const div = getDivision(params.division);
  const rows = useMemo(() => {
    if (!div) return [];
    const q = query.trim().toLowerCase();
    const list = div.districts.map((d) => districtStats(d, div.name));
    if (!q) return list;
    return list.filter((r) => r.name.toLowerCase().includes(q));
  }, [div, query]);

  if (!div) {
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
          { label: "Bangladesh", href: "/dashboard/reports/geography/bangladesh" },
          { label: div.name },
        ]}
      />
      <AccountingHero
        eyebrow="Bangladesh"
        title={div.name}
        subtitle={`${t("tDistrict")}: ${num(div.districts.length)}`}
        highlightLabel={t("tOrders")}
        highlightValue={num(rows.reduce((n, r) => n + r.orders, 0))}
        highlightIcon={MapPin}
      >
        <ExportReportButton
          reportType={`division-${div.slug}`}
          headers={["district", "orders", "sales", "revenue", "customers", "vendors", "refunds", "tax"]}
          rows={rows.map((r) => [r.name, r.orders, r.sales, r.revenue, r.customers, r.vendors, r.refunds, r.tax])}
        />
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchDistrict")} className="bg-card" aria-label={t("searchDistrict")} />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("tDistrict")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.length > 0 ? (
            rows.map((r) => (
              <Link
                key={r.slug}
                href={`/dashboard/reports/geography/bangladesh/${div.slug}/${r.slug}`}
                className="flex flex-col gap-1 border border-border bg-card p-4 transition-colors hover:border-secondary"
                aria-label={`${t("viewDistrict")}: ${r.name}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-heading text-base font-bold">{r.name}</span>
                  <ArrowRight className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("tOrders")}: {num(r.orders)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("tSales")}: {money(r.sales)}
                </span>
                <span className="text-sm font-bold text-secondary">{t("tRevenue")}: {money(r.revenue)}</span>
                <span className="text-xs text-muted-foreground">
                  {t("tCustomers")}: {num(r.customers)}
                </span>
                <span className="mt-1 w-fit bg-secondary px-2 py-0.5 text-[11px] font-bold text-white">
                  {t("viewDistrict")}
                </span>
              </Link>
            ))
          ) : (
            <div className="py-4 sm:col-span-2 xl:col-span-3">
              <EmptyState icon={MapPin} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tDistrict")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tSales")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead className="text-right">{t("tCustomers")}</TableHead>
                  <TableHead className="text-right">{t("tVendors")}</TableHead>
                  <TableHead className="text-right">{t("tProducts2")}</TableHead>
                  <TableHead className="text-right">{t("tRefunds")}</TableHead>
                  <TableHead className="text-right">{t("tTax2")}</TableHead>
                  <TableHead className="text-right">{t("tAov")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.slug}>
                    <TableCell>
                      <Link href={`/dashboard/reports/geography/bangladesh/${div.slug}/${r.slug}`} className="text-sm font-bold text-secondary hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(r.orders)}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.sales)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">{num(r.customers)}</TableCell>
                    <TableCell className="text-right text-sm">{num(r.vendors)}</TableCell>
                    <TableCell className="text-right text-sm">{num(r.products)}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap text-destructive">{money(r.refunds)}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.tax)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{money(aovOf(r))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
