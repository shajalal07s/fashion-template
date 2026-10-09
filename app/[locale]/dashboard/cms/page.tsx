"use client";

import { useTranslations } from "next-intl";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageCircleQuestion,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CommissionTimeline } from "@/components/admin/commission/shared";
import {
  useCmsActivity,
  useCmsBanners,
  useCmsFaqs,
  useCmsMedia,
  useCmsPages,
  useCmsPosts,
} from "@/store/cms.store";
import { ArrowRight } from "lucide-react";

function Mini({ label, value, delta, icon: Icon, tile, href }: { label: string; value: string; delta?: string; icon: LucideIcon; tile: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden border-border bg-card py-0 transition-colors hover:border-secondary">
        <CardContent className="flex items-center gap-3 p-4">
          <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
            <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
            {delta ? <span className="truncate text-[11px] text-muted-foreground">{delta}</span> : null}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CmsOverviewPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const pages = useCmsPages();
  const posts = useCmsPosts();
  const banners = useCmsBanners();
  const faqs = useCmsFaqs();
  const media = useCmsMedia();
  const activity = useCmsActivity();

  const cards = [
    { label: t("sPages"), value: String(pages.length), delta: "+4 this month", icon: FileText, tile: "bg-secondary/15 text-secondary", href: "/dashboard/cms/pages" },
    { label: t("sPublishedPages"), value: String(pages.filter((p) => p.status === "published").length), icon: FileText, tile: "bg-green-600/10 text-green-700", href: "/dashboard/cms/pages" },
    { label: t("sDraftPages"), value: String(pages.filter((p) => p.status === "draft").length), icon: FileText, tile: "bg-muted text-muted-foreground", href: "/dashboard/cms/pages" },
    { label: t("sPosts"), value: String(posts.length), icon: Newspaper, tile: "bg-secondary/15 text-secondary", href: "/dashboard/cms/blog" },
    { label: t("sPublishedPosts"), value: String(posts.filter((p) => p.status === "published").length), delta: "+12 this month", icon: Newspaper, tile: "bg-green-600/10 text-green-700", href: "/dashboard/cms/blog" },
    { label: t("sScheduledPosts"), value: String(posts.filter((p) => p.status === "scheduled").length), icon: Newspaper, tile: "bg-primary/20 text-[#8a5a00]", href: "/dashboard/cms/blog" },
    { label: t("sBanners"), value: String(banners.length), icon: ImageIcon, tile: "bg-primary/15 text-secondary", href: "/dashboard/cms/banners" },
    { label: t("sActiveBanners"), value: String(banners.filter((b) => b.status === "active").length), delta: "2 scheduled", icon: Megaphone, tile: "bg-green-600/10 text-green-700", href: "/dashboard/cms/banners" },
    { label: t("sFaqs"), value: String(faqs.length), icon: MessageCircleQuestion, tile: "bg-secondary/15 text-secondary", href: "/dashboard/cms/faq" },
    { label: t("sMedia"), value: String(media.length), icon: LayoutGrid, tile: "bg-primary/15 text-secondary", href: "/dashboard/cms/media" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("sPages")}
        highlightValue={String(pages.length)}
        highlightIcon={Globe}
      >
        <Link href="/dashboard/cms/homepage" className={heroPillClassName}>{t("hTitle")}</Link>
        <Link href="/dashboard/cms/blog" className={heroPillClassName}>{t("bpTitle")}</Link>
        <Link href="/dashboard/cms/media" className={heroPillClassName}>{t("mdTitle")}</Link>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Mini key={c.label} {...c} />
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("recentActivity")}</CardTitle>
          <Link href="/dashboard/cms/homepage">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card">
              {t("viewTitle")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <CommissionTimeline
            events={activity.map((a) => ({
              event: a.event,
              date: a.date,
              time: a.time,
              user: a.user,
              description: a.description,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
