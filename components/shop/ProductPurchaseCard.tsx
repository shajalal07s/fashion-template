"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, Zap, Minus, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { productPath } from "@/features/shop/categories";
import { siteConfig } from "@/config/site";
import { useCallback, useState } from "react";
import type { Product } from "@/types/product";

interface ProductPurchaseCardProps {
  product: Product;
}

const WHATSAPP_NUMBER = "8801712345678";
const MESSENGER_URL = "https://m.me/example";

export function ProductPurchaseCard({ product }: ProductPurchaseCardProps) {
  const t = useTranslations("Shop");
  const format = useFormatter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleChangeQuantity = useCallback((delta: number) => {
    setQuantity((q) => Math.max(1, q + delta));
  }, []);

  const handleAddToCart = useCallback(() => {
    for (let i = 0; i < quantity; i++) addItem(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }, [addItem, product, quantity]);

  const productUrl = `${siteConfig.url}/${productPath(product.category, product.slug)}`;

  const shareText = `${product.name} - ${format.number(product.price, {
    style: "currency",
    currency: "BDT",
  })} on Fashion Store`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(productUrl);

  return (
    <div className="border-border lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-col gap-5 border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("price")}
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-secondary text-3xl font-bold">
              {format.number(product.price, { style: "currency", currency: "BDT" })}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-muted-foreground text-base line-through">
                {format.number(product.compareAtPrice, { style: "currency", currency: "BDT" })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("quantity")}
          </span>
          <div className="flex w-fit items-center border">
            <button
              type="button"
              onClick={() => handleChangeQuantity(-1)}
              aria-label={t("decreaseQty")}
              className="hover:bg-muted flex size-10 items-center justify-center transition-colors"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="flex size-10 items-center justify-center border-x text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleChangeQuantity(1)}
              aria-label={t("increaseQty")}
              className="hover:bg-muted flex size-10 items-center justify-center transition-colors"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-between border px-3 py-2.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {t("totalPrice")}
            </span>
            <span className="text-secondary text-lg font-bold">
              {format.number(product.price * quantity, { style: "currency", currency: "BDT" })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button className="h-auto w-full gap-2 py-3" onClick={handleAddToCart}>
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
          <Button variant="secondary" className="h-auto w-full gap-2 py-3">
            <Zap className="size-4" aria-hidden="true" />
            {t("buyNow")}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe5b] inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("whatsapp")}
            </a>
            <a
              href={`${MESSENGER_URL}?text=${encodeURIComponent(productUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0084FF] hover:bg-[#0073e6] inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("messenger")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
