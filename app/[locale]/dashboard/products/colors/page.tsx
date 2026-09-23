"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { products } from "@/features/shop/products";

export default function DashboardColorsPage() {
  const t = useTranslations("Dashboard.admin");

  const colors = useMemo(() => {
    const map = new Map<string, { products: Set<string>; thumbs: string[]; stock: number }>();
    for (const p of products) {
      for (const color of p.colors ?? []) {
        const entry = map.get(color) ?? { products: new Set<string>(), thumbs: [], stock: 0 };
        entry.products.add(p.name);
        if (entry.thumbs.length < 3 && p.images[0]) entry.thumbs.push(p.images[0]);
        entry.stock += p.stock;
        map.set(color, entry);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].products.size - a[1].products.size);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("colors.title")}
        description={t("colors.subtitle", { count: colors.length })}
      />
      <Card className="border-border bg-card">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>{t("colors.colColor")}</TableHead>
                <TableHead>{t("colors.colProducts")}</TableHead>
                <TableHead className="text-right">{t("colors.colStock")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map(([hex, info]) => (
                <TableRow key={hex}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="block size-9 shrink-0 border border-black/10 shadow-sm"
                        style={{ backgroundColor: hex }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs font-bold uppercase">{hex}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex -space-x-2">
                        {info.thumbs.map((src, i) => (
                          <span
                            key={`${hex}-${i}`}
                            className="relative block size-8 shrink-0 overflow-hidden border border-white bg-muted shadow-sm"
                          >
                            <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                          </span>
                        ))}
                      </span>
                      <span className="text-sm font-semibold">
                        {info.products.size}{" "}
                        <span className="max-w-56 truncate font-normal text-muted-foreground">
                          · {[...info.products].slice(0, 2).join(", ")}
                          {info.products.size > 2 ? "…" : ""}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-secondary">{info.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
