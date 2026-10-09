"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Heart, ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { cn } from "@/lib/utils";
import { plainDescription } from "@/components/shop/rich-description";
import { useCallback, useState } from "react";
import type { Product } from "@/types/product";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-secondary text-2xl font-bold">
          {format.number(product.price, { style: "currency", currency: "BDT" })}
        </span>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="text-muted-foreground text-lg line-through">
            {format.number(product.compareAtPrice, { style: "currency", currency: "BDT" })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">{t("description")}</span>
        <p>{plainDescription(product.description)}</p>
      </div>

      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {product.stock > 0 ? t("inStock") : t("outOfStock")}
      </span>

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={handleAddToCart}>
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
          size="icon"
          onClick={() => toggleWishlist(product)}
          aria-label={isInWishlist ? t("removeWishlist") : t("addWishlist")}
          className={cn(isInWishlist && "text-destructive")}
        >
          <Heart
            className="size-4"
            aria-hidden="true"
            fill={isInWishlist ? "currentColor" : "none"}
          />
        </Button>
      </div>
    </div>
  );
}
