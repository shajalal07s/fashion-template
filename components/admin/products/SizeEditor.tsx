"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Package, Save, Star, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { toast } from "sonner";

/**
 * Reusable size editor: rename a size, inspect its products,
 * colors, stock and top sellers. Used by the size edit page and
 * available anywhere an admin needs to manage a single size.
 */
export function SizeEditor({ displayName }: { displayName: string }) {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const router = useRouter();

  const customSizes = useAdminProductsStore((s) => s.customSizes);
  const renames = useAdminProductsStore((s) => s.sizeRenames);
  const renameSize = useAdminProductsStore((s) => s.renameSize);
  const removeCustomSize = useAdminProductsStore((s) => s.removeCustomSize);
  const metaMap = useAdminProductsStore((s) => s.sizeMeta);
  const orders = useAdminOrders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const original = useMemo(() => {
    for (const [orig, renamed] of Object.entries(renames)) {
      if (renamed === displayName) return orig;
    }
    return displayName;
  }, [displayName, renames]);

  const isCustom = customSizes.includes(displayName) || customSizes.includes(original);

  const list = useMemo(
    () => products.filter((p) => (p.sizes ?? []).includes(original)),
    [original]
  );
  const totalStock = useMemo(() => list.reduce((n, p) => n + p.stock, 0), [list]);

  const colors = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of list) {
      for (const c of p.colors ?? []) map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);

  const topSellers = useMemo(() => {
    const ids = new Set(list.map((p) => p.id));
    const map = new Map<string, { id: string; name: string; image: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        if (!ids.has(item.productId)) continue;
        const entry = map.get(item.productId) ?? {
          id: item.productId,
          name: item.name,
          image: item.image,
          qty: 0,
          revenue: 0,
        };
        entry.qty += item.quantity;
        entry.revenue += item.price * item.quantity;
        map.set(item.productId, entry);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, list]);

  const [prodPage, setProdPage] = useState(0);
  const PROD_PAGE_SIZE = 5;
  const prodPageCount = Math.max(1, Math.ceil(list.length / PROD_PAGE_SIZE));
  const safeProdPage = Math.min(prodPage, prodPageCount - 1);
  const visibleProducts = useMemo(
    () => list.slice(safeProdPage * PROD_PAGE_SIZE, (safeProdPage + 1) * PROD_PAGE_SIZE),
    [list, safeProdPage]
  );

  const [name, setName] = useState(displayName);

  const meta = metaMap[displayName];
  const metaAuthor = meta?.author ?? t("attributes.systemAuthor");
  const metaDate = (iso: string) =>
    iso
      ? format.dateTime(new Date(iso), {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  if (list.length === 0 && !isCustom) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8">
          <EmptyState icon={Eye} title={t("attributes.seNotFound")} />
        </CardContent>
      </Card>
    );
  }

  const save = () => {
    const next = name.trim();
    if (!next) return;
    if (next !== displayName) {
      renameSize(original, next);
      toast.success(t("attributes.toastRenamed"));
      router.push(`/dashboard/products/attributes-size/${encodeURIComponent(next)}/edit`);
    } else {
      toast.success(t("attributes.seSaved"));
    }
  };

  const remove = () => {
    removeCustomSize(displayName);
    removeCustomSize(original);
    toast.success(t("attributes.seDeleted"));
    router.push("/dashboard/products/attributes-size");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("attributes.seProducts")}
          value={String(list.length)}
          delta={0}
          icon={Package}
        />
        <StatCard
          label={t("attributes.seStock")}
          value={String(totalStock)}
          delta={0}
          icon={Package}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("attributes.seTop")}
          value={String(topSellers.length)}
          delta={0}
          icon={Star}
          iconClassName="bg-green-600/10 text-green-700"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={t("attributes.seTitle")}>
          <Field label={t("attributes.seName")}>
            <div className="flex items-center gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card font-mono font-bold" />
              <Button size="sm" className="h-8 shrink-0 gap-1.5" onClick={save}>
                <Save className="size-3.5" aria-hidden="true" />
                {t("attributes.seSave")}
              </Button>
            </div>
          </Field>
          <div className="grid gap-3 border-t border-border pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">Slug</span>
              <span className="font-mono font-semibold">{meta?.slug ?? displayName.toLowerCase()}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.colAuthor")}
              </span>
              <span className="font-semibold">{metaAuthor}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.metaCreated")}
              </span>
              <span className="font-medium">{metaDate(meta?.createdAt ?? "")}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.metaUpdated")}
              </span>
              <span className="font-medium">{metaDate(meta?.updatedAt ?? "")}</span>
            </div>
          </div>
          <Field label={t("attributes.seColors")}>
            <div className="flex flex-wrap gap-2">
              {colors.length > 0 ? (
                colors.map(([hex, count]) => (
                  <span
                    key={hex}
                    title={`${count}`}
                    className="inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <span
                      className="size-4 border border-black/10"
                      style={{ backgroundColor: hex }}
                      aria-hidden="true"
                    />
                    <span className="font-bold text-secondary">× {count}</span>
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("products.emptyDescription")}</p>
              )}
            </div>
          </Field>
          {isCustom ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("attributes.seDelete")}
            </Button>
          ) : null}
        </SectionCard>

        <SectionCard title={t("attributes.seTop")}>
          <div className="flex flex-col gap-2">
            {topSellers.length > 0 ? (
              topSellers.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/dashboard/products/${s.id}/edit`}
                  className="flex items-center gap-3 border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <span className="font-heading flex size-7 shrink-0 items-center justify-center bg-secondary/15 text-sm font-bold text-secondary">
                    {i + 1}
                  </span>
                  <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                    {s.image ? (
                      <Image src={s.image} alt={s.name} fill sizes="40px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("pinvoices.colQty")}: {s.qty}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-secondary">{money(s.revenue)}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("attributes.noSales")}</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={`${t("attributes.dlgView")} · ${displayName}`}
        action={
          <Badge variant="outline" className="font-bold">
            {list.length}
          </Badge>
        }
      >
        <div className="flex flex-col divide-y divide-border border border-border">
          {visibleProducts.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}/edit`}
              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
            >
              <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                {p.images[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.category}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-secondary">{p.stock}</span>
            </Link>
          ))}
        </div>
        {prodPageCount > 1 ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("orders.pageOf", { page: safeProdPage + 1, pages: prodPageCount })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-card"
                disabled={safeProdPage === 0}
                onClick={() => setProdPage((p) => Math.max(0, p - 1))}
              >
                {t("orders.prevPage")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-card"
                disabled={safeProdPage >= prodPageCount - 1}
                onClick={() => setProdPage((p) => Math.min(prodPageCount - 1, p + 1))}
              >
                {t("orders.nextPage")}
              </Button>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

export function SizeEditorHeader({ displayName }: { displayName: string }) {
  const t = useTranslations("Dashboard.admin");
  return (
    <AdminPageHeader
      title={`${t("attributes.seTitle")} · ${displayName}`}
      actions={
        <Link href="/dashboard/products/attributes-size">
          <Button variant="outline" size="sm" className="gap-1.5 bg-card">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("products.epBack")}
          </Button>
        </Link>
      }
    />
  );
}
