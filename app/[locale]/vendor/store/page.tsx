"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, Circle, ExternalLink, MapPin, Pencil, Star, Store } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { publicStoreUrl, storeCompletion } from "@/features/vendor/store-mgmt";
import { averageRating } from "@/features/vendor/reviews";
import {
  useStoreAddresses,
  useStoreSocials,
  useVendorOrders,
  useVendorProducts,
  useVendorProfile,
  useVendorReviews,
  useVendorStore,
} from "@/store/vendor.store";
import { StoreTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

export default function VendorStorePage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const profile = useVendorProfile();
  const products = useVendorProducts();
  const reviews = useVendorReviews();
  const orders = useVendorOrders();
  const addresses = useStoreAddresses();
  const socials = useStoreSocials();
  const store = useVendorStore();

  const num = (v: number) => format.number(v);
  const avg = averageRating(reviews.map((r) => ({ rating: r.rating })));

  const contact = store.storeContact;
  const completion = storeCompletion({
    hasName: profile.store.trim().length >= 3,
    hasLogo: !!profile.logo,
    hasBanner: !!store.storeBanner,
    hasDesc: store.storeDescription.replace(/<[^>]+>/g, "").trim().length > 20,
    hasContact: contact.businessEmail.includes("@") && contact.phone.trim().length >= 6,
    hasAddress: addresses.length > 0,
    hasSocial: socials.filter((s) => s.enabled).length > 0,
  });

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicStoreUrl(profile.slug)}`);
      toast.success(t("toastSaved"));
    } catch {
      toast.error(t("toastSaved"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")}
        title={profile.store}
        subtitle={`${profile.email} · ${profile.phone}`}
        highlightLabel={t("rwAvg")}
        highlightValue={`${avg} / 5`}
        highlightIcon={Store}
      >
        <Link href={publicStoreUrl(profile.slug) as "/"} className={heroPillClassName}>
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {t("smViewStore")}
        </Link>
        <Link href="/vendor/store/profile" className={heroPillClassName}>
          <Pencil className="size-3.5" aria-hidden="true" />
          {t("smEditStore")}
        </Link>
      </AccountingHero>

      <StoreTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.storeBanner} alt={`${profile.store} banner`} className="h-44 w-full object-cover md:h-56" loading="lazy" />
          </div>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.logo} alt={`${profile.store} logo`} className="size-20 shrink-0 border border-border object-cover" loading="lazy" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-xl font-bold">{profile.store}</p>
              <p className="flex items-center gap-1.5 text-sm">
                <StarsRow value={avg} />
                <span className="font-bold">{avg}</span>
                <span className="text-muted-foreground">· {num(products.length)} {t("smProductsCount")} · {num(reviews.length)} {t("smReviewsCount")}</span>
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                {addresses.find((a) => a.isDefault)?.city ?? profile.address}
              </p>
              <p className="truncate text-xs text-muted-foreground">{store.storeShortDesc}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" className="bg-card" onClick={copyUrl}>{publicStoreUrl(profile.slug)}</Button>
              <Link href="/vendor/store/profile">
                <Button size="sm">{t("smEditStore")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">
                {t("smCompletion")} · {completion.pct}%
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 px-4 pb-4">
              <div className="h-2 w-full bg-muted" role="progressbar" aria-valuenow={completion.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-secondary transition-all" style={{ width: `${completion.pct}%` }} />
              </div>
              {completion.pct < 100 ? (
                <p className="text-xs text-muted-foreground">{t("smContinue")}</p>
              ) : (
                <p className="text-xs font-bold text-green-700">{t("smComplete")} ✓</p>
              )}
              {completion.items.map((item) => (
                <Link key={item.key} href={item.href as "/vendor/store/profile"} className="flex items-center gap-2 py-1 text-sm transition-colors hover:text-secondary">
                  {item.done ? <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-hidden="true" /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  <span className={item.done ? "" : "font-semibold"}>{item.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-heading text-base font-bold">
                <Star className="size-4 text-secondary" aria-hidden="true" />
                {t("smVerification")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm">
              <p className="font-bold text-green-700">✓ {t("poVerified")}</p>
              <p className="text-muted-foreground">{t("smVerifiedOn")}: September 28, 2026</p>
              <p className="pt-1 text-xs text-muted-foreground">
                {t("smActivity")}: {store.storeActivity[0]?.action ?? "—"} · {store.storeActivity[0]?.date ?? ""}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("smActivity")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ol className="flex flex-col gap-2.5 border-l-2 border-secondary/30 pl-4">
            {store.storeActivity.slice(0, 6).map((a) => (
              <li key={a.id} className="relative text-sm">
                <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-secondary" aria-hidden="true" />
                <p className="font-bold">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.date}</p>
              </li>
            ))}
          </ol>
          <p className="pt-3 text-xs text-muted-foreground">
            {num(orders.length)} {t("eOrders")} · {socials.filter((s) => s.enabled).length} {t("smSocial")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
