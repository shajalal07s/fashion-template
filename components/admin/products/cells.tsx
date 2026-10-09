"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCell({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative block size-11 shrink-0 overflow-hidden bg-muted">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.name} fill sizes="44px" className="object-cover" />
        ) : (
          <span className="font-heading flex h-full w-full items-center justify-center text-lg font-bold text-primary">
            {(product.name[0] ?? "?").toUpperCase()}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/dashboard/products/${product.id}/edit`}
          className="max-w-48 truncate text-sm font-semibold text-foreground hover:text-secondary hover:underline"
        >
          {product.name}
        </Link>
        <span className="font-mono text-[11px] text-muted-foreground">{product.sku ?? "—"}</span>
      </span>
    </div>
  );
}

export function PriceCell({ price, compareAtPrice }: { price: number; compareAtPrice?: number | null }) {
  const format = useFormatter();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  return (
    <>
      <p className="text-sm font-bold whitespace-nowrap text-secondary">{money(price)}</p>
      {compareAtPrice && compareAtPrice > price ? (
        <p className="text-xs whitespace-nowrap text-muted-foreground line-through">
          {money(compareAtPrice)}
        </p>
      ) : null}
    </>
  );
}

export function StockCell({ stock }: { stock: number }) {
  const t = useTranslations("Dashboard.admin");
  if (stock <= 0)
    return (
      <Badge className="bg-destructive/10 font-semibold whitespace-nowrap text-destructive">
        {t("products.outOfStock")}
      </Badge>
    );
  if (stock < 15)
    return (
      <Badge className="bg-secondary/15 font-semibold whitespace-nowrap text-secondary">
        {t("products.lowStock")} · {stock}
      </Badge>
    );
  return (
    <Badge className="bg-green-600/10 font-semibold whitespace-nowrap text-green-700">
      {t("products.inStock")} · {stock}
    </Badge>
  );
}

export function CategoryCell({ category }: { category?: string }) {
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      {category ?? "—"}
    </Badge>
  );
}

export function RatingCell({ rating }: { rating?: number }) {
  return (
    <span className="flex items-center justify-center gap-1 text-sm font-medium">
      <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
      {rating?.toFixed(1) ?? "—"}
    </span>
  );
}

export function ProductStatusCell({ active }: { active: boolean }) {
  const t = useTranslations("Dashboard.admin");
  return (
    <Badge
      className={cn(
        "font-semibold whitespace-nowrap",
        active ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground"
      )}
    >
      {active ? t("products.active") : t("products.inactive")}
    </Badge>
  );
}
