"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Eye, Pencil, Star } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { SectionCard } from "@/components/admin/products/edit/sections";
import { useVendorProducts, useVendorReviews, useVendorStore } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Mini({ label, value }: { label: string; value: string }) {  return (
    <Card className="border-border bg-card">
      <CardContent className="p-3">
        <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className="font-heading truncate text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", bold && "font-bold text-secondary")}>{value}</span>
    </div>
  );
}

export default function VendorProductDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const products = useVendorProducts();
  const reviews = useVendorReviews();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const [activeImage, setActiveImage] = useState(0);

  const productReviews = useMemo(
    () => reviews.filter((r) => r.product === product?.name).slice(0, 3),
    [reviews, product]
  );
  const conversion = product && product.views > 0 ? Math.round((product.sold / product.views) * 1000) / 10 : 0;
  const discount = product && product.salePrice > 0 ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  if (!product) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_products")}
          title={t("view")}
          subtitle={id}
          highlightLabel={t("tStatus")}
          highlightValue="—"
          highlightIcon={Eye}
        />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyProducts")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const gallery = [product.image, ...(product.gallery ?? []).filter((g) => g !== product.image)];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={product.name}
        subtitle={`${product.sku} · ${product.status}`}
        highlightLabel={t("mRevenue")}
        highlightValue={money(product.revenue)}
        highlightIcon={Eye}
      >
        <Link href="/vendor/products" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("backToProducts")}
        </Link>
        <Link href={`/vendor/products/${product.id}/edit`} className={heroPillClassName}>
          <Pencil className="size-3.5" aria-hidden="true" />
          {t("edit")}
        </Link>
        <button
          type="button"
          onClick={() => {
            const newId = store.duplicateProduct(product.id);
            if (newId) {
              toast.success(t("dupDone"));
              router.push(`/vendor/products/${newId}/edit`);
            }
          }}
          className={heroPillClassName}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {t("duplicateBtn")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Mini label={t("mSales")} value={num(product.sold)} />
        <Mini label={t("mRevenue")} value={money(product.revenue)} />
        <Mini label={t("mStock")} value={num(product.stock)} />
        <Mini label={t("mReviews")} value={num(product.reviews)} />
        <Mini label={t("mViews")} value={num(product.views)} />
        <Mini label={t("mCarts")} value={num(product.carts)} />
        <Mini label={t("mConversion2")} value={`${conversion}%`} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("dGallery")}>
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gallery[activeImage] ?? product.image} alt={product.name} className="h-full w-full object-cover" />
            {discount > 0 ? (
              <span className="absolute top-2 left-2 bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                {discount}% OFF
              </span>
            ) : null}
            {product.featured ? (
              <span className="absolute top-2 right-2 bg-primary/90 px-2 py-0.5 text-xs font-bold text-white">
                {t("featuredBadge")}
              </span>
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <div className="flex gap-2">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Image ${i + 1}`}
                  className={cn("size-14 shrink-0 overflow-hidden border-2", activeImage === i ? "border-secondary" : "border-transparent")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title={t("dInfo")}>
            <div className="flex flex-col gap-1 text-sm">
              <KV label={t("fDesc")} value={product.shortDesc || "—"} />
              <KV label={t("fCategory")} value={`${product.category} / ${product.subCategory}`} />
              <KV label={t("fBrand")} value={product.brand} />
              <KV label={t("fTags")} value={(product.tags ?? []).join(", ") || "—"} />
              <KV label={t("fVisibility")} value={product.visibility} />
            </div>
            <div className="text-sm" dangerouslySetInnerHTML={{ __html: product.description }} />
          </SectionCard>

          <SectionCard title={t("dPricing")}>
            <div className="flex flex-col gap-1 text-sm">
              <KV label={t("fRegular")} value={money(product.price)} />
              <KV label={t("fSale")} value={product.salePrice > 0 ? money(product.salePrice) : "—"} />
              <KV label={t("fCost")} value={money(product.costPrice)} />
              <KV label={t("discountTitle")} value={discount > 0 ? `${discount}%` : "—"} bold />
            </div>
          </SectionCard>

          <SectionCard title={t("dInventory")}>
            <div className="flex flex-col gap-1 text-sm">
              <KV label={t("fSku")} value={product.sku} />
              <KV label={t("tStock")} value={num(product.stock)} bold />
              <KV label={t("fThreshold")} value={num(product.lowThreshold)} />
              <KV label={t("fManage")} value={product.manageStock ? "Yes" : "No"} />
              <KV label={t("fBackorder")} value={product.backorder ? "Yes" : "No"} />
            </div>
            <Link href="/vendor/products/inventory">
              <Button variant="outline" size="sm" className="w-fit bg-card">{t("iTitle")}</Button>
            </Link>
          </SectionCard>
        </div>
      </div>

      {(product.variations ?? []).length > 0 ? (
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">
              {t("dVariations")} ({(product.variations ?? []).length})
            </CardTitle>
            <Link href={`/vendor/products/${product.id}/variations`}>
              <Button variant="outline" size="sm" className="h-8 bg-card">{t("manageVariations")}</Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td:not(:first-child)]:border-l [&_th]:h-10 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tVariation")}</TableHead>
                  <TableHead>{t("vSku")}</TableHead>
                  <TableHead className="text-right">{t("vPrice")}</TableHead>
                  <TableHead className="text-right">{t("vStock")}</TableHead>
                  <TableHead>{t("vStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(product.variations ?? []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm font-semibold">{v.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{v.sku}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap">{money(v.salePrice > 0 ? v.salePrice : v.price)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(v.stock)}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold", v.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {v.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("dAnalytics")}</CardTitle>
            <Link href={`/vendor/products/${product.id}/analytics`}>
              <Button variant="outline" size="sm" className="h-8 bg-card">{t("productAnalytics")}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={[
                { x: "Apr", y: Math.round(product.revenue / 6) },
                { x: "May", y: Math.round(product.revenue / 5) },
                { x: "Jun", y: Math.round(product.revenue / 5) },
                { x: "Jul", y: Math.round(product.revenue / 4) },
                { x: "Aug", y: Math.round(product.revenue / 3) },
                { x: "Sep", y: Math.round(product.revenue / 3) },
              ]}
            />
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              {[
                [t("mViews"), num(product.views)],
                [t("mCarts"), num(product.carts)],
                [t("mConversion2"), `${conversion}%`],
              ].map(([l, v]) => (
                <div key={l as string} className="border border-border px-2 py-2">
                  <p className="font-heading text-sm font-bold">{v as string}</p>
                  <p className="text-[11px] text-muted-foreground">{l as string}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">
              {t("dReviews")} ({product.reviews})
            </CardTitle>
            <Link href="/vendor/products/reviews">
              <Button variant="outline" size="sm" className="h-8 bg-card">{t("productReviews")}</Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {productReviews.map((r) => (
              <div key={r.id} className="border border-border p-2.5">
                <div className="flex items-center gap-2">
                  <CustomerAvatar name={r.customer} size="sm" />
                  <p className="text-xs font-bold">{r.customer}</p>
                  <span className="ml-auto flex items-center gap-0.5 text-xs font-bold">
                    <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
                    {r.rating}
                  </span>
                </div>
                <p className="pt-1 text-xs text-muted-foreground">“{r.text}”</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionCard title={t("dActivity")}>
        {(product.activity ?? []).length > 0 ? (
          (product.activity ?? []).map((a, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-border py-1.5 text-sm last:border-0">
              <span className="size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
              <span className="font-semibold">{a.event}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.detail}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.date}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </SectionCard>
    </div>
  );
}
