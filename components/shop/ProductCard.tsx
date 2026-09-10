"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Eye, Heart, Plus, ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductQuickView } from "@/components/shop/ProductQuickView";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { productPath } from "@/features/shop/categories";
import type { Product } from "@/types/product";
import { useCallback, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export type ProductCardVariant = "classic" | "editorial" | "playful" | "luxe";

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
}

function ProductMedia({
  product,
  href,
  hrefLabel,
  children,
}: {
  product: Product;
  href: string;
  hrefLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={hrefLabel} className="relative block h-full w-full overflow-hidden">
      {product.images[0] ? (
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
        />
      ) : (
        <div className="from-primary/15 to-secondary/15 flex h-full w-full items-center justify-center bg-gradient-to-br p-8">
          <span className="text-primary/80 font-heading text-6xl leading-none font-bold select-none">
            {product.name[0]}
          </span>
        </div>
      )}
      {children}
    </Link>
  );
}

function PriceBlock({
  product,
  price,
  comparePrice,
  className,
}: {
  product: Product;
  price: string;
  comparePrice: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="text-secondary text-sm font-bold sm:text-base">{price}</span>
      {product.compareAtPrice && product.compareAtPrice > product.price && (
        <span className="text-muted-foreground text-xs line-through sm:text-sm">
          {comparePrice}
        </span>
      )}
    </div>
  );
}

