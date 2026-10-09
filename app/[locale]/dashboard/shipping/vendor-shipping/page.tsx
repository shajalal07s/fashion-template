"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Power,
  Search,
  Store,
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ShippingStatusBadge } from "@/components/admin/shipping/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { ShipModel, VendorShipping } from "@/features/admin/shipping";
import { useShipVendors, useShipZones, useShippingStore } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODELS: ShipModel[] = ["admin", "vendor", "hybrid"];
const modelKey = (m: ShipModel) => (m === "admin" ? "modelAdmin" : m === "vendor" ? "modelVendor" : "modelHybrid");
const ALL_METHODS = ["Standard", "Express", "Free Shipping", "Same Day", "Local Delivery"];

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Store className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function VendorShippingPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const vendors = useShipVendors();
  const zones = useShipZones();
  const store = useShippingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fModel, setFModel] = useState<ShipModel>("hybrid");
  const [fZone, setFZone] = useState("");
  const [fMethods, setFMethods] = useState<string[]>([]);
  const [fRate, setFRate] = useState(60);
  const [fFee, setFFee] = useState(0);
  const [fFeeKind, setFFeeKind] = useState<"fixed" | "percent">("fixed");
  const [fFree, setFFree] = useState(false);
  const [fLocal, setFLocal] = useState(false);
  const [fPickup, setFPickup] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.vendor.toLowerCase().includes(q) || v.store.toLowerCase().includes(q));
  }, [vendors, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const stats = [
    { label: t("sTotalVendors"), value: num(vendors.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sEnabled"), value: num(vendors.filter((v) => v.status === "active").length), tile: "bg-green-600/10 text-green-700" },
    { label: t("sDisabled"), value: num(vendors.filter((v) => v.status === "inactive").length), tile: "bg-muted text-muted-foreground" },
    { label: t("sCustom"), value: num(vendors.filter((v) => v.model === "vendor").length), tile: "bg-primary/15 text-secondary" },
    { label: t("sDefault"), value: num(vendors.filter((v) => v.model === "admin").length), tile: "bg-secondary/15 text-secondary" },
  ];

  const openConfig = (v: VendorShipping) => {
    setEditId(v.id);
    setFModel(v.model);
    setFZone(v.zone);
    setFMethods([...v.methods]);
    setFRate(v.rate);
    setFFee(v.handlingFee);
    setFFeeKind(v.handlingKind);
    setFFree(v.freeShipping);
    setFLocal(v.localDelivery);
    setFPickup(v.pickup);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editId) return;
    if (fRate < 0 || fFee < 0) {
      toast.error(t("confirmDesc"));
      return;
    }
    store.patchVendorShip(editId, {
      model: fModel, zone: fZone, methods: fMethods, rate: fRate,
      handlingFee: fFee, handlingKind: fFeeKind,
      freeShipping: fFree, localDelivery: fLocal, pickup: fPickup,
    });
    setDialogOpen(false);
    toast.success(t("toastSaved"));
  };

  const toggleMethod = (m: string) =>
    setFMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const viewed = viewId ? (vendors.find((v) => v.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("vsTitle")}
        subtitle={t("vsSubtitle", { count: filtered.length })}
        highlightLabel={t("sEnabled")}
        highlightValue={num(vendors.filter((v) => v.status === "active").length)}
        highlightIcon={Store}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

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
                  <TableHead>{t("tModel")}</TableHead>
                  <TableHead>{t("tZone2")}</TableHead>
                  <TableHead className="text-right">{t("tRate2")}</TableHead>
                  <TableHead>{t("tDelivery")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{v.vendor}</p>
                      <p className="text-xs text-muted-foreground">{v.store}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", v.model === "admin" ? "bg-secondary/15 text-secondary" : v.model === "vendor" ? "bg-primary/20 text-[#8a5a00]" : "bg-green-600/10 text-green-700")}>
                        {t(modelKey(v.model))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{v.zone}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(v.rate)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{v.delivery}</TableCell>
                    <TableCell>
                      <ShippingStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(v.id)} aria-label={`${t("viewTitle")} ${v.vendor}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openConfig(v)} aria-label={`${t("editTitle")} ${v.vendor}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.patchVendorShip(v.id, { status: v.status === "active" ? "inactive" : "active" });
                          toast.success(v.status === "active" ? t("toastDeactivated") : t("toastActivated"));
                        }} aria-label={v.vendor} title={v.vendor}>
                          <Power className={cn("size-4", v.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
                  {viewed.store}
                  <ShippingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={t("vsVendor")}>
                <DetailKV label={t("tVendor")} value={viewed.vendor} />
                <DetailKV label={t("tStore")} value={viewed.store} />
                <DetailKV label={t("tStatus")} value={viewed.status} />
              </SectionCard>
              <SectionCard title={t("vsConfig")}>
                <DetailKV label={t("fModel")} value={t(modelKey(viewed.model))} />
                <DetailKV label={t("tZone2")} value={viewed.zone} />
                <DetailKV label={t("fMethods")} value={viewed.methods.join(", ")} />
                <DetailKV label={t("tRate2")} value={money(viewed.rate)} />
                <DetailKV label={t("tDelivery")} value={viewed.delivery} />
              </SectionCard>
              <SectionCard title={t("vsSettings")}>
                <DetailKV label={t("fFree")} value={viewed.freeShipping ? t("active") : t("inactive")} />
                <DetailKV label={t("fLocal")} value={viewed.localDelivery ? t("active") : t("inactive")} />
                <DetailKV label={t("fPickup")} value={viewed.pickup ? t("active") : t("inactive")} />
                <DetailKV label={t("fHandling")} value={viewed.handlingKind === "fixed" ? money(viewed.handlingFee) : `${viewed.handlingFee}%`} />
              </SectionCard>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { setViewId(null); openConfig(viewed); }}>{t("editTitle")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("vsConfig")}</DialogTitle>
          </DialogHeader>
          <SectionCard title={t("fModel")}>
            <div className="grid grid-cols-3 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFModel(m)}
                  className={cn("border px-2 py-2.5 text-xs font-bold transition-colors", fModel === m ? "border-secondary bg-secondary font-semibold text-white" : "border-border text-muted-foreground hover:bg-muted")}
                >
                  {t(modelKey(m))}
                </button>
              ))}
            </div>
            <Field label={t("tZone2")}>
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
          </SectionCard>
          <SectionCard title={t("fMethods")}>
            <div className="flex flex-wrap gap-2">
              {ALL_METHODS.map((m) => (
                <label key={m} className={cn("flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-xs font-semibold", fMethods.includes(m) ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground")}>
                  <Checkbox checked={fMethods.includes(m)} onCheckedChange={() => toggleMethod(m)} aria-label={m} />
                  {m}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label={t("tRate2")}>
                <Input type="number" min={0} value={fRate} onChange={(e) => setFRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fHandling")}>
                <Input type="number" min={0} value={fFee} onChange={(e) => setFFee(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fHandlingKind")}>
                <Select value={fFeeKind} onValueChange={(v) => setFFeeKind((v as "fixed" | "percent") ?? "fixed")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{t("optFixed")}</SelectItem>
                    <SelectItem value="percent">{t("optPercent")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
          <SectionCard title={t("vsSettings")}>
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2.5 text-sm font-medium">
              {t("fFree")}
              <Checkbox checked={fFree} onCheckedChange={(v) => setFFree(v === true)} aria-label={t("fFree")} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2.5 text-sm font-medium">
              {t("fLocal")}
              <Checkbox checked={fLocal} onCheckedChange={(v) => setFLocal(v === true)} aria-label={t("fLocal")} />
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
    </div>
  );
}

function DetailKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
