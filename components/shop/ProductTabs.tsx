"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { isHtmlDescription, RichDescription } from "@/components/shop/rich-description";
import { useState } from "react";

interface ProductTabsProps {
  product: Product;
}

const TABS = ["description", "additional", "reviews"] as const;
type TabKey = (typeof TABS)[number];

export function ProductTabs({ product }: ProductTabsProps) {
  const t = useTranslations("Shop");
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const attributes: Array<{ label: string; value: string }> = [
    { label: t("attBrand"), value: product.brand ?? "—" },
    { label: t("attCategory"), value: product.category ?? "—" },
    { label: t("attSku"), value: product.sku ?? "—" },
    { label: t("attStock"), value: String(product.stock) },
    { label: t("attRating"), value: product.rating ? `${product.rating} / 5` : "—" },
  ];

  return (
    <div className="bg-card border-border w-full border shadow-sm">
      <div className="flex overflow-x-auto border-b">
        {TABS.map((key) => {
          const label =
            key === "description"
              ? t("description")
              : key === "additional"
                ? t("additionalInfo")
                : t("reviews");
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span
                className={cn(
                  "bg-primary absolute inset-x-0 bottom-0 h-0.5 transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="p-5 md:p-7">
        {activeTab === "description" && (
          isHtmlDescription(product.description) ? (
            <RichDescription
              html={product.description}
              className="text-muted-foreground max-w-4xl"
            />
          ) : (
            <p className="text-muted-foreground max-w-4xl leading-relaxed">
              {product.description}
            </p>
          )
        )}

        {activeTab === "additional" && (
          <div className="flex flex-col">
            {attributes.map((attr, index) => (
              <div
                key={attr.label}
                className={cn(
                  "grid grid-cols-2 gap-4 px-4 py-3.5 text-sm sm:grid-cols-[220px_1fr]",
                  index < attributes.length - 1 && "border-border border-b",
                  index % 2 === 1 && "bg-muted/40"
                )}
              >
                <span className="text-muted-foreground">{attr.label}</span>
                <span className="font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="flex max-w-4xl flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{product.rating ?? 0}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i < Math.round(product.rating ?? 0)
                        ? "text-secondary fill-secondary"
                        : "text-muted-foreground/30"
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                {t("reviewsCount", { count: 0 })}
              </span>
            </div>

            {submitted ? (
              <div className="bg-primary/10 border-primary/20 rounded-sm border p-4 text-sm">
                {t("reviewThanks")}
              </div>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label className="text-muted-foreground text-sm font-medium" htmlFor="review">
                  {t("writeReview")}
                </label>
                <textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t("reviewPlaceholder")}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground min-h-24 w-full border px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!reviewText.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-fit rounded-sm px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("submitReview")}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
