"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { ShippingStatusBadge } from "@/components/admin/shipping/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { ShipStatus, ShippingMethod } from "@/features/admin/shipping";
import { useShipMethods, useShippingStore, useShipZones } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "name" | "priority" | "vendors";

const METHOD_TYPES = ["Standard", "Express", "Free", "Same Day", "Next Day", "Pickup", "Local", "Vendor"];
const RATE_TYPES = ["Flat Rate", "Free Shipping", "Weight Based", "Price Based", "Quantity Based", "Distance Based", "Vendor Based"];

export default function ShippingMethodsPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const methods = useShipMethods();
  const zones = useShipZones();
  const store = useShippingStore();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState(METHOD_TYPES[0]);
  const [fDesc, setFDesc] = useState("");
  const [fRateType, setFRateType] = useState(RATE_TYPES[0]);
  const [fMin, setFMin] = useState(2);
  const [fMax, setFMax] = useState(5);
  const [fNote, setFNote] = useState("");
  const [fZone, setFZone] = useState("");
  const [fPriority, setFPriority] = useState(1);
  const [fStatus, setFStatus] = useState<ShipStatus>("active");
  const [fFree, setFFree] = useState(false);
  const [fPickup, setFPickup] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return methods;
    return methods.filter((m) => m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
  }, [methods, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "priority") return (a.priority - b.priority) * dir;
      if (sortKey === "vendors") return (a.vendors - b.vendors) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => methods.some((m) => m.id === id)),
    [selected, methods]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5 text-white" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3.5 text-white" aria-hidden="true" />
    );
  };

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFType(METHOD_TYPES[0]); setFDesc("");
    setFRateType(RATE_TYPES[0]); setFMin(2); setFMax(5); setFNote("");
    setFZone(zones[0]?.name ?? ""); setFPriority(methods.length + 1);
    setFStatus("active"); setFFree(false); setFPickup(false);
    setDialogOpen(true);
  };

  const openEdit = (m: ShippingMethod) => {
    setEditId(m.id);
    setFName(m.name); setFType(m.type); setFDesc(m.description);
    setFRateType(m.rateType); setFMin(m.minDays); setFMax(m.maxDays); setFNote(m.note);
    setFZone(m.zones[0] ?? ""); setFPriority(m.priority);
    setFStatus(m.status); setFFree(m.freeShipping); setFPickup(m.pickup);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (fMin > fMax) {
      toast.error(t("confirmDesc"));
      return;
    }
    if (editId) {
      store.patchMethod(editId, {
        name: fName.trim(), type: fType, description: fDesc.trim(),
        rateType: fRateType, minDays: fMin, maxDays: fMax, note: fNote.trim() || `${fMin}–${fMax} Business Days`,
        zones: fZone ? [fZone] : [], priority: fPriority, status: fStatus,
        freeShipping: fFree, pickup: fPickup,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addMethod({
        id: `m-${methods.length + 1}`,
        name: fName.trim(), type: fType, description: fDesc.trim(),
        rateType: fRateType, minDays: fMin, maxDays: fMax, note: fNote.trim() || `${fMin}–${fMax} Business Days`,
        zones: fZone ? [fZone] : [], vendors: 0, priority: fPriority, status: fStatus,
        freeShipping: fFree, pickup: fPickup,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (methods.find((m) => m.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("mTitle")}
        subtitle={t("mSubtitle", { count: filtered.length })}
        highlightLabel={t("kpiMethods")}
        highlightValue={String(methods.filter((m) => m.status === "active").length)}
        highlightIcon={Truck}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addMethod")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" onClick={() => {
                for (const id of activeSelected) store.patchMethod(id, { status: "active" });
                setSelected(new Set());
                toast.success(t("toastActivated"));
              }}>
                {t("activate")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removeMethods(activeSelected);
                setSelected(new Set());
                toast.success(t("toastDeleted", { count: activeSelected.length }));
              }}>
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
                      checked={visible.length > 0 && visible.every((m) => selected.has(m.id))}
                      indeterminate={visible.some((m) => selected.has(m.id)) && !visible.every((m) => selected.has(m.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const m of visible) {
                            if (v === true) next.add(m.id);
                            else next.delete(m.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("mTitle")}
                    />
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tMethod")} {sortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tRateType")}</TableHead>
                  <TableHead>{t("tEta")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("vendors")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tVendors")} {sortIcon("vendors")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("priority")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tPriority")} {sortIcon("priority")}
                    </button>
                  </TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((m) => (
                  <TableRow key={m.id} className={cn(selected.has(m.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(m.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(m.id);
                        else next.delete(m.id);
                        return next;
                      })} aria-label={m.name} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{m.name}</p>
                      <p className="max-w-48 truncate text-xs text-muted-foreground" title={m.description}>{m.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">{m.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{m.rateType}</TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap text-secondary">{m.note}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{m.vendors}</TableCell>
                    <TableCell>
                      <ShippingStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {m.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(m.id)} aria-label={`${t("viewTitle")} ${m.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} aria-label={`${t("editTitle")} ${m.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {m.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchMethod(m.id, { status: "inactive" }); toast.success(t("toastDeactivated")); }} aria-label={m.name} title={t("deactivate")}>
                            <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchMethod(m.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={m.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(m.id)} aria-label={m.name}>
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
              <EmptyState icon={Truck} title={t("emptyTitle")} description={t("emptyDescription")} />
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
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
                  {viewed.name}
                  <ShippingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <DetailKV label={t("tType")} value={viewed.type} />
                <DetailKV label={t("fDescription")} value={viewed.description} />
                <DetailKV label={t("tRateType")} value={viewed.rateType} />
                <DetailKV label={t("tEta")} value={viewed.note} />
                <DetailKV label={t("fZones")} value={viewed.zones.join(", ") || "—"} />
                <DetailKV label={t("tVendors")} value={String(viewed.vendors)} />
                <DetailKV label={t("tPriority")} value={String(viewed.priority)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { setViewId(null); openEdit(viewed); }}>{t("editTitle")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addMethod")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("mBasic")}>
            <Field label={t("fMethodName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Standard Delivery" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fMethodType")}>
                <Select value={fType} onValueChange={(v) => setFType(v ?? METHOD_TYPES[0])}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>{ty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tRateType")}>
                <Select value={fRateType} onValueChange={(v) => setFRateType(v ?? RATE_TYPES[0])}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATE_TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>{ty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("fDescription")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("fPriority")}>
                <Input type="number" min={1} value={fPriority} onChange={(e) => setFPriority(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <Field label={t("fStatus")}>
                <Select value={fStatus} onValueChange={(v) => setFStatus((v as ShipStatus) ?? "active")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["active", "inactive", "scheduled", "draft"] as ShipStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("fZones")}>
                <Select value={fZone} onValueChange={(v) => setFZone(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("mEta")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("fMinDays")}>
                <Input type="number" min={0} value={fMin} onChange={(e) => setFMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fMaxDays")}>
                <Input type="number" min={0} value={fMax} onChange={(e) => setFMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fNote")}>
                <Input value={fNote} onChange={(e) => setFNote(e.target.value)} className="bg-card" placeholder="2–5 Business Days" />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("mSettings")}>
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2.5 text-sm font-medium">
              {t("fFreeShip")}
              <Checkbox checked={fFree} onCheckedChange={(v) => setFFree(v === true)} aria-label={t("fFreeShip")} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2.5 text-sm font-medium">
              {t("fPickup")}
              <Checkbox checked={fPickup} onCheckedChange={(v) => setFPickup(v === true)} aria-label={t("fPickup")} />
            </label>
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
              if (confirmId) store.removeMethods([confirmId]);
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

function DetailKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
