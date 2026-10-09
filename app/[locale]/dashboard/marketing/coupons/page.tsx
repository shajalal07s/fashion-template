"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
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
import { couponValueLabel, type CouponKind, type MktCoupon, type MktStatus } from "@/features/admin/marketing";
import { useMarketingStore, useMktCoupons } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const KINDS: CouponKind[] = ["percentage", "fixed", "shipping", "bogo"];

function SummaryMini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <TicketPercent className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function MarketingCouponsPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const coupons = useMktCoupons();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MktStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [fName, setFName] = useState("");
  const [fCode, setFCode] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fKind, setFKind] = useState<CouponKind>("percentage");
  const [fValue, setFValue] = useState(10);
  const [fMax, setFMax] = useState(500);
  const [fMin, setFMin] = useState(1000);
  const [fLimit, setFLimit] = useState(1000);
  const [fPer, setFPer] = useState(1);
  const [fScope, setFScope] = useState("All Products");
  const [fAudience, setFAudience] = useState("All Customers");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter(
      (c) =>
        (statusFilter === "all" || c.status === statusFilter) &&
        (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    );
  }, [coupons, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => coupons.some((c) => c.id === id)),
    [selected, coupons]
  );

  const byStatus = (s: MktStatus) => coupons.filter((c) => c.status === s).length;
  const stats = [
    { label: t("sCoupons"), value: num(coupons.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sActiveCoupons"), value: num(byStatus("active")), tile: "bg-green-600/10 text-green-700" },
    { label: t("sExpired"), value: num(byStatus("expired")), tile: "bg-muted text-muted-foreground" },
    { label: t("sScheduled"), value: num(byStatus("scheduled")), tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("sUsage"), value: num(coupons.reduce((n, c) => n + c.used, 0)), tile: "bg-secondary/15 text-secondary" },
    { label: t("sDiscount"), value: money(coupons.reduce((n, c) => n + c.used * Math.min(c.value || 60, 120), 0)), tile: "bg-primary/15 text-secondary" },
  ];

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFCode(""); setFDesc("");
    setFKind("percentage"); setFValue(10); setFMax(500); setFMin(1000);
    setFLimit(1000); setFPer(1);
    setFScope("All Products"); setFAudience("All Customers");
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (c: MktCoupon) => {
    setEditId(c.id);
    setFName(c.name); setFCode(c.code); setFDesc(c.description);
    setFKind(c.kind); setFValue(c.value); setFMax(c.maxDiscount); setFMin(c.minSpend);
    setFLimit(c.limit); setFPer(c.perCustomer);
    setFScope(c.scope); setFAudience(c.audience);
    setFStart(c.start); setFEnd(c.end); setFStatus(c.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim() || !fCode.trim()) return;
    if (editId) {
      store.patchCoupon(editId, {
        name: fName.trim(), code: fCode.trim().toUpperCase(), description: fDesc.trim(),
        kind: fKind, value: fValue, maxDiscount: fMax, minSpend: fMin,
        limit: fLimit, perCustomer: fPer, scope: fScope, audience: fAudience,
        start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addCoupon({
        id: `mc-${Date.now()}`,
        name: fName.trim(), code: fCode.trim().toUpperCase(), description: fDesc.trim(),
        kind: fKind, value: fValue, maxDiscount: fMax, minSpend: fMin,
        limit: fLimit, perCustomer: fPer, used: 0, scope: fScope, audience: fAudience,
        start: fStart, end: fEnd, status: fStatus,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const handleDuplicate = (c: MktCoupon) => {
    store.addCoupon({ ...c, id: `mc-${Date.now()}`, code: `${c.code}-COPY`, name: `${c.name} (Copy)`, used: 0, status: "draft" });
    toast.success(t("duplicate"));
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  const viewed = viewId ? (coupons.find((c) => c.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("cTitle")}
        subtitle={t("cSubtitle", { count: filtered.length })}
        highlightLabel={t("sUsage")}
        highlightValue={num(coupons.reduce((n, c) => n + c.used, 0))}
        highlightIcon={TicketPercent}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addCoupon")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <SummaryMini key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as MktStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {(["active", "scheduled", "paused", "expired", "disabled", "draft"] as MktStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{activeSelected.length}</p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => { store.removeCoupons(activeSelected); setSelected(new Set()); toast.success(t("toastDeleted", { count: activeSelected.length })); }}>
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={visible.length > 0 && visible.every((c) => selected.has(c.id))}
                      indeterminate={visible.some((c) => selected.has(c.id)) && !visible.every((c) => selected.has(c.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const c of visible) {
                            if (v === true) next.add(c.id);
                            else next.delete(c.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("cTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCode")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tValue")}</TableHead>
                  <TableHead className="text-right">{t("tUsage")}</TableHead>
                  <TableHead className="text-right">{t("tMinSpend")}</TableHead>
                  <TableHead>{t("tExpiry")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className={cn(selected.has(c.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(c.id);
                        else next.delete(c.id);
                        return next;
                      })} aria-label={c.code} />
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-bold tracking-widest whitespace-nowrap">{c.code}</p>
                      <p className="max-w-36 truncate text-xs text-muted-foreground" title={c.name}>{c.name}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`kind${c.kind[0].toUpperCase()}${c.kind.slice(1)}` as "kindPercentage")}
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">{couponValueLabel(c)}</TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs font-semibold whitespace-nowrap">{num(c.used)} / {num(c.limit)}</p>
                      <div className="mt-1 h-1.5 w-24 bg-muted">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, Math.round((c.used / Math.max(1, c.limit)) * 100))}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{c.minSpend > 0 ? money(c.minSpend) : "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{c.start} → {c.end}</TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(c.id)} aria-label={`${t("viewTitle")} ${c.code}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`${t("editTitle")} ${c.code}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {c.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchCoupon(c.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={c.code} title={t("pause")}>
                            <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchCoupon(c.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={c.code} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(c.id)} aria-label={c.code}>
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
              <EmptyState icon={TicketPercent} title={t("emptyTitle")} description={t("emptyCoupons")} />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addCoupon")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("basicInfo")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fCouponName")}>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Mega Save 20" />
              </Field>
              <Field label={t("fCouponCode")}>
                <Input value={fCode} onChange={(e) => setFCode(e.target.value.toUpperCase())} className="bg-card font-mono" placeholder="SAVE20" />
              </Field>
            </div>
            <Field label={t("fDescription")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fStatus")}>
              <Select value={fStatus} onValueChange={(v) => setFStatus((v as MktStatus) ?? "draft")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["draft", "scheduled", "active", "paused", "disabled"] as MktStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </SectionCard>
          <SectionCard title={t("discountSec")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fDiscountType")}>
                <Select value={fKind} onValueChange={(v) => setFKind((v as CouponKind) ?? "percentage")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{t(`kind${k[0].toUpperCase()}${k.slice(1)}` as "kindPercentage")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fDiscountValue")}>
                <Input type="number" min={0} value={fValue} onChange={(e) => setFValue(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={fKind === "shipping"} />
              </Field>
              <Field label={t("fMaxDiscount")}>
                <Input type="number" min={0} value={fMax} onChange={(e) => setFMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fMinSpend")}>
                <Input type="number" min={0} value={fMin} onChange={(e) => setFMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("usageSec")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fLimit")}>
                <Input type="number" min={1} value={fLimit} onChange={(e) => setFLimit(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <Field label={t("fPerCustomer")}>
                <Input type="number" min={1} value={fPer} onChange={(e) => setFPer(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <Field label={t("scopeSec")}>
                <Select value={fScope} onValueChange={(v) => setFScope(v ?? "All Products")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All Products", "Selected Products", "Selected Categories", "Selected Vendors"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("audSec")}>
                <Select value={fAudience} onValueChange={(v) => setFAudience(v ?? "All Customers")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["All Customers", "Selected Customers", "Customer Groups", "New Customers", "VIP Group"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("scheduleSec")}>
            <div className="grid gap-4 sm:grid-cols-2">
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("previewTitle")} · <span className="font-mono">{viewed.code}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-2 border border-dashed border-secondary/40 bg-secondary/5 px-4 py-6 text-center">
                <span className="font-heading text-3xl font-bold tracking-widest text-secondary">{viewed.code}</span>
                <span className="font-heading text-xl font-bold">{couponValueLabel(viewed)} OFF</span>
                <span className="text-xs text-muted-foreground">
                  {t("minPurchase")}: {viewed.minSpend > 0 ? money(viewed.minSpend) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("validUntil")}: {viewed.end}
                </span>
                <Button size="sm" className="mt-2 gap-1.5" onClick={() => void copyCode(viewed.code)}>
                  {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  {t("copyCode")}
                </Button>
              </div>
              <div className="flex flex-col divide-y divide-border text-sm">
                <PreviewKV label={t("tUsage")} value={`${num(viewed.used)} / ${num(viewed.limit)}`} />
                <PreviewKV label={t("scopeSec")} value={viewed.scope} />
                <PreviewKV label={t("audSec")} value={viewed.audience} />
                <PreviewKV label={t("tStatus")} value={viewed.status} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { handleDuplicate(viewed); setViewId(null); }}>
                  {t("duplicate")}
                </Button>
                <Button size="sm" onClick={() => { setViewId(null); openEdit(viewed); }}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {t("editTitle")}
                </Button>
              </div>
            </>
          ) : null}
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
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirmId) store.removeCoupons([confirmId]);
                setConfirmId(null);
                toast.success(t("toastDeleted", { count: 1 }));
              }}
            >
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
