"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Eye, Heart, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHtmlDescription, RichDescription } from "@/components/shop/rich-description";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { productPath } from "@/features/shop/categories";
import { useCallback, useState } from "react";
import type { Product } from "@/types/product";

interface ProductQuickViewProps {
  product: Product;
}

export function ProductQuickView({ product }: ProductQuickViewProps) {
  const t = useTranslations("Shop");
  const format = useFormatter();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    addItem(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }, [addItem, product]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="relative h-[320px] overflow-hidden bg-muted sm:h-full">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="from-primary/15 to-secondary/15 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <span className="text-primary/60 font-heading text-6xl font-bold select-none">
              {product.name[0]}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {product.category}
        </span>
        <h2 className="font-heading text-lg leading-tight font-semibold">{product.name}</h2>

        <div className="flex items-baseline gap-2">
          <span className="text-secondary text-xl font-bold">
            {format.number(product.price, { style: "currency", currency: "BDT" })}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-muted-foreground text-sm line-through">
              {format.number(product.compareAtPrice, { style: "currency", currency: "BDT" })}
            </span>
          )}
        </div>

        {isHtmlDescription(product.description) ? (
          <RichDescription html={product.description} className="text-muted-foreground text-sm" />
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
        )}

        <span
          className={cn(
            "text-xs font-semibold tracking-wider uppercase",
            product.stock > 0 ? "text-emerald-600" : "text-destructive"
          )}
        >
          {product.stock > 0 ? t("inStock") : t("outOfStock")}
        </span>

        <div className="mt-auto flex flex-col gap-2">
          <Button className="gap-2" onClick={handleAddToCart}>
            {justAdded ? (
              <>
                <Plus className="size-4" aria-hidden="true" />
                {t("addedToCart")}
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden="true" />
                {t("addToCart")}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            render={<Link href={productPath(product.category, product.slug)} />}
            nativeButton={false}
            className="gap-2"
          >
            <Eye className="size-4" aria-hidden="true" />
            {t("viewDetails")}
          </Button>
          <Button
            variant="ghost"
            className={cn("gap-2", isInWishlist && "text-destructive")}
            onClick={() => toggleWishlist(product)}
          >
            <Heart
              className="size-4"
              aria-hidden="true"
              fill={isInWishlist ? "currentColor" : "none"}
            />
            {isInWishlist ? t("removeWishlist") : t("addWishlist")}
          </Button>
        </div>
      </div>
    </div>
  );
}
