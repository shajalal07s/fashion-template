"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Gift,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import type { MktStatus, Promotion } from "@/features/admin/marketing";
import { useMarketingStore, useMktPromotions } from "@/store/marketing.store";
import { toast } from "sonner";

const TYPES = ["Percentage", "Fixed", "Free Shipping", "Buy X Get Y", "Bundle", "Limited Time", "New Customer", "Returning"];

export default function PromotionsPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const promotions = useMktPromotions();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState("desktop");
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState(TYPES[0]);
  const [fDiscount, setFDiscount] = useState("20%");
  const [fTarget, setFTarget] = useState("Selected Products");
  const [fLimit, setFLimit] = useState(1000);
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return promotions;
    return promotions.filter((p) => p.name.toLowerCase().includes(q));
  }, [promotions, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFType(TYPES[0]); setFDiscount("20%");
    setFTarget("Selected Products"); setFLimit(1000);
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditId(p.id);
    setFName(p.name); setFType(p.type); setFDiscount(p.discount);
    setFTarget(p.target); setFLimit(p.limit);
    setFStart(p.start); setFEnd(p.end); setFStatus(p.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchPromotion(editId, { name: fName.trim(), type: fType, discount: fDiscount, target: fTarget, limit: fLimit, start: fStart, end: fEnd, status: fStatus });
      toast.success(t("toastUpdated"));
    } else {
      store.addPromotion({
        id: `pm-${promotions.length + 1}`,
        name: fName.trim(), type: fType, discount: fDiscount, target: fTarget,
        orders: 0, revenue: 0, used: 0, limit: fLimit, start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (promotions.find((p) => p.id === viewId) ?? null) : null;

  const storefront = (p: Promotion, mobile: boolean) => (
    <div className={`flex flex-col items-center gap-2 overflow-hidden bg-gradient-to-br from-[#1a0d00] via-[#b35400] to-secondary text-center text-white ${mobile ? "mx-auto max-w-64 px-4 py-6" : "px-8 py-10"}`}>
      <p className="text-[10px] font-bold tracking-[0.25em] text-white/80 uppercase">{t("limitedOffer")}</p>
      <p className={`font-heading font-bold ${mobile ? "text-2xl" : "text-4xl"}`}>{p.discount} OFF</p>
      <p className="text-xs text-white/85 sm:text-sm">{p.name}</p>
      <p className="text-[11px] text-white/70">{p.target}</p>
      <span className="mt-1 bg-white px-5 py-2 text-xs font-bold tracking-widest text-[#1a0d00] uppercase">
        {t("shopNow")}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("pmTitle")}
        subtitle={t("pmSubtitle", { count: filtered.length })}
        highlightLabel={t("tRevenue")}
        highlightValue={money(promotions.reduce((n, p) => n + p.revenue, 0))}
        highlightIcon={Gift}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addPromo")}
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
                  <TableHead>{t("tPromo")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tDiscount")}</TableHead>
                  <TableHead>{t("tTarget")}</TableHead>
                  <TableHead className="text-right">{t("tUsage")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm font-semibold" title={p.name}>{p.name}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{p.start} → {p.end}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.type}</TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">{p.discount}</TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground" title={p.target}>{p.target}</TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs font-semibold whitespace-nowrap">{num(p.used)} / {num(p.limit)}</p>
                      <div className="mt-1 ml-auto h-1.5 w-24 bg-muted">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, Math.round((p.used / Math.max(1, p.limit)) * 100))}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(p.revenue)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setViewId(p.id); setPreviewTab("desktop"); }} aria-label={`${t("viewTitle")} ${p.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label={`${t("editTitle")} ${p.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {p.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPromotion(p.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={p.name} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPromotion(p.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={p.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removePromotions([p.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={p.name}>
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
              <EmptyState icon={Gift} title={t("emptyTitle")} description={t("emptyDescription")} />
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
        <DialogContent className="sm:max-w-lg">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("pmPreview")} · {viewed.name}
                </DialogTitle>
              </DialogHeader>
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList>
                  <TabsTrigger value="desktop">{t("tabDesktop")}</TabsTrigger>
                  <TabsTrigger value="mobile">{t("tabMobile")}</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="pt-2">{storefront(viewed, false)}</TabsContent>
                <TabsContent value="mobile" className="pt-2">{storefront(viewed, true)}</TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addPromo")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("tPromo")}>
            <Field label={t("tPromo")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Weekend 20% Off" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tType")}>
                <Select value={fType} onValueChange={(v) => setFType(v ?? TYPES[0])}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>{ty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tDiscount")}>
                <Input value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className="bg-card" placeholder="20%" />
              </Field>
              <Field label={t("tTarget")}>
                <Input value={fTarget} onChange={(e) => setFTarget(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tLimit")}>
                <Input type="number" min={1} value={fLimit} onChange={(e) => setFLimit(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <Field label={t("fStartDate")}>
                <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fEndDate")}>
                <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
            <Field label={t("fStatus")}>
              <Select value={fStatus} onValueChange={(v) => setFStatus((v as MktStatus) ?? "draft")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["draft", "scheduled", "active", "paused"] as MktStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
