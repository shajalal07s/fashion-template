"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { Field } from "@/components/admin/products/edit/sections";
import { seoSchema } from "@/features/vendor/store-mgmt";
import { useVendorProfile, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function VendorStoreDescriptionPage() {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const store = useVendorStore();

  const [shortDesc, setShortDesc] = useState(store.storeShortDesc);
  const [fullDesc, setFullDesc] = useState(store.storeDescription);
  const [metaTitle, setMetaTitle] = useState(store.storeSeo.metaTitle);
  const [metaDesc, setMetaDesc] = useState(store.storeSeo.metaDesc);
  const [keywords, setKeywords] = useState(store.storeSeo.keywords);
  const [error, setError] = useState("");

  const plainLen = useMemo(() => stripHtml(fullDesc).length, [fullDesc]);

  const save = () => {
    if (shortDesc.trim().length < 10) {
      setError("Short description must be at least 10 characters.");
      return;
    }
    if (plainLen < 20) {
      setError("Full description must be at least 20 characters.");
      return;
    }
    const parsed = seoSchema.safeParse({ metaTitle, metaDesc, keywords });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid SEO fields");
      return;
    }
    setError("");
    store.setStoreDetails({ shortDesc: shortDesc.trim(), description: fullDesc });
    store.patchSeo({ metaTitle: metaTitle.trim(), metaDesc: metaDesc.trim(), keywords: keywords.trim() });
    store.logStoreActivity("Store description updated");
    store.notifyVendor("Store description updated.", "info");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smDesc")} subtitle={profile.store}
        highlightLabel={t("smDesc")} highlightValue={`${plainLen}`} highlightIcon={FileText}
      />

      <StoreTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("smDesc")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4">
            <Field label={t("smShortDesc")}>
              <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} className="bg-card" maxLength={200} />
            </Field>
            <Field label={t("smFullDesc")}>
              <RichTextEditor value={fullDesc} onChange={setFullDesc} />
            </Field>
            <p className="text-right text-[11px] text-muted-foreground">{plainLen} chars</p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">SEO</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-4 pb-4">
              <Field label={`${t("smSeoTitle")} (${metaTitle.length}/60)`}>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="bg-card" maxLength={60} />
              </Field>
              <Field label={`${t("smSeoDesc")} (${metaDesc.length}/160)`}>
                <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} className="bg-card" maxLength={160} />
              </Field>
              <Field label={t("smSeoKeys")}>
                <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="bg-card" maxLength={200} />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
              <Eye className="size-4 text-secondary" aria-hidden="true" />
              <CardTitle className="font-heading text-base font-bold">{t("smSocialPreview")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="border border-border p-3">
                <p className="truncate font-heading text-base font-bold text-secondary">{metaTitle || profile.store}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{metaDesc || shortDesc}</p>
                <p className="pt-1 font-mono text-[11px] text-muted-foreground">/store/{profile.slug}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
