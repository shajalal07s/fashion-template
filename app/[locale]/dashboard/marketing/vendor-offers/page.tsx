"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Store,
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
import type { MktStatus, VendorOffer } from "@/features/admin/marketing";
import { useMarketingStore, useMktVendorOffers } from "@/store/marketing.store";
import { toast } from "sonner";

const TYPES = ["Percentage", "Fixed", "BOGO", "Free Shipping"];

export default function VendorOffersPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const offers = useMktVendorOffers();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fVendor, setFVendor] = useState("");
  const [fStore, setFStore] = useState("");
  const [fOffer, setFOffer] = useState("");
  const [fType, setFType] = useState(TYPES[0]);
  const [fDiscount, setFDiscount] = useState("10%");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => o.vendor.toLowerCase().includes(q) || o.store.toLowerCase().includes(q) || o.offer.toLowerCase().includes(q));
  }, [offers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const openAdd = () => {
    setEditId(null);
    setFVendor(""); setFStore(""); setFOffer("");
    setFType(TYPES[0]); setFDiscount("10%");
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (o: VendorOffer) => {
    setEditId(o.id);
    setFVendor(o.vendor); setFStore(o.store); setFOffer(o.offer);
    setFType(o.type); setFDiscount(o.discount);
    setFStart(o.start); setFEnd(o.end); setFStatus(o.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fVendor.trim() || !fOffer.trim()) return;
    if (editId) {
      store.patchVendorOffer(editId, { vendor: fVendor.trim(), store: fStore.trim(), offer: fOffer.trim(), type: fType, discount: fDiscount, start: fStart, end: fEnd, status: fStatus });
      toast.success(t("toastUpdated"));
    } else {
      store.addVendorOffer({
        id: `vo-${offers.length + 1}`,
        vendor: fVendor.trim(), store: fStore.trim() || "—", offer: fOffer.trim(),
        type: fType, discount: fDiscount, products: 0, orders: 0, revenue: 0,
        start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (offers.find((o) => o.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("voTitle")}
        subtitle={t("voSubtitle", { count: filtered.length })}
        highlightLabel={t("tRevenue")}
        highlightValue={money(offers.reduce((n, o) => n + o.revenue, 0))}
        highlightIcon={Store}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addVendorOffer")}
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
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead>{t("tOffer")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tDiscount")}</TableHead>
                  <TableHead className="text-right">{t("tProducts")}</TableHead>
                  <TableHead className="text-right">{t("tOrders")}</TableHead>
                  <TableHead className="text-right">{t("tRevenue")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{o.vendor}</p>
                      <p className="text-xs text-muted-foreground">{o.store}</p>
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm" title={o.offer}>{o.offer}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{o.type}</TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">{o.discount}</TableCell>
                    <TableCell className="text-right text-sm">{num(o.products)}</TableCell>
                    <TableCell className="text-right text-sm">{num(o.orders)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(o.revenue)}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(o.id)} aria-label={`${t("viewTitle")} ${o.offer}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)} aria-label={`${t("editTitle")} ${o.offer}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {o.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchVendorOffer(o.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={o.offer} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchVendorOffer(o.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={o.offer} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeVendorOffers([o.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={o.offer}>
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
              <EmptyState icon={Store} title={t("emptyTitle")} description={t("emptyDescription")} />
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
                <DialogTitle className="font-heading text-base font-bold">{viewed.offer}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <SectionCard title={t("voVendor")}>
                  <DetailKV label={t("tStore")} value={viewed.store} />
                  <DetailKV label={t("tVendor")} value={viewed.vendor} />
                  <DetailKV label={t("tStatus")} value={viewed.status} />
                </SectionCard>
                <SectionCard title={t("voOffer")}>
                  <DetailKV label={t("tDiscount")} value={viewed.discount} />
                  <DetailKV label={t("tProducts")} value={num(viewed.products)} />
                  <DetailKV label={t("tOrders")} value={num(viewed.orders)} />
                  <DetailKV label={t("tRevenue")} value={money(viewed.revenue)} />
                </SectionCard>
              </div>
              <SectionCard title={t("voPerf")}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: t("tOrders"), v: num(viewed.orders) },
                    { l: t("tRevenue"), v: money(viewed.revenue) },
                    { l: t("tDiscount"), v: viewed.discount },
                  ].map((s) => (
                    <div key={s.l} className="border border-border bg-card px-2 py-3">
                      <p className="font-heading text-base font-bold text-secondary">{s.v}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
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
              {editId ? t("editTitle") : t("addVendorOffer")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("voVendor")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tVendor")}>
                <Input value={fVendor} onChange={(e) => setFVendor(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tStore")}>
                <Input value={fStore} onChange={(e) => setFStore(e.target.value)} className="bg-card" />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("voOffer")}>
            <Field label={t("tOffer")}>
              <Input value={fOffer} onChange={(e) => setFOffer(e.target.value)} className="bg-card" />
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
                <Input value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className="bg-card" />
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

function DetailKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
