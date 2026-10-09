"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Download, Package, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { downloadCsv, productEarnings } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorProducts } from "@/store/vendor.store";
import { EarnTabs } from "@/components/vendor/earnings-shared";
import { toast } from "sonner";

export default function VendorProductEarningsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const products = useVendorProducts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo(() => productEarnings(orders, products), [orders, products]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eProductsEarn")}
        subtitle={`${num(rows.length)} · ${t("eSubtitle")}`}
        highlightLabel={t("eProductsEarn")}
        highlightValue={num(rows.reduce((n, r) => n + r.units, 0))}
        highlightIcon={Package}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("product-earnings.csv", ["sku", "name", "units", "gross", "commission", "net"],
              rows.map((r) => [r.sku, r.name, r.units, r.gross, r.commission, r.net]));
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

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("eProductsEarn")} · {num(rows.length)}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("eProduct")}</TableHead>
                  <TableHead className="text-right">{t("eUnits")}</TableHead>
                  <TableHead className="text-right">{t("eGrossAmt")}</TableHead>
                  <TableHead className="text-right">{t("commission")}</TableHead>
                  <TableHead className="text-right">{t("eNetAmt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.sku}>
                    <TableCell>
                      {r.productId ? (
                        <Link href={`/vendor/products/${r.productId}`} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.image} alt={r.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                          <span className="min-w-0">
                            <span className="block max-w-44 truncate text-sm font-bold hover:text-secondary hover:underline">{r.name}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">{r.sku}</span>
                          </span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.image} alt={r.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                          <span className="min-w-0">
                            <span className="block max-w-44 truncate text-sm font-bold">{r.name}</span>
                            <span className="block font-mono text-[11px] text-muted-foreground">{r.sku}</span>
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">{num(r.units)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(r.gross)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-destructive">−{money(r.commission)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(r.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <div className="py-8"><EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyProducts")} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