function ColorDots({ colors, className }: { colors: string[]; className?: string }) {
  if (colors.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {colors.slice(0, 4).map((color) => (
        <span
          key={color}
          className="size-3 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Rating({ rating, className }: { rating?: number; className?: string }) {
  if (!rating) return null;
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <Star className="fill-primary text-primary size-3.5" aria-hidden="true" />
      <span className="text-muted-foreground text-xs font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ProductCard({ product, variant = "classic" }: ProductCardProps) {
  const t = useTranslations("Shop");
  const format = useFormatter();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const [justAdded, setJustAdded] = useState(false);
  const isMobile = useIsMobile();
  const activeVariant = isMobile ? "classic" : variant;

  const handleAddToCart = useCallback(() => {
    addItem(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }, [addItem, product]);

  const href = productPath(product.category, product.slug);
  const price = format.number(product.price, { style: "currency", currency: "BDT" });
  const comparePrice = product.compareAtPrice
    ? format.number(product.compareAtPrice, { style: "currency", currency: "BDT" })
    : null;

  const stop = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const quickView = (
    <Dialog>
      <DialogTrigger
        onClick={(event) => event.stopPropagation()}
        render={<Button variant="secondary" size="icon" className="size-10 shadow-lg" />}
        aria-label={t("quickView")}
      >
        <Eye className="size-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("quickView")} — {product.name}
          </DialogDescription>
        </DialogHeader>
        <ProductQuickView product={product} />
      </DialogContent>
    </Dialog>
  );

  if (activeVariant === "editorial") {
    return (
      <article className="group/card border-border relative flex flex-col border-t border-b bg-white">
        <div className="relative h-[250px] overflow-hidden md:h-[380px]">
          <ProductMedia product={product} href={href} hrefLabel={product.name}>
            <div className="absolute top-0 left-0 z-[5] bg-black px-3 py-1.5 text-[11px] font-semibold tracking-widest text-white uppercase">
              {product.category}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex h-0 items-center overflow-hidden bg-black/60 backdrop-blur-[2px] transition-all duration-300 group-hover/card:h-12 group-focus-within/card:h-12">
              <div className="flex w-full items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(event) => {
                    stop(event);
                    toggleWishlist(product);
                  }}
                  aria-label={isInWishlist ? t("removeWishlist") : t("addWishlist")}
                  className={cn("h-8", isInWishlist && "text-destructive")}
                >
                  <Heart className="size-4" fill={isInWishlist ? "currentColor" : "none"} aria-hidden="true" />
                </Button>
                <Button className="h-8 gap-1.5" onClick={(event) => { stop(event); handleAddToCart(); }}>
                  {justAdded ? <Plus className="size-4" aria-hidden="true" /> : <ShoppingCart className="size-4" aria-hidden="true" />}
                  {t("addToCart")}
                </Button>
                {quickView}
              </div>
            </div>
          </ProductMedia>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-1 pt-3">
          <ColorDots colors={product.colors ?? []} />
          <Link
            href={href}
            className="text-foreground font-heading line-clamp-1 text-sm leading-snug font-semibold hover:underline sm:text-lg"
          >
            {product.name}
          </Link>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <PriceBlock product={product} price={price} comparePrice={comparePrice} className="min-w-0" />
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold tracking-wide text-foreground uppercase sm:text-xs">
              <span className="hidden sm:inline">{t("viewProduct")}</span>
              <ArrowRight className="text-secondary size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (activeVariant === "playful") {
    return (
      <article className="group/card flex flex-col rounded-3xl border-2 border-border bg-white p-2.5 transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="absolute top-3 left-3 z-[5] rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wide text-white">
              SALE
            </span>
          ) : (
            <span className="absolute top-3 left-3 z-[5] rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-wide text-white">
              NEW
            </span>
          )}
          <ProductMedia product={product} href={href} hrefLabel={product.name}>
            <div className="absolute inset-0 z-[4] flex items-center justify-center gap-2 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 group-hover/card:opacity-100">
              <Button
                size="icon"
                variant="secondary"
                onClick={(event) => { stop(event); toggleWishlist(product); }}
                aria-label={isInWishlist ? t("removeWishlist") : t("addWishlist")}
                className={cn("size-11 rounded-full shadow-lg", isInWishlist && "text-destructive")}
              >
                <Heart className="size-5" fill={isInWishlist ? "currentColor" : "none"} aria-hidden="true" />
              </Button>
              {quickView}
            </div>
          </ProductMedia>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-1 pt-3 pb-1 text-center">
          <Rating rating={product.rating} className="justify-center" />
          <Link href={href} className="text-foreground line-clamp-1 text-base font-semibold hover:underline">
            {product.name}
          </Link>
          <div className="flex items-center justify-between gap-2">
            <PriceBlock product={product} price={price} comparePrice={comparePrice} />
            <Button
              size="icon"
              className="size-10 rounded-full"
              onClick={(event) => { stop(event); handleAddToCart(); }}
              aria-label={t("addToCart")}
            >
              {justAdded ? <Plus className="size-5" aria-hidden="true" /> : <ShoppingCart className="size-5" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </article>
    );
  }

  if (activeVariant === "luxe") {
    return (
      <article className="group/card flex flex-col border border-primary/20 bg-[#fffaf2] p-3">
        <div className="relative h-[240px] overflow-hidden bg-[#f5ead8] p-4 md:h-[360px]">
          <ProductMedia product={product} href={href} hrefLabel={product.name}>
            <div className="absolute top-0 right-0 z-[5] bg-primary/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-white uppercase">
              {product.category}
            </div>
            <div className="absolute inset-0 z-[4] flex items-center justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(event) => { stop(event); toggleWishlist(product); }}
                  aria-label={isInWishlist ? t("removeWishlist") : t("addWishlist")}
                  className={cn("size-9", isInWishlist && "text-destructive")}
                >
                  <Heart className="size-4" fill={isInWishlist ? "currentColor" : "none"} aria-hidden="true" />
                </Button>
                {quickView}
              </div>
            </div>
          </ProductMedia>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 pt-4 text-center">
          <span className="text-primary/80 truncate text-[11px] font-medium tracking-[0.25em] uppercase">
            {product.brand ?? product.category}
          </span>
          <Link
            href={href}
            className="text-foreground font-heading line-clamp-1 text-sm font-semibold hover:underline sm:text-base"
          >
            {product.name}
          </Link>
          <div className="mt-auto flex flex-col items-center gap-2 border-t border-primary/15 pt-3 sm:flex-row sm:justify-center sm:gap-3">
            <PriceBlock product={product} price={price} comparePrice={comparePrice} />
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-full justify-center gap-1 border-primary/30 uppercase sm:h-8 sm:w-auto"
              onClick={(event) => { stop(event); handleAddToCart(); }}
              aria-label={t("addToCart")}
            >
              {justAdded ? <Plus className="size-4" aria-hidden="true" /> : <ShoppingCart className="size-4" aria-hidden="true" />}
              {t("addToCart")}
            </Button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group/card border-border relative flex flex-col border bg-white p-[5px] sm:p-2.5">
      <div className="relative h-[250px] overflow-hidden md:h-[400px]">
        <ProductMedia product={product} href={href} hrefLabel={product.name}>
          <div className="absolute inset-x-0 top-0 z-[5] flex items-center justify-between gap-2 p-2.5">
            <ColorDots colors={product.colors ?? []} />
            <div className="flex items-center gap-1">
              {(product.sizes ?? []).map((size) => (
                <span
                  key={size}
                  className="flex size-5 items-center justify-center bg-white/80 text-[9px] font-semibold text-foreground"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              onClick={(event) => { stop(event); toggleWishlist(product); }}
              aria-label={isInWishlist ? t("removeWishlist") : t("addWishlist")}
              className={cn("size-10 shadow-lg", isInWishlist && "text-destructive")}
            >
              <Heart className="size-4" fill={isInWishlist ? "currentColor" : "none"} aria-hidden="true" />
            </Button>
            <Button
              className="size-10 gap-0 shadow-lg"
              onClick={(event) => { stop(event); handleAddToCart(); }}
              aria-label={t("addToCart")}
            >
              {justAdded ? <Plus className="size-4" aria-hidden="true" /> : <ShoppingCart className="size-4" aria-hidden="true" />}
            </Button>
            {quickView}
          </div>
        </ProductMedia>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3 text-center">
        <Link href={href} className="text-foreground line-clamp-1 text-sm font-medium hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-center gap-2">
          <PriceBlock product={product} price={price} comparePrice={comparePrice} />
        </div>
      </div>
    </article>
  );
}
