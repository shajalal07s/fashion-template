"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductCard, type ProductCardVariant } from "@/components/shop/ProductCard";
import { CardStyleSelector } from "@/components/shop/CardStyleSelector";
import type { Product } from "@/types/product";

interface ProductsGridProps {
  products: Product[];
  showCategoryFilter?: boolean;
  initialCardVariant?: ProductCardVariant;
}

const MAX_COLORS = 12;

export function ProductsGrid({
  products,
  showCategoryFilter = false,
  initialCardVariant = "classic",
}: ProductsGridProps) {
  const t = useTranslations("CollectionFilter");
  const [cardVariant, setCardVariant] = useState<ProductCardVariant>(initialCardVariant);

  const sizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes ?? []))).sort(),
    [products]
  );
  const colors = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.colors ?? []))),
    [products]
  );
  const categoriesList = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const prices = useMemo(
    () => products.map((p) => p.price).sort((a, b) => a - b),
    [products]
  );
  const minPrice = prices[0] ?? 0;
  const maxPrice = prices[prices.length - 1] ?? 0;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAllColors, setShowAllColors] = useState(false);
  const [min, setMin] = useState<number | "">(minPrice);
  const [max, setMax] = useState<number | "">(maxPrice);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (q && !product.name.toLowerCase().includes(q)) return false;
      if (
        showCategoryFilter &&
        selectedCategories.length > 0 &&
        !selectedCategories.includes(product.category ?? "")
      )
        return false;
      if (selectedSize && !(product.sizes ?? []).includes(selectedSize)) return false;
      if (selectedColor && !(product.colors ?? []).includes(selectedColor)) return false;
      const lo = min === "" ? minPrice : Number(min);
      const hi = max === "" ? maxPrice : Number(max);
      if (product.price < lo || product.price > hi) return false;
      return true;
    });
  }, [
    products,
    query,
    showCategoryFilter,
    selectedCategories,
    selectedSize,
    selectedColor,
    min,
    max,
    minPrice,
    maxPrice,
  ]);

  const reset = () => {
    setQuery("");
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedCategories([]);
    setShowAllColors(false);
    setMin(minPrice);
    setMax(maxPrice);
  };

  const hasActiveFilters =
    query !== "" ||
    selectedCategories.length > 0 ||
    selectedSize !== null ||
    selectedColor !== null ||
    min !== minPrice ||
    max !== maxPrice;

  const filterBody = (
    <div className="flex flex-col divide-y">
      <div className="flex flex-col gap-3 py-4">
        <span className="text-xs font-bold tracking-wider text-foreground uppercase">
          {t("filterSearch")}
        </span>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("filterSearchPlaceholder")}
            className="pl-8"
          />
        </div>
      </div>

      {showCategoryFilter && (
        <div className="flex flex-col gap-3 py-4">
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">
            {t("filterCategory")}
          </span>
          <div className="flex flex-col gap-2.5">
            {categoriesList.map((cat) => {
              const checked = selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(checkedValue) => {
                      const isChecked = checkedValue === true;
                      setSelectedCategories((prev) =>
                        isChecked ? [...prev, cat] : prev.filter((c) => c !== cat)
                      );
                    }}
                  />
                  <span className="text-foreground">
                    {t(`categories.${cat.toLowerCase()}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 py-4">
        <span className="text-xs font-bold tracking-wider text-foreground uppercase">
          {t("filterSize")}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSize(null)}
            className={cn(
              "border px-2.5 py-1 text-xs font-medium transition-colors",
              selectedSize === null
                ? "border-secondary bg-secondary text-white"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            {t("filterAll")}
          </button>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(selectedSize === size ? null : size)}
              className={cn(
                "border px-2.5 py-1 text-xs font-medium transition-colors",
                selectedSize === size
                  ? "border-secondary bg-secondary text-white"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4">
        <span className="text-xs font-bold tracking-wider text-foreground uppercase">
          {t("filterColor")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedColor(null)}
            className={cn(
              "border px-2.5 py-1 text-xs font-medium transition-colors",
              selectedColor === null
                ? "border-secondary bg-secondary text-white"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            {t("filterAll")}
          </button>
          {(showAllColors ? colors : colors.slice(0, MAX_COLORS)).map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => setSelectedColor(selectedColor === color ? null : color)}
              className={cn(
                "size-6 rounded-full border border-black/10 transition-transform",
                selectedColor === color && "ring-2 ring-secondary ring-offset-2"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        {colors.length > MAX_COLORS && (
          <button
            type="button"
            onClick={() => setShowAllColors((prev) => !prev)}
            className="text-secondary hover:text-foreground mt-2 self-start text-xs font-semibold underline-offset-2 hover:underline"
          >
            {showAllColors ? t("showLess") : t("seeMore")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 py-4">
        <span className="text-xs font-bold tracking-wider text-foreground uppercase">
          {t("filterPrice")}
        </span>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-8">{t("filterFrom")}</span>
            <input
              type="number"
              value={min}
              min={minPrice}
              max={maxPrice}
              onChange={(e) =>
                setMin(e.target.value === "" ? "" : Math.max(minPrice, Number(e.target.value)))
              }
              className="border-border w-full border px-2 py-1.5 outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-8">{t("filterTo")}</span>
            <input
              type="number"
              value={max}
              min={minPrice}
              max={maxPrice}
              onChange={(e) =>
                setMax(e.target.value === "" ? "" : Math.min(maxPrice, Number(e.target.value)))
              }
              className="border-border w-full border px-2 py-1.5 outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="hidden h-fit border bg-white p-4 lg:sticky lg:top-24 lg:block">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Filter className="text-secondary size-4" aria-hidden="true" />
            <span className="text-sm font-bold uppercase tracking-wide">{t("filterTitle")}</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1.5 px-2 text-xs"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("filterReset")}
            </Button>
          )}
        </div>

        {filterBody}
      </aside>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                    <Filter className="size-4" aria-hidden="true" />
                    {t("filterButton")}
                  </Button>
                }
              />
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{t("filterTitle")}</SheetTitle>
                </SheetHeader>
                <div className="px-4">{filterBody}</div>
              </SheetContent>
            </Sheet>
            <span className="hidden text-sm text-foreground lg:inline">{t("filterTitle")}</span>
          </div>
          <div className="hidden sm:block">
            <CardStyleSelector value={cardVariant} onChange={setCardVariant} />
          </div>
          <span className="text-muted-foreground text-sm">
            {t("resultsCount", { count: filtered.length })}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-[15px] md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} variant={cardVariant} />
            ))}
          </div>
        ) : (
          <div className="border-border flex flex-col items-center justify-center gap-2 border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-sm">{t("noResults")}</p>
            <Button variant="outline" size="sm" onClick={reset}>
              {t("filterReset")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
