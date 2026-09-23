import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminLoginForm } from "@/features/auth/components/AdminLoginForm";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin-login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.adminLogin" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminLoginPage({ params }: PageProps<"/[locale]/admin-login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.adminLogin");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="text-muted-foreground text-sm">{t("subheading")}</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
