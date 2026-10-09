"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Copy,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { CmsStatusBadge } from "@/components/admin/cms/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { BANNER_POSITIONS, type CmsBanner, type CmsStatus } from "@/features/admin/cms";
import { useCmsBanners, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CmsBannersPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const banners = useCmsBanners();
  const store = useCmsStore();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState("desktop");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fPosition, setFPosition] = useState(BANNER_POSITIONS[0]);
  const [fTitle, setFTitle] = useState("");
  const [fSubtitle, setFSubtitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCta, setFCta] = useState("Shop Now");
  const [fUrl, setFUrl] = useState("/");
  const [fNewTab, setFNewTab] = useState(false);
  const [fDevice, setFDevice] = useState("Both");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fOrder, setFOrder] = useState(1);
  const [fStatus, setFStatus] = useState<CmsStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banners;
    return banners.filter((b) => b.name.toLowerCase().includes(q) || b.title.toLowerCase().includes(q));
  }, [banners, query]);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => banners.some((b) => b.id === id)),
    [selected, banners]
  );

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFPosition(BANNER_POSITIONS[0]);
    setFTitle(""); setFSubtitle(""); setFDesc("");
    setFCta("Shop Now"); setFUrl("/"); setFNewTab(false);
    setFDevice("Both"); setFStart("2026-09-26"); setFEnd("2026-10-26");
    setFOrder(banners.length + 1); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (b: CmsBanner) => {
    setEditId(b.id);
    setFName(b.name); setFPosition(b.position);
    setFTitle(b.title); setFSubtitle(b.subtitle); setFDesc(b.description);
    setFCta(b.cta); setFUrl(b.url); setFNewTab(b.newTab);
    setFDevice(b.device); setFStart(b.start); setFEnd(b.end);
    setFOrder(b.order); setFStatus(b.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fTitle.trim()) return;
    if (editId) {
      store.patchBanner(editId, {
        name: fName.trim(), position: fPosition, title: fTitle.trim(), subtitle: fSubtitle.trim(),
        description: fDesc.trim(), cta: fCta.trim(), url: fUrl.trim(), newTab: fNewTab,
        device: fDevice, start: fStart, end: fEnd, order: fOrder, status: fStatus,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addBanner({
        id: `cb-${banners.length + 1}`,
        name: fName.trim(), position: fPosition, title: fTitle.trim(), subtitle: fSubtitle.trim(),
        description: fDesc.trim(), cta: fCta.trim(), url: fUrl.trim(), newTab: fNewTab,
        device: fDevice, image: "/images/Banner/banner2.png",
        start: fStart, end: fEnd, order: fOrder, status: fStatus,
        clicks: 0, views: 0, updated: "2026-09-26",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const renderPreview = (b: CmsBanner, mode: "desktop" | "tablet" | "mobile") => (
    <div className={cn("overflow-hidden border border-border", mode === "mobile" && "mx-auto max-w-64", mode === "tablet" && "mx-auto max-w-md")}>
      <div className={cn("relative w-full", mode === "mobile" ? "h-36" : mode === "tablet" ? "h-40" : "h-44")}>
        <Image src={b.image} alt={b.title} fill sizes="512px" className="object-cover" />
        <div className="absolute inset-0 flex flex-col items-start justify-center gap-1 bg-gradient-to-r from-[#1a0d00]/85 via-[#1a0d00]/40 to-transparent p-4">
          <p className={cn("font-heading font-bold text-white", mode === "mobile" ? "text-base" : "text-2xl")}>{b.title}</p>
          <p className="text-[11px] text-white/85">{b.subtitle}</p>
          <span className="mt-1 bg-secondary px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">{b.cta}</span>
        </div>
      </div>
    </div>
  );

  const viewed = viewId ? (banners.find((b) => b.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("bnTitle")}
        subtitle={t("bnSubtitle", { count: filtered.length })}
        highlightLabel={t("sActiveBanners")}
        highlightValue={String(banners.filter((b) => b.status === "active").length)}
        highlightIcon={ImageIcon}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addBanner")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removeBanners(activeSelected);
                setSelected(new Set());
                toast.success(t("toastDeleted", { count: activeSelected.length }));
              }}>
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((b) => selected.has(b.id))}
                      indeterminate={filtered.some((b) => selected.has(b.id)) && !filtered.every((b) => selected.has(b.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const b of filtered) {
                            if (v === true) next.add(b.id);
                            else next.delete(b.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("bnTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tBanner")}</TableHead>
                  <TableHead>{t("tPosition")}</TableHead>
                  <TableHead>{t("tDevice")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="text-right">{t("tClicks")}</TableHead>
                  <TableHead className="text-right">{t("tViews")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id} className={cn(selected.has(b.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(b.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(b.id);
                        else next.delete(b.id);
                        return next;
                      })} aria-label={b.name} />
                    </TableCell>
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
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{b.position}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{b.device}</TableCell>
                    <TableCell>
                      <CmsStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold">{b.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{b.views.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setViewId(b.id); setPreviewTab("desktop"); }} aria-label={`${t("bnPreview")} ${b.name}`} title={t("bnPreview")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(b)} aria-label={`${t("editTitle")} ${b.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.addBanner({ ...b, id: `cb-${banners.length + 1}`, name: `${b.name} (Copy)`, status: "draft", clicks: 0, views: 0 });
                          toast.success(t("duplicate"));
                        }} aria-label={b.name} title={t("duplicate")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        {b.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchBanner(b.id, { status: "inactive" }); toast.success(t("toastUpdated")); }} aria-label={b.name} title={b.name}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchBanner(b.id, { status: "active" }); toast.success(t("toastUpdated")); }} aria-label={b.name} title={b.name}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(b.id)} aria-label={b.name}>
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
              <EmptyState icon={ImageIcon} title={t("emptyTitle")} description={t("emptyBanners")} />
            </div>
          )}
        </CardContent>
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
                  <TabsTrigger value="tablet">{t("tabTablet")}</TabsTrigger>
                  <TabsTrigger value="mobile">{t("tabMobile")}</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="pt-2">{renderPreview(viewed, "desktop")}</TabsContent>
                <TabsContent value="tablet" className="pt-2">{renderPreview(viewed, "tablet")}</TabsContent>
                <TabsContent value="mobile" className="pt-2">{renderPreview(viewed, "mobile")}</TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
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
          <SectionCard title={t("fBannerName")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fBannerName")}>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Eid Hero" />
              </Field>
              <Field label={t("tPosition")}>
                <Select value={fPosition} onValueChange={(v) => setFPosition(v ?? BANNER_POSITIONS[0])}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANNER_POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fTitle2")}>
                <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fSubtitle2")}>
                <Input value={fSubtitle} onChange={(e) => setFSubtitle(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fDesc")}>
                <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tDevice")}>
                <Select value={fDevice} onValueChange={(v) => setFDevice(v ?? "Both")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Both", "Desktop", "Tablet", "Mobile"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fCta")}>
                <Input value={fCta} onChange={(e) => setFCta(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fCtaUrl")}>
                <Input value={fUrl} onChange={(e) => setFUrl(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fNewTab")}>
                <Select value={fNewTab ? "yes" : "no"} onValueChange={(v) => setFNewTab(v === "yes")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fStatus")}>
                <Select value={fStatus} onValueChange={(v) => setFStatus((v as CmsStatus) ?? "draft")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["active", "inactive", "scheduled", "expired", "draft"] as CmsStatus[]).map((s) => (
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
            <Field label={t("fSortOrder")}>
              <Input type="number" min={1} value={fOrder} onChange={(e) => setFOrder(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
            </Field>
          </SectionCard>
          <SectionCard title={t("bnPreview")}>
            {renderPreview(
              { id: "preview", name: fName, position: fPosition, title: fTitle, subtitle: fSubtitle, description: fDesc, image: "/images/Banner/banner2.png", cta: fCta, url: fUrl, newTab: fNewTab, device: fDevice, start: fStart, end: fEnd, order: fOrder, status: fStatus, clicks: 0, views: 0, updated: "" },
              "desktop"
            )}
          </SectionCard>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirmId) store.removeBanners([confirmId]);
              setConfirmId(null);
              toast.success(t("toastDeleted", { count: 1 }));
            }}>
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
