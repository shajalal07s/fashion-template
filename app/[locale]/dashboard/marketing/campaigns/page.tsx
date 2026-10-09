"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Megaphone,
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
import { CommissionTimeline } from "@/components/admin/commission/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { Campaign, MktStatus } from "@/features/admin/marketing";
import { useMarketingStore, useMktCampaigns } from "@/store/marketing.store";
import { toast } from "sonner";

const TYPES = ["Seasonal", "Holiday", "Product Launch", "Vendor", "Clearance", "Flash", "Custom"];

export default function CampaignsPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const campaigns = useMktCampaigns();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState(TYPES[0]);
  const [fBudget, setFBudget] = useState(100000);
  const [fDiscount, setFDiscount] = useState("10%");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFType(TYPES[0]);
    setFBudget(100000); setFDiscount("10%");
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditId(c.id);
    setFName(c.name); setFType(c.type);
    setFBudget(c.budget); setFDiscount(`${c.discount > 0 ? Math.round((c.discount / Math.max(1, c.revenue)) * 100) : 10}%`);
    setFStart(c.start); setFEnd(c.end); setFStatus(c.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchCampaign(editId, { name: fName.trim(), type: fType, budget: fBudget, start: fStart, end: fEnd, status: fStatus });
      toast.success(t("toastUpdated"));
    } else {
      store.addCampaign({
        id: `cp-${campaigns.length + 1}`,
        name: fName.trim(), type: fType, products: 0, vendors: 0,
        budget: fBudget, revenue: 0, orders: 0, discount: 0, conversion: 0,
        impressions: 0, clicks: 0, start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (campaigns.find((c) => c.id === viewId) ?? null) : null;
  const perfTiles = (c: Campaign) => [
    { l: t("perfImpressions"), v: num(c.impressions) },
    { l: t("perfClicks"), v: num(c.clicks) },
    { l: t("perfOrders"), v: num(c.orders) },
    { l: t("perfRevenue"), v: money(c.revenue) },
    { l: t("perfDiscount"), v: money(c.discount) },
    { l: t("perfConversion"), v: `${c.conversion}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("cpTitle")}
        subtitle={t("cpSubtitle", { count: filtered.length })}
        highlightLabel={t("tRevenue")}
        highlightValue={money(campaigns.reduce((n, c) => n + c.revenue, 0))}
        highlightIcon={Megaphone}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addCampaign")}
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
                  <TableHead>{t("tCampaign")}</TableHead>
                  <TableHead>{t("cpType")}</TableHead>
                  <TableHead className="text-right">{t("tBudget")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tConversion")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm font-semibold" title={c.name}>{c.name}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{c.start} → {c.end}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{c.type}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(c.budget)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(c.revenue)}</TableCell>
                    <TableCell className="text-right text-sm">{num(c.orders)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{c.conversion}%</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setViewId(c.id); setTab("overview"); }} aria-label={`${t("viewTitle")} ${c.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`${t("editTitle")} ${c.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {c.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchCampaign(c.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={c.name} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchCampaign(c.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={c.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeCampaigns([c.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={c.name}>
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
              <EmptyState icon={Megaphone} title={t("emptyTitle")} description={t("emptyCampaigns")} />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
                  {viewed.name}
                  <MarketingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="flex w-full flex-wrap">
                  <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
                  <TabsTrigger value="products">{t("tabProducts")}</TabsTrigger>
                  <TabsTrigger value="vendors">{t("tabVendors")}</TabsTrigger>
                  <TabsTrigger value="performance">{t("tabPerformance")}</TabsTrigger>
                  <TabsTrigger value="timeline">{t("tabTimeline")}</TabsTrigger>
                  <TabsTrigger value="activity">{t("tabActivity")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="grid grid-cols-2 gap-x-6 gap-y-1 pt-2 text-sm">
                  <DetailKV label={t("cpType")} value={viewed.type} />
                  <DetailKV label={t("tBudget")} value={money(viewed.budget)} />
                  <DetailKV label={t("fStartDate")} value={viewed.start} />
                  <DetailKV label={t("fEndDate")} value={viewed.end} />
                  <DetailKV label={t("tabProducts")} value={num(viewed.products)} />
                  <DetailKV label={t("tabVendors")} value={num(viewed.vendors)} />
                </TabsContent>
                <TabsContent value="products" className="pt-2 text-sm text-muted-foreground">
                  {num(viewed.products)} {t("tProducts")} · {t("cpTarget")}: {viewed.type}
                </TabsContent>
                <TabsContent value="vendors" className="pt-2 text-sm text-muted-foreground">
                  {num(viewed.vendors)} {t("tabVendors")} {t("cpTarget")}
                </TabsContent>
                <TabsContent value="performance" className="pt-2">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {perfTiles(viewed).map((p) => (
                      <div key={p.l} className="border border-border bg-card px-3 py-2.5 text-center">
                        <p className="font-heading text-base font-bold text-secondary">{p.v}</p>
                        <p className="text-[11px] font-semibold text-muted-foreground">{p.l}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="timeline" className="pt-2">
                  <CommissionTimeline
                    events={[
                      { event: `${viewed.name} created`, date: viewed.start, time: "09:00 AM", user: "Admin", description: "Campaign drafted and scheduled." },
                      { event: "Campaign launched", date: viewed.start, time: "12:00 AM", user: "System", description: "Campaign went live across storefront." },
                      { event: "Mid-flight review", date: viewed.end, time: "03:00 PM", user: "Admin", description: "Performance reviewed, budget adjusted." },
                    ]}
                  />
                </TabsContent>
                <TabsContent value="activity" className="pt-2 text-sm text-muted-foreground">
                  {t("recentActivity")} · {viewed.name}
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addCampaign")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("cpInfo")}>
            <Field label={t("cpName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Eid Mega Campaign" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("cpType")}>
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
              <Field label={t("fStatus")}>
                <Select value={fStatus} onValueChange={(v) => setFStatus((v as MktStatus) ?? "draft")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["draft", "scheduled", "active", "paused", "completed"] as MktStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tBudget")}>
                <Input type="number" min={0} value={fBudget} onChange={(e) => setFBudget(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("tDiscount")}>
                <Input value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className="bg-card" placeholder="10%" />
              </Field>
              <Field label={t("fStartDate")}>
                <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fEndDate")}>
                <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
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

function DetailKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
