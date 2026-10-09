"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
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
import { Package } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { ShippingStatusBadge } from "@/components/admin/shipping/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { previewShippingCost, type RateKind, type ShippingRate } from "@/features/admin/shipping";
import { useShipMethods, useShipRates, useShipZones, useShippingStore } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const KINDS: RateKind[] = ["flat", "price", "weight", "quantity", "distance", "vendor"];
const kindKey = (k: RateKind) =>
  k === "flat" ? "rtFlat" : k === "price" ? "rtPrice" : k === "weight" ? "rtWeight" : k === "quantity" ? "rtQty" : k === "distance" ? "rtDistance" : "rtVendor";

export default function ShippingRatesPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const rates = useShipRates();
  const zones = useShipZones();
  const methods = useShipMethods();
  const store = useShippingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fZone, setFZone] = useState("");
  const [fMethod, setFMethod] = useState("");
  const [fKind, setFKind] = useState<RateKind>("flat");
  const [fMin, setFMin] = useState(0);
  const [fMax, setFMax] = useState(0);
  const [fCost, setFCost] = useState(60);
  const [fFree, setFFree] = useState(0);
  const [pvOrder, setPvOrder] = useState(1500);
  const [pvWeight, setPvWeight] = useState(2);
  const [pvQty, setPvQty] = useState(3);
  const [pvMethod, setPvMethod] = useState("Standard Delivery");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter((r) => r.name.toLowerCase().includes(q) || r.zone.toLowerCase().includes(q));
  }, [rates, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => rates.some((r) => r.id === id)),
    [selected, rates]
  );

  const rangeLabel = (r: ShippingRate) =>
    r.kind === "flat" || r.kind === "vendor" ? "—" : `${num(r.min)} – ${num(r.max)} ${r.unit}`;

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFZone(zones[0]?.name ?? ""); setFMethod(methods[0]?.name ?? "");
    setFKind("flat"); setFMin(0); setFMax(0); setFCost(60); setFFree(0);
    setDialogOpen(true);
  };

  const openEdit = (r: ShippingRate) => {
    setEditId(r.id);
    setFName(r.name); setFZone(r.zone); setFMethod(r.method);
    setFKind(r.kind); setFMin(r.min); setFMax(r.max); setFCost(r.cost); setFFree(r.freeAbove);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (fMin > fMax && fMax > 0) {
      toast.error(t("confirmDesc"));
      return;
    }
    if (fCost < 0) {
      toast.error(t("confirmDesc"));
      return;
    }
    const condition =
      fKind === "flat" ? "Flat" : fKind === "price" ? "Order Amount" : fKind === "weight" ? "Weight" : fKind === "quantity" ? "Quantity" : fKind === "distance" ? "Distance" : "Vendor";
    if (editId) {
      store.patchRate(editId, {
        name: fName.trim(), zone: fZone, method: fMethod, kind: fKind,
        condition, min: fMin, max: fMax, unit: fKind === "weight" ? "KG" : fKind === "distance" ? "KM" : fKind === "quantity" ? "items" : "৳",
        cost: fCost, freeAbove: fFree,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addRate({
        id: `rt-${rates.length + 1}`,
        name: fName.trim(), zone: fZone, method: fMethod, kind: fKind,
        condition, min: fMin, max: fMax, unit: fKind === "weight" ? "KG" : fKind === "distance" ? "KM" : fKind === "quantity" ? "items" : "৳",
        cost: fCost, freeAbove: fFree, status: "active",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("rTitle")}
        subtitle={t("rSubtitle", { count: filtered.length })}
        highlightLabel={t("tCost")}
        highlightValue={money(rates.filter((r) => r.status === "active").reduce((n, r) => n + r.cost, 0))}
        highlightIcon={Calculator}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addRate")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <div className="flex flex-col gap-2 p-4 pb-0 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
            </div>
          </div>
          {activeSelected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
                <X className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
              <div className="ml-auto">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive" onClick={() => {
                  store.removeRates(activeSelected);
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
                        checked={visible.length > 0 && visible.every((r) => selected.has(r.id))}
                        indeterminate={visible.some((r) => selected.has(r.id)) && !visible.every((r) => selected.has(r.id))}
                        onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            for (const r of visible) {
                              if (v === true) next.add(r.id);
                              else next.delete(r.id);
                            }
                            return next;
                          });
                        }}
                        aria-label={t("rTitle")}
                      />
                    </TableHead>
                    <TableHead>{t("tRate")}</TableHead>
                    <TableHead>{t("tZone")}</TableHead>
                    <TableHead>{t("tCondition")}</TableHead>
                    <TableHead className="text-right">{t("tCost")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-28">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow key={r.id} className={cn(selected.has(r.id) && "bg-secondary/5")}>
                      <TableCell>
                        <Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(r.id);
                          else next.delete(r.id);
                          return next;
                        })} aria-label={r.name} />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold whitespace-nowrap">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.method}</p>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{r.zone}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.condition} · {rangeLabel(r)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                        {money(r.cost)}
                      </TableCell>
                      <TableCell>
                        <ShippingStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          {r.status === "active" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchRate(r.id, { status: "inactive" }); toast.success(t("toastDeactivated")); }} aria-label={r.name} title={t("deactivate")}>
                              <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchRate(r.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={r.name} title={t("activate")}>
                              <Play className="size-4 text-green-600" aria-hidden="true" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(r.id)} aria-label={r.name}>
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
                <EmptyState icon={Package} title={t("emptyTitle")} description={t("emptyDescription")} />
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

        <div className="lg:sticky lg:top-4">
          <SectionCard
            title={t("previewTitle")}
            icon={<Calculator className="size-4 text-secondary" aria-hidden="true" />}
          >
            <Field label={t("pvOrder")}>
              <Input type="number" min={0} value={pvOrder} onChange={(e) => setPvOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("pvWeight")}>
                <Input type="number" min={0} value={pvWeight} onChange={(e) => setPvWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("pvQty")}>
                <Input type="number" min={1} value={pvQty} onChange={(e) => setPvQty(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
            </div>
            <Field label={t("pvMethod")}>
              <Select value={pvMethod} onValueChange={(v) => setPvMethod(v ?? methods[0]?.name ?? "")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
              <span className="text-sm font-bold">{t("pvCost")}</span>
              <span className="font-heading text-lg font-bold text-secondary">
                {money(previewShippingCost(pvOrder, pvWeight, pvQty, pvMethod))}
              </span>
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addRate")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("rateBuilder")}>
            <Field label={t("fRateName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Dhaka Standard" />
            </Field>
            <div className="flex flex-col items-stretch gap-0">
              <BuilderStep n={1} label={t("fRateType")}>
                <Select value={fKind} onValueChange={(v) => setFKind((v as RateKind) ?? "flat")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{t(kindKey(k))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BuilderStep>
              <BuilderStep n={2} label={t("tZone")}>
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
              </BuilderStep>
              <BuilderStep n={3} label={t("tMethod")}>
                <Select value={fMethod} onValueChange={(v) => setFMethod(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BuilderStep>
              <BuilderStep n={4} label={`${t("fMinVal")} / ${t("fMaxVal")}`}>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min={0} value={fMin} onChange={(e) => setFMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label={t("fMinVal")} />
                  <Input type="number" min={0} value={fMax} onChange={(e) => setFMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label={t("fMaxVal")} />
                </div>
              </BuilderStep>
              <BuilderStep n={5} label={t("fCost")} last>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min={0} value={fCost} onChange={(e) => setFCost(Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label={t("fCost")} />
                  <Input type="number" min={0} value={fFree} onChange={(e) => setFFree(Math.max(0, Number(e.target.value) || 0))} className="bg-card" aria-label={t("fFreeAbove")} placeholder="Free above" />
                </div>
              </BuilderStep>
            </div>
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
              if (confirmId) store.removeRates([confirmId]);
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

function BuilderStep({ n, label, last, children }: { n: number; label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-2 border border-border bg-card px-3 py-2">
        <span className="flex size-6 shrink-0 items-center justify-center bg-secondary font-heading text-xs font-bold text-white">
          {n}
        </span>
        <span className="w-28 shrink-0 text-xs font-bold">{label}</span>
        <span className="min-w-0 flex-1">{children}</span>
      </div>
      {!last ? <ArrowDown className="mx-auto size-4 shrink-0 text-secondary" aria-hidden="true" /> : null}
    </div>
  );
}
