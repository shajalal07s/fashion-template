"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SeoSettingsPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const seo = useCmsStore((s) => s.seo);
  const store = useCmsStore();
  const [tplPreview, setTplPreview] = useState("product");

  const save = () => toast.success(t("toastSaved"));
  const set = (patch: Partial<typeof seo>) => store.patchSeo(patch);

  const tplText =
    tplPreview === "product"
      ? seo.productTpl.replace("{product_name}", "Printed Kurti").replace("{site_name}", seo.siteTitle)
      : tplPreview === "category"
        ? seo.categoryTpl.replace("{category_name}", "Women").replace("{site_name}", seo.siteTitle)
        : seo.blogTpl.replace("{post_title}", "Style Guide").replace("{site_name}", seo.siteTitle);

  const checks = [
    { label: "Meta title", ok: seo.metaTitle.length >= 30 && seo.metaTitle.length <= 60, hint: `${seo.metaTitle.length}/60` },
    { label: "Meta description", ok: seo.metaDesc.length >= 120 && seo.metaDesc.length <= 160, hint: `${seo.metaDesc.length}/160` },
    { label: "Keywords", ok: seo.keywords.length > 0, hint: seo.keywords.split(",").length + " kw" },
  ];
  const scorePct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("soTitle")}
        subtitle={t("soSubtitle")}
        highlightLabel={t("seoScore")}
        highlightValue={`${scorePct}%`}
        highlightIcon={Search}
      >
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secGlobal")}>
          <Field label={t("fSiteTitle")}>
            <Input value={seo.siteTitle} onChange={(e) => set({ siteTitle: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fSiteDesc")}>
            <Input value={seo.siteDesc} onChange={(e) => set({ siteDesc: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fMetaTitle")}>
            <Input value={seo.metaTitle} onChange={(e) => set({ metaTitle: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fMetaDesc")}>
            <Input value={seo.metaDesc} onChange={(e) => set({ metaDesc: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fKeywords")}>
              <Input value={seo.keywords} onChange={(e) => set({ keywords: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fCanonical")}>
              <Input value={seo.canonical} onChange={(e) => set({ canonical: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fSocialImage")}>
              <Input value={seo.socialImage} onChange={(e) => set({ socialImage: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fFavicon")}>
              <Input value={seo.favicon} onChange={(e) => set({ favicon: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secTemplates")}>
          <Field label={t("fProductTpl")}>
            <Input value={seo.productTpl} onChange={(e) => set({ productTpl: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
          <Field label={t("fCategoryTpl")}>
            <Input value={seo.categoryTpl} onChange={(e) => set({ categoryTpl: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
          <Field label={t("fBlogTpl")}>
            <Input value={seo.blogTpl} onChange={(e) => set({ blogTpl: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
          <div className="flex items-center gap-2">
            <Select value={tplPreview} onValueChange={(v) => setTplPreview(v ?? "product")}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
            <p className="min-w-0 flex-1 truncate border border-border bg-muted px-3 py-1.5 font-mono text-xs">{tplText}</p>
          </div>
        </SectionCard>

        <SectionCard title={t("secSocial")}>
          <Field label={t("fOgTitle")}>
            <Input value={seo.ogTitle} onChange={(e) => set({ ogTitle: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fOgDesc")}>
            <Input value={seo.ogDesc} onChange={(e) => set({ ogDesc: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fOgImage")}>
            <Input value={seo.ogImage} onChange={(e) => set({ ogImage: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fTwCard")}>
              <Select value={seo.twitterCard} onValueChange={(v) => set({ twitterCard: v ?? "summary_large_image" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">summary</SelectItem>
                  <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fTwImage")}>
              <Input value={seo.twitterImage} onChange={(e) => set({ twitterImage: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fTwTitle")}>
              <Input value={seo.twitterTitle} onChange={(e) => set({ twitterTitle: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fTwDesc")}>
              <Input value={seo.twitterDesc} onChange={(e) => set({ twitterDesc: e.target.value })} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title={t("seoPreview")}>
            <div className="border border-border bg-white p-4">
              <p className="truncate font-medium text-[#1a0d99]">{seo.metaTitle}</p>
              <p className="truncate font-mono text-xs text-green-700">{seo.canonical}</p>
              <p className="pt-1 text-xs text-muted-foreground">{seo.metaDesc || "Meta description will appear here."}</p>
            </div>
            <div className="border border-border bg-white p-4">
              <div className="h-24 bg-gradient-to-r from-primary/30 to-secondary/30" />
              <p className="pt-2 text-sm font-bold text-[#1a0d00]">{seo.ogTitle}</p>
              <p className="text-xs text-muted-foreground">{seo.ogDesc}</p>
              <p className="pt-1 font-mono text-[11px] text-muted-foreground">{seo.canonical}</p>
            </div>
          </SectionCard>
          <SectionCard title={`${t("seoScore")} · ${scorePct}%`}>
            <div className="h-2 w-full bg-muted">
              <div className={cn("h-full", scorePct >= 75 ? "bg-green-600" : scorePct >= 50 ? "bg-primary" : "bg-destructive")} style={{ width: `${scorePct}%` }} />
            </div>
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-semibold">{c.hint}</span>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5 bg-card" onClick={() => toast.success(t("toastSaved"))}>
          <Globe className="size-3.5" aria-hidden="true" />
          {t("preview")}
        </Button>
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>
    </div>
  );
}
