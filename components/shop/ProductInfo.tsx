"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Check, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHtmlDescription, RichDescription, plainDescription } from "@/components/shop/rich-description";
import { useState } from "react";
import type { Product } from "@/types/product";

interface ProductInfoProps {
  product: Product;
  qrValue: string;
}

export function ProductInfo({ product, qrValue }: ProductInfoProps) {
  const t = useTranslations("Shop");
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors?.[0] ?? null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes?.[0] ?? null
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {product.category ? (
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {product.category}
          </span>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {product.name}
        </h1>
        {product.sku ? (
          <p className="text-muted-foreground text-xs">
            <span className="font-semibold">{t("sku")}:</span> {product.sku}
          </p>
        ) : null}
        {product.shortDescription ? (
          isHtmlDescription(product.shortDescription) ? (
            <RichDescription
              html={product.shortDescription}
              className="text-muted-foreground text-sm"
            />
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {plainDescription(product.shortDescription)}
            </p>
          )
        ) : null}
        <span
          className={cn(
            "text-xs font-semibold tracking-wider uppercase",
            product.stock > 0 ? "text-emerald-600" : "text-destructive"
          )}
        >
          {product.stock > 0
            ? `${t("inStock")} (${product.stock} ${t("items")})`
            : t("outOfStock")}
        </span>
      </div>

      {product.colors && product.colors.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("colors")}
          </span>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                    active ? "border-foreground scale-110" : "border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {active ? (
                    <Check className="size-4 text-white drop-shadow" strokeWidth={3} aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {product.sizes && product.sizes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("sizes")}
          </span>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "min-w-11 rounded-sm border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("scanQr")}
        </span>
        <div className="bg-card border-border flex w-full items-center gap-3 border p-3">
          <QRCodeSVG value={qrValue} size={96} level="M" className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
            <span className="text-foreground text-sm font-medium">{t("shareProduct")}</span>
            <span>{t("qrHint")}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
        <div className="flex flex-col gap-3 border p-5">
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 flex size-9 items-center justify-center rounded-full">
              <Truck className="text-secondary size-5" aria-hidden="true" />
            </span>
            <h4 className="font-heading text-sm font-semibold">{t("deliveryInfo")}</h4>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("insideDhaka")}</span>
              <span className="font-medium">{t("insideDhakaEstimate")}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("outsideDhaka")}</span>
              <span className="font-medium">{t("outsideDhakaEstimate")}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("paymentMethod")}</span>
              <span className="font-medium">{t("paymentMethodValue")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
