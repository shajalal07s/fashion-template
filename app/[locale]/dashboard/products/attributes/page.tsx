"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { products } from "@/features/shop/products";

export default function DashboardAttributesPage() {
  const t = useTranslations("Dashboard.admin");

  const sizes = useMemo(() => {
    const map = new Map<string, { products: number; stock: number }>();
    for (const p of products) {
      for (const size of p.sizes ?? []) {
        const entry = map.get(size) ?? { products: 0, stock: 0 };
        entry.products += 1;
        entry.stock += p.stock;
        map.set(size, entry);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].products - a[1].products);
  }, []);

  const brands = useMemo(() => {
    const map = new Map<string, { products: number; stock: number }>();
    for (const p of products) {
      const brand = p.brand ?? "—";
      const entry = map.get(brand) ?? { products: 0, stock: 0 };
      entry.products += 1;
      entry.stock += p.stock;
      map.set(brand, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].products - a[1].products);
  }, []);

  const renderTable = (rows: Array<[string, { products: number; stock: number }]>) => (
    <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead>{t("attributes.colAttribute")}</TableHead>
          <TableHead className="text-center">{t("attributes.colProducts")}</TableHead>
          <TableHead className="text-right">{t("attributes.colStock")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([name, info]) => (
          <TableRow key={name}>
            <TableCell>
              <Badge variant="outline" className="font-mono font-bold">
                {name}
              </Badge>
            </TableCell>
            <TableCell className="text-center font-semibold">{info.products}</TableCell>
            <TableCell className="text-right font-bold text-secondary">{info.stock}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("attributes.title")} description={t("attributes.subtitle")} />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg font-bold">{t("attributes.sizesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">{renderTable(sizes)}</CardContent>
        </Card>
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg font-bold">{t("attributes.brandsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">{renderTable(brands)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
