"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ColorAddPanel } from "@/components/admin/products/ColorsTable";
import { ColorsTable, type ColorRow } from "@/components/admin/products/ColorsTable";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { toast } from "sonner";

export default function DashboardColorsPage() {
  const t = useTranslations("Dashboard.admin");
  const customColors = useAdminProductsStore((s) => s.customColors);
  const addCustomColor = useAdminProductsStore((s) => s.addCustomColor);
  const removeCustomColor = useAdminProductsStore((s) => s.removeCustomColor);
  const metaMap = useAdminProductsStore((s) => s.colorMeta);

  const colors = useMemo<ColorRow[]>(() => {
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
    for (const color of customColors) {
      if (!map.has(color)) map.set(color, { products: new Set<string>(), thumbs: [], stock: 0 });
    }
    return [...map.entries()]
      .map(([hex, info]) => {
        const meta = metaMap[hex];
        return {
          hex,
          productNames: [...info.products],
          thumbs: info.thumbs,
          stock: info.stock,
          author: meta?.author ?? "__system__",
          createdAt: meta?.createdAt ?? "",
          updatedAt: meta?.updatedAt ?? "",
        };
      })
      .sort((a, b) => b.productNames.length - a.productNames.length);
  }, [customColors, metaMap]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("colors.title")}
        description={t("colors.subtitle", { count: colors.length })}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
        <ColorAddPanel
          existing={colors.map((c) => c.hex)}
          onAdd={(hex) => {
            addCustomColor(hex.toLowerCase());
            toast.success(t("colors.colorAdded"));
          }}
        />
        <ColorsTable
          rows={colors}
          onBulkDelete={(hexes) => {
            const custom = hexes.filter((h) => customColors.includes(h));
            for (const h of custom) removeCustomColor(h);
            toast.success(t("colors.toastBulkDeleted", { count: custom.length }));
          }}
        />
      </div>
    </div>
  );
}
