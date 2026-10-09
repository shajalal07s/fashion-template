"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MarketingStatusBadge } from "@/components/admin/marketing/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { Banner, BannerPosition, MktStatus } from "@/features/admin/marketing";
import { useMarketingStore, useMktBanners } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const POSITIONS: BannerPosition[] = ["hero", "secondary", "shop", "category", "flash", "campaign", "product", "store", "popup"];
const posKey = (p: BannerPosition) =>
  p === "hero" ? "posHero" : p === "secondary" ? "posSecondary" : p === "shop" ? "posShop" : p === "category" ? "posCategory" : p === "flash" ? "posFlash" : p === "campaign" ? "posCampaign" : p === "product" ? "posProduct" : p === "store" ? "posStore" : "posPopup";

export default function BannersPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const banners = useMktBanners();
  const store = useMarketingStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState("desktop");
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fSubtitle, setFSubtitle] = useState("");
  const [fCta, setFCta] = useState("Shop Now");
  const [fLink, setFLink] = useState("/");
  const [fPosition, setFPosition] = useState<BannerPosition>("hero");
  const [fDevice, setFDevice] = useState("Both");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banners;
    return banners.filter((b) => b.name.toLowerCase().includes(q) || b.title.toLowerCase().includes(q));
  }, [banners, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFTitle(""); setFSubtitle("");
    setFCta("Shop Now"); setFLink("/");
    setFPosition("hero"); setFDevice("Both");
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setFName(b.name); setFTitle(b.title); setFSubtitle(b.subtitle);
    setFCta(b.cta); setFLink(b.link);
    setFPosition(b.position); setFDevice(b.device);
    setFStart(b.start); setFEnd(b.end); setFStatus(b.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fTitle.trim()) return;
    if (editId) {
      store.patchBanner(editId, {
        name: fName.trim(), title: fTitle.trim(), subtitle: fSubtitle.trim(),
        cta: fCta.trim(), link: fLink.trim(), position: fPosition, device: fDevice,
        start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addBanner({
        id: `bn-${banners.length + 1}`,
        name: fName.trim(), title: fTitle.trim(), subtitle: fSubtitle.trim(),
        cta: fCta.trim(), link: fLink.trim(), position: fPosition, device: fDevice,
        image: "/images/Banner/banner2.png",
        start: fStart, end: fEnd, clicks: 0, impressions: 0, status: fStatus,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const previewOf = (b: Banner) => ({
    name: editId ? fName || b.name : b.name,
    title: dialogOpen ? fTitle || b.title : b.title,
    subtitle: dialogOpen ? fSubtitle || b.subtitle : b.subtitle,
    cta: dialogOpen ? fCta || b.cta : b.cta,
    image: b.image,
  });

  const renderPreview = (b: Banner, mobile: boolean) => {
    const p = previewOf(b);
    return (
      <div className={cn("overflow-hidden border border-border", mobile && "mx-auto max-w-64")}>
        <div className="relative h-36 w-full sm:h-44">
          <Image src={p.image} alt={p.title} fill sizes="(max-width: 640px) 256px, 512px" className="object-cover" />
          <div className="absolute inset-0 flex flex-col items-start justify-center gap-1 bg-gradient-to-r from-[#1a0d00]/85 via-[#1a0d00]/40 to-transparent p-4">
            <p className={cn("font-heading font-bold text-white", mobile ? "text-base" : "text-2xl")}>{p.title || "Banner Title"}</p>
            <p className="text-[11px] text-white/85 sm:text-xs">{p.subtitle || "Subtitle goes here"}</p>
            <span className="mt-1 bg-secondary px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
              {p.cta || "Shop Now"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const viewed = viewId ? (banners.find((b) => b.id === viewId) ?? null) : null;
  const analytics = analyticsId ? (banners.find((b) => b.id === analyticsId) ?? null) : null;
  const ctrOf = (b: Banner) => (b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0");

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("bnTitle")}
        subtitle={t("bnSubtitle", { count: filtered.length })}
        highlightLabel={t("tClicks")}
        highlightValue={num(banners.reduce((n, b) => n + b.clicks, 0))}
        highlightIcon={ImageIcon}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addBanner")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tBanner")}</TableHead>
                  <TableHead>{t("tPosition")}</TableHead>
                  <TableHead>{t("tDevice")}</TableHead>
                  <TableHead className="text-right">{t("tClicks")}</TableHead>
                  <TableHead className="text-right">{t("tImpressions")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="relative block h-9 w-14 shrink-0 overflow-hidden bg-muted">
                          <Image src={b.image} alt={b.title} fill sizes="56px" className="object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-40 truncate text-sm font-semibold" title={b.title}>{b.title}</span>
                          <span className="block text-xs text-muted-foreground">{b.start} → {b.end}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{t(posKey(b.position))}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{b.device}</TableCell>
                    <TableCell className="text-right text-sm font-bold">{num(b.clicks)}</TableCell>
                    <TableCell className="text-right text-sm">{num(b.impressions)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setViewId(b.id); setPreviewTab("desktop"); }} aria-label={`${t("bnPreview")} ${b.name}`} title={t("bnPreview")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setAnalyticsId(b.id)} aria-label={`${t("bnAnalytics")} ${b.name}`} title={t("bnAnalytics")}>
                          <BarChart3 className="size-4 text-secondary" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(b)} aria-label={`${t("editTitle")} ${b.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {b.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchBanner(b.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={b.name} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchBanner(b.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={b.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeBanners([b.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={b.name}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={ImageIcon} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground">{safePage + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-xl">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("bnPreview")} · {viewed.name}
                </DialogTitle>
              </DialogHeader>
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList>
                  <TabsTrigger value="desktop">{t("tabDesktop")}</TabsTrigger>
                  <TabsTrigger value="mobile">{t("tabMobile")}</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="pt-2">{renderPreview(viewed, false)}</TabsContent>
                <TabsContent value="mobile" className="pt-2">{renderPreview(viewed, true)}</TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!analytics} onOpenChange={(open) => !open && setAnalyticsId(null)}>
        <DialogContent className="sm:max-w-md">
          {analytics ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("bnAnalytics")} · {analytics.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: t("tImpressions"), v: num(analytics.impressions) },
                  { l: t("tClicks"), v: num(analytics.clicks) },
                  { l: t("ctr"), v: `${ctrOf(analytics)}%` },
                ].map((s) => (
                  <div key={s.l} className="border border-border bg-card px-2 py-3">
                    <p className="font-heading text-base font-bold text-secondary">{s.v}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setAnalyticsId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addBanner")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("bnForm")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fBannerName")}>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Eid Hero" />
              </Field>
              <Field label={t("fPosition")}>
                <Select value={fPosition} onValueChange={(v) => setFPosition((v as BannerPosition) ?? "hero")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{t(posKey(p))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fTitle2")}>
                <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="bg-card" placeholder="Eid Collection 2026" />
              </Field>
              <Field label={t("fSubtitle2")}>
                <Input value={fSubtitle} onChange={(e) => setFSubtitle(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fCta")}>
                <Input value={fCta} onChange={(e) => setFCta(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fCtaLink")}>
                <Input value={fLink} onChange={(e) => setFLink(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tDevice")}>
                <Select value={fDevice} onValueChange={(v) => setFDevice(v ?? "Both")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Both", "Desktop", "Mobile"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fStatus")}>
                <Select value={fStatus} onValueChange={(v) => setFStatus((v as MktStatus) ?? "draft")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["draft", "scheduled", "active", "paused", "expired"] as MktStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fStartDate")}>
                <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fEndDate")}>
                <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("bnPreview")}>
            {renderPreview(
              {
                id: "preview", name: fName, title: fTitle, subtitle: fSubtitle, cta: fCta,
                link: fLink, position: fPosition, device: fDevice, image: "/images/Banner/banner2.png",
                start: fStart, end: fEnd, clicks: 0, impressions: 0, status: fStatus,
              },
              false
            )}
          </SectionCard>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
