import { setRequestLocale } from "next-intl/server";
import { ProductDetailsView } from "@/components/shop/CustomProductDetails";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { products } from "@/features/shop/products";

export async function generateStaticParams() {
  return products.map((product) => ({
    category: product.category?.toLowerCase() ?? "",
    slug: product.slug,
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);

  const product = products.find((p) => p.slug === slug);
  const matched = product && product.category?.toLowerCase() === category ? product : undefined;

  return (
    <>
      <ProductDetailsView serverProduct={matched} category={category} slug={slug} />
      {matched ? <RelatedProducts product={matched} /> : null}
      <RecentlyViewed />
    </>
  );
}
