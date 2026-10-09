"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  Star,
  Trash2,
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
import type { ProviderType, ShipStatus, ShippingProvider } from "@/features/admin/shipping";
import { useShippingStore, useShipProviders } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPES: ProviderType[] = ["courier", "local", "international", "pickup", "3pl"];
const typeKey = (ty: ProviderType) =>
  ty === "courier" ? "tyCourier" : ty === "local" ? "tyLocal" : ty === "international" ? "tyIntl" : ty === "pickup" ? "tyPickup" : "ty3pl";

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Bike className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function ShippingProvidersPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const providers = useShipProviders();
  const store = useShippingStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<ProviderType>("courier");
  const [fDesc, setFDesc] = useState("");
  const [fWebsite, setFWebsite] = useState("");
  const [fContact, setFContact] = useState("");
  const [fCoverage, setFCoverage] = useState("Dhaka Metro");
  const [fMin, setFMin] = useState(1);
  const [fMax, setFMax] = useState(3);
  const [fStatus, setFStatus] = useState<ShipStatus>("active");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(q));
  }, [providers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => providers.some((p) => p.id === id)),
    [selected, providers]
  );
  const defaultProvider = providers.find((p) => p.isDefault);

  const stats = [
    { label: t("sTotalProviders"), value: num(providers.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sActiveProviders"), value: num(providers.filter((p) => p.status === "active").length), tile: "bg-green-600/10 text-green-700" },
    { label: t("sInactiveProviders"), value: num(providers.filter((p) => p.status === "inactive").length), tile: "bg-muted text-muted-foreground" },
    { label: t("sDefaultProvider"), value: defaultProvider?.name ?? "—", tile: "bg-primary/15 text-secondary" },
  ];

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFType("courier"); setFDesc("");
    setFWebsite(""); setFContact(""); setFCoverage("Dhaka Metro");
    setFMin(1); setFMax(3); setFStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (p: ShippingProvider) => {
    setEditId(p.id);
    setFName(p.name); setFType(p.type); setFDesc(p.description);
    setFWebsite(p.website); setFContact(p.contact); setFCoverage(p.coverage[0] ?? "");
    setFMin(p.minDays); setFMax(p.maxDays); setFStatus(p.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (fMin > fMax) {
      toast.error(t("confirmDesc"));
      return;
    }
    if (editId) {
      store.patchProvider(editId, {
        name: fName.trim(), type: fType, description: fDesc.trim(),
        website: fWebsite.trim(), contact: fContact.trim(),
        coverage: fCoverage.trim() ? [fCoverage.trim()] : [],
        minDays: fMin, maxDays: fMax, status: fStatus,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addProvider({
        id: `sp-${providers.length + 1}`,
        name: fName.trim(), type: fType, description: fDesc.trim(),
        website: fWebsite.trim(), contact: fContact.trim(),
        coverage: fCoverage.trim() ? [fCoverage.trim()] : [],
        services: ["Standard"], minDays: fMin, maxDays: fMax,
        shipments: 0, delivered: 0, delayed: 0, failed: 0, avgDays: fMin,
        status: fStatus, isDefault: false,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (providers.find((p) => p.id === viewId) ?? null) : null;
  const onTimePct = (p: ShippingProvider) =>
    p.shipments > 0 ? Math.round((p.delivered / p.shipments) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("spTitle")}
        subtitle={t("spSubtitle", { count: filtered.length })}
        highlightLabel={t("sDefaultProvider")}
        highlightValue={defaultProvider?.name ?? "—"}
        highlightIcon={Star}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addProvider")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

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
                for (const id of activeSelected) store.patchProvider(id, { status: "active" });
                setSelected(new Set());
                toast.success(t("toastActivated"));
              }}>
                {t("activate")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removeProviders(activeSelected);
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
                      checked={visible.length > 0 && visible.every((p) => selected.has(p.id))}
                      indeterminate={visible.some((p) => selected.has(p.id)) && !visible.every((p) => selected.has(p.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const p of visible) {
                            if (v === true) next.add(p.id);
                            else next.delete(p.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("spTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tProvider")}</TableHead>
                  <TableHead>{t("tProviderType")}</TableHead>
                  <TableHead>{t("tCoverage")}</TableHead>
                  <TableHead>{t("tDelivery2")}</TableHead>
                  <TableHead className="text-center">{t("tDefault")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => (
                  <TableRow key={p.id} className={cn(selected.has(p.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(p.id);
                        else next.delete(p.id);
                        return next;
                      })} aria-label={p.name} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex size-9 shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary font-heading text-sm font-bold text-white">
                          {p.name[0]}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.website}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">{t(typeKey(p.type))}</Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={p.coverage.join(", ")}>
                      {p.coverage.join(", ")}
                    </TableCell>
                    <TableCell className="text-xs font-bold whitespace-nowrap text-secondary">
                      {p.minDays}–{p.maxDays} Days · {onTimePct(p)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {p.isDefault ? (
                        <Star className="mx-auto size-4 fill-primary text-primary" aria-label={t("tDefault")} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDefaultId(p.id)}
                          aria-label={`${t("setDefault")} ${p.name}`}
                          title={t("setDefault")}
                          className="mx-auto flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-secondary"
                        >
                          <Star className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <ShippingStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(p.id)} aria-label={`${t("viewTitle")} ${p.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label={`${t("editTitle")} ${p.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {p.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchProvider(p.id, { status: "inactive" }); toast.success(t("toastDeactivated")); }} aria-label={p.name} title={t("deactivate")}>
                            <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchProvider(p.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={p.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(p.id)} aria-label={p.name}>
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
              <EmptyState icon={Bike} title={t("emptyTitle")} description={t("emptyDescription")} />
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
                  <span className="flex size-9 items-center justify-center bg-gradient-to-br from-primary to-secondary font-heading text-sm font-bold text-white">
                    {viewed.name[0]}
                  </span>
                  {viewed.name}
                  {viewed.isDefault ? <Star className="size-4 fill-primary text-primary" aria-label={t("tDefault")} /> : null}
                  <ShippingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={t("spBasic")}>
                <DetailKV label={t("tProviderType")} value={t(typeKey(viewed.type))} />
                <DetailKV label={t("fDescription")} value={viewed.description} />
                <DetailKV label={t("fWebsite")} value={viewed.website} />
                <DetailKV label={t("fContact")} value={viewed.contact} />
              </SectionCard>
              <SectionCard title={t("spCoverage")}>
                <DetailKV label={t("tCoverage")} value={viewed.coverage.join(", ")} />
                <DetailKV label={t("spServices")} value={viewed.services.join(", ")} />
                <DetailKV label={t("tDelivery2")} value={`${viewed.minDays}–${viewed.maxDays} Days`} />
              </SectionCard>
              <SectionCard title={t("spPerf")}>
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                  {[
                    { l: t("pShipments"), v: num(viewed.shipments) },
                    { l: t("pDelivered"), v: num(viewed.delivered) },
                    { l: t("pDelayed"), v: num(viewed.delayed) },
                    { l: t("pFailed"), v: num(viewed.failed) },
                    { l: t("pAvg"), v: `${viewed.avgDays}d` },
                  ].map((s) => (
                    <div key={s.l} className="border border-border bg-card px-1 py-2">
                      <p className="font-heading text-sm font-bold text-secondary">{s.v}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <div className="flex justify-end gap-2">
                {!viewed.isDefault ? (
                  <Button variant="outline" size="sm" className="gap-1.5 bg-card" onClick={() => { setViewId(null); setDefaultId(viewed.id); }}>
                    <Check className="size-3.5" aria-hidden="true" />
                    {t("setDefault")}
                  </Button>
                ) : null}
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
              {editId ? t("editTitle") : t("addProvider")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("spBasic")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fProviderName")}>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Pathao" />
              </Field>
              <Field label={t("fProviderType")}>
                <Select value={fType} onValueChange={(v) => setFType((v as ProviderType) ?? "courier")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>{t(typeKey(ty))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("fDescription")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fWebsite")}>
                <Input value={fWebsite} onChange={(e) => setFWebsite(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fContact")}>
                <Input value={fContact} onChange={(e) => setFContact(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tCoverage")}>
                <Input value={fCoverage} onChange={(e) => setFCoverage(e.target.value)} className="bg-card" />
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
              <Field label={t("fMinDays")}>
                <Input type="number" min={0} value={fMin} onChange={(e) => setFMin(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <Field label={t("fMaxDays")}>
                <Input type="number" min={0} value={fMax} onChange={(e) => setFMax(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
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
              if (confirmId) store.removeProviders([confirmId]);
              setConfirmId(null);
              toast.success(t("toastDeleted", { count: 1 }));
            }}>
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!defaultId} onOpenChange={(open) => !open && setDefaultId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("setDefault")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("defaultConfirm")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDefaultId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={() => {
              if (defaultId) store.setDefaultProvider(defaultId);
              setDefaultId(null);
              toast.success(t("toastSaved"));
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
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
