import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VendorShell } from "@/components/vendor/VendorShell";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]/vendor">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard.Vendor" });

  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  };
}

export default async function VendorLayout({
  children,
  params,
}: LayoutProps<"/[locale]/vendor">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <VendorShell>{children}</VendorShell>;
}
