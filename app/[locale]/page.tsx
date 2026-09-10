import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Coupons } from "@/components/sections/Coupons";
import { Features } from "@/components/sections/Features";
import { ProductCollection } from "@/components/sections/ProductCollection";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";
import { products } from "@/features/shop/products";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const women = products.filter((p) => p.category === "Women").slice(0, 10);
  const men = products.filter((p) => p.category === "Men").slice(0, 8);
  const kids = products.filter((p) => p.category === "Kids").slice(0, 6);
  const accessories = products.filter((p) => p.category === "Accessories").slice(0, 5);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col pb-14 md:pb-0">
        <Hero />
        <Marquee />
        <Coupons />
        <ProductCollection
          namespace="WomenCollection"
          products={women}
          bgClass="bg-background"
          cardVariant="classic"
        />
        <ProductCollection
          namespace="MenCollection"
          products={men}
          bgClass="bg-section-2"
          cardVariant="editorial"
        />
        <ProductCollection
          namespace="KidsCollection"
          products={kids}
          bgClass="bg-muted"
          cardVariant="playful"
        />
        <ProductCollection
          namespace="AccessoriesCollection"
          products={accessories}
          bgClass="bg-background"
          cardVariant="luxe"
        />
        <Testimonials />
        <Features />
        <CTA />
      </main>
      <Footer />
      <MobileBottomBar />
    </>
  );
}
