"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { profileSchema, publicStoreUrl } from "@/features/vendor/store-mgmt";
import { useVendorProfile, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

const CATEGORIES = ["Fashion", "Women", "Saree", "Accessories", "Footwear"];

export default function VendorStoreProfilePage() {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const store = useVendorStore();

  const [fStore, setFStore] = useState(profile.store);
  const [fSlug, setFSlug] = useState(profile.slug);
  const [fEmail, setFEmail] = useState(profile.email);
  const [fPhone, setFPhone] = useState(profile.phone);
  const [fCategory, setFCategory] = useState(store.storeCategory);
  const [error, setError] = useState("");

  const dirty = useMemo(
    () => fStore !== profile.store || fSlug !== profile.slug || fEmail !== profile.email || fPhone !== profile.phone || fCategory !== store.storeCategory,
    [fStore, fSlug, fEmail, fPhone, fCategory, profile, store.storeCategory]
  );

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

  const save = (preview: boolean) => {
    const parsed = profileSchema.safeParse({ store: fStore.trim(), slug: fSlug.trim(), email: fEmail.trim(), phone: fPhone.trim(), category: fCategory });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid profile");
      return;
    }
    setError("");
    store.patchProfile({ store: fStore.trim(), slug: fSlug.trim(), email: fEmail.trim(), phone: fPhone.trim() });
    store.setStoreDetails({ category: fCategory });
    store.logStoreActivity("Store profile updated");
    store.notifyVendor("Store profile updated.", "info");
    toast.success(t("toastSaved"));
    if (preview) window.open(publicStoreUrl(fSlug.trim()), "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smProfile")} subtitle={profile.store}
        highlightLabel={t("smName")} highlightValue={profile.store} highlightIcon={Save}
      />

      <StoreTabs />
      {dirty ? <p className="border border-secondary/50 bg-secondary/10 p-2.5 text-sm font-semibold text-secondary" role="alert">{t("smUnsaved")}</p> : null}

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("smProfile")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label={t("smName")}>
            <Input value={fStore} onChange={(e) => setFStore(e.target.value)} className="bg-card" maxLength={60} />
          </Field>
          <Field label={t("smSlug")}>
            <div className="flex gap-1.5">
              <Input value={fSlug} onChange={(e) => setFSlug(e.target.value.toLowerCase())} className="bg-card font-mono" maxLength={60} />
              <Button variant="outline" size="sm" className="h-9 shrink-0 bg-card" onClick={() => setFSlug(slugify(fStore) || profile.slug)}>
                {t("smSlugGen")}
              </Button>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              {t("smStoreUrl")}{" "}
              <Link href={publicStoreUrl(fSlug || profile.slug) as "/"} className="font-mono font-bold text-secondary hover:underline">
                {typeof window !== "undefined" ? window.location.origin : ""}{publicStoreUrl(fSlug || profile.slug)}
              </Link>
            </p>
          </div>
          <Field label={t("storeEmail")}>
            <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("storePhone")}>
            <Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="bg-card" maxLength={20} />
          </Field>
          <Field label={t("smCategory")}>
            <Select value={fCategory} onValueChange={(v) => setFCategory(v ?? "Fashion")}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/vendor/store">
          <Button variant="outline" className="bg-card">{t("cancel")}</Button>
        </Link>
        <Button variant="outline" className="bg-card" onClick={() => save(false)} disabled={!dirty}>
          {t("saveBtn")}
        </Button>
        <Button onClick={() => save(true)} disabled={!dirty}>
          <ExternalLink className="size-4" aria-hidden="true" />
          {t("smSavePreview")}
        </Button>
      </div>
    </div>
  );
}
