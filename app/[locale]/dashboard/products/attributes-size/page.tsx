"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AttributesTable, SizeAddPanel } from "@/components/admin/products/AttributesTable";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { toast } from "sonner";

export default function DashboardAttributesPage() {
  const t = useTranslations("Dashboard.admin");
  const customSizes = useAdminProductsStore((s) => s.customSizes);
  const addCustomSize = useAdminProductsStore((s) => s.addCustomSize);
  const removeCustomSize = useAdminProductsStore((s) => s.removeCustomSize);
  const upsertSizeMeta = useAdminProductsStore((s) => s.upsertSizeMeta);
  const renames = useAdminProductsStore((s) => s.sizeRenames);
  const metaMap = useAdminProductsStore((s) => s.sizeMeta);

  const sizes = useMemo(() => {
    const map = new Map<
      string,
      { products: number; stock: number; slug: string; author: string; createdAt: string; updatedAt: string }
    >();
    const apply = (size: string) => renames[size] ?? size;
    const metaOf = (name: string) =>
      metaMap[name] ?? {
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        author: "__system__",
        createdAt: "",
        updatedAt: "",
      };
    for (const p of products) {
      for (const size of p.sizes ?? []) {
        const key = apply(size);
        const entry = map.get(key) ?? { products: 0, stock: 0, ...metaOf(key) };
        entry.products += 1;
        entry.stock += p.stock;
        map.set(key, entry);
      }
    }
    for (const size of customSizes) {
      const key = apply(size);
      if (!map.has(key)) {
        const m = metaOf(key);
        map.set(key, { products: 0, stock: 0, slug: m.slug, author: m.author, createdAt: m.createdAt, updatedAt: m.updatedAt });
      }
    }
    return [...map.entries()].sort((a, b) => b[1].products - a[1].products);
  }, [customSizes, renames, metaMap]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("attributes.title")} description={t("attributes.sizesTitle")} />
      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
        <SizeAddPanel
          existing={sizes.map(([size]) => size)}
          onAdd={(items) => {
            for (const item of items) {
              addCustomSize(item.name);
              upsertSizeMeta(item.name, { slug: item.slug });
            }
            toast.success(
              items.length > 1
                ? t("attributes.attrAddedMany", { count: items.length })
                : t("attributes.attrAdded")
            );
          }}
        />
        <AttributesTable
          rows={sizes}
          onBulkDelete={(names) => {
            const custom = names.filter((n) => customSizes.includes(n));
            for (const n of custom) removeCustomSize(n);
            toast.success(t("attributes.toastBulkDeleted", { count: custom.length }));
          }}
        />
      </div>
    </div>
  );
}
