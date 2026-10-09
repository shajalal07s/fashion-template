"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  MapPin,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
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
import type { ShipStatus, ShippingZone } from "@/features/admin/shipping";
import { useShipZones, useShippingStore } from "@/store/shipping.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "name" | "priority" | "vendors";

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function ShippingZonesPage() {
  const t = useTranslations("Dashboard.shipping");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const zones = useShipZones();
  const store = useShippingStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ShipStatus>("all");
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
  const [fDesc, setFDesc] = useState("");
  const [fCountry, setFCountry] = useState("Bangladesh");
  const [fState, setFState] = useState("");
  const [fCity, setFCity] = useState("");
  const [fPostal, setFPostal] = useState("");
  const [fPriority, setFPriority] = useState(1);
  const [fStatus, setFStatus] = useState<ShipStatus>("active");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return zones.filter(
      (z) =>
        (statusFilter === "all" || z.status === statusFilter) &&
        (!q || z.name.toLowerCase().includes(q))
    );
  }, [zones, query, statusFilter]);

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
    () => [...selected].filter((id) => zones.some((z) => z.id === id)),
    [selected, zones]
  );

  const stats = [
    { label: t("sTotalZones"), value: num(zones.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sActiveZones"), value: num(zones.filter((z) => z.status === "active").length), tile: "bg-green-600/10 text-green-700" },
    { label: t("sInactiveZones"), value: num(zones.filter((z) => z.status === "inactive").length), tile: "bg-muted text-muted-foreground" },
    { label: t("sCountries"), value: num(new Set(zones.flatMap((z) => z.countries)).size), tile: "bg-primary/15 text-secondary" },
    { label: t("sRegions"), value: num(new Set(zones.flatMap((z) => z.regions)).size), tile: "bg-secondary/15 text-secondary" },
  ];

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
    setFName(""); setFDesc("");
    setFCountry("Bangladesh"); setFState(""); setFCity(""); setFPostal("");
    setFPriority(zones.length + 1); setFStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (z: ShippingZone) => {
    setEditId(z.id);
    setFName(z.name); setFDesc(z.description);
    setFCountry(z.countries[0] ?? "Bangladesh");
    setFState(z.regions[0] ?? ""); setFCity(z.cities[0] ?? ""); setFPostal(z.postals);
    setFPriority(z.priority); setFStatus(z.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (fPriority < 1) {
      toast.error(t("confirmDesc"));
      return;
    }
    if (editId) {
      store.patchZone(editId, {
        name: fName.trim(), description: fDesc.trim(),
        countries: [fCountry.trim() || "Bangladesh"],
        regions: fState.trim() ? [fState.trim()] : [],
        cities: fCity.trim() ? [fCity.trim()] : [],
        postals: fPostal.trim() || "—",
        priority: fPriority, status: fStatus,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addZone({
        id: `z-${zones.length + 1}`,
        name: fName.trim(), description: fDesc.trim(),
        countries: [fCountry.trim() || "Bangladesh"],
        regions: fState.trim() ? [fState.trim()] : [],
        cities: fCity.trim() ? [fCity.trim()] : [],
        postals: fPostal.trim() || "—",
        methods: 0, vendors: 0, status: fStatus, priority: fPriority,
        created: "2026-09-26",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const handleDuplicate = (z: ShippingZone) => {
    store.addZone({ ...z, id: `z-${zones.length + 1}-${z.priority}`, name: `${z.name} (Copy)`, status: "draft" });
    toast.success(t("toastCreated"));
  };

  const viewed = viewId ? (zones.find((z) => z.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("shipping")}
        title={t("zTitle")}
        subtitle={t("zSubtitle", { count: filtered.length })}
        highlightLabel={t("sActiveZones")}
        highlightValue={num(zones.filter((z) => z.status === "active").length)}
        highlightIcon={MapPin}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addZone")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as ShipStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {(["active", "inactive", "scheduled", "draft"] as ShipStatus[]).map((s) => (
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
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" onClick={() => {
                for (const id of activeSelected) store.patchZone(id, { status: "active" });
                setSelected(new Set());
                toast.success(t("toastActivated"));
              }}>
                {t("activate")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removeZones(activeSelected);
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
                      checked={visible.length > 0 && visible.every((z) => selected.has(z.id))}
                      indeterminate={visible.some((z) => selected.has(z.id)) && !visible.every((z) => selected.has(z.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const z of visible) {
                            if (v === true) next.add(z.id);
                            else next.delete(z.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("zTitle")}
                    />
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tZone")} {sortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tRegions")}</TableHead>
                  <TableHead>{t("tCountries")}</TableHead>
                  <TableHead className="text-center">{t("tMethods")}</TableHead>
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
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((z) => (
                  <TableRow key={z.id} className={cn(selected.has(z.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(z.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(z.id);
                        else next.delete(z.id);
                        return next;
                      })} aria-label={z.name} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{z.name}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{z.created}</p>
                    </TableCell>
                    <TableCell>
                      <span className="flex max-w-44 flex-wrap gap-1">
                        {z.regions.slice(0, 3).map((r) => (
                          <Badge key={r} variant="outline" className="text-[11px] whitespace-nowrap">{r}</Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground" title={z.countries.join(", ")}>
                      {z.countries.join(", ")}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold">{num(z.methods)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(z.vendors)}</TableCell>
                    <TableCell>
                      <ShippingStatusBadge status={z.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {z.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(z.id)} aria-label={`${t("viewTitle")} ${z.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(z)} aria-label={`${t("editTitle")} ${z.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(z)} aria-label={z.name} title={t("viewAll")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        {z.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchZone(z.id, { status: "inactive" }); toast.success(t("toastDeactivated")); }} aria-label={z.name} title={t("toastDeactivated")}>
                            <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchZone(z.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={z.name} title={t("toastActivated")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(z.id)} aria-label={z.name}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={MapPin} title={t("emptyTitle")} description={t("emptyZones")} />
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-3.5" aria-hidden="true" />
                {t("addZone")}
              </Button>
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
                  {viewed.name}
                  <ShippingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={t("zInfo")}>
                <DetailKV label={t("fZoneName")} value={viewed.name} />
                <DetailKV label={t("tPriority")} value={String(viewed.priority)} />
                <DetailKV label={t("fDescription")} value={viewed.description} />
              </SectionCard>
              <SectionCard title={t("zLocations")}>
                <DetailKV label={t("tCountries")} value={viewed.countries.join(", ")} />
                <DetailKV label={t("tRegions")} value={viewed.regions.join(", ") || "—"} />
                <DetailKV label={t("fCity")} value={viewed.cities.join(", ") || "—"} />
                <DetailKV label={t("fPostal")} value={viewed.postals} />
              </SectionCard>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: t("tMethods"), v: num(viewed.methods) },
                  { l: t("totalVendors"), v: num(viewed.vendors) },
                  { l: t("activeVendors"), v: num(viewed.vendors) },
                ].map((s) => (
                  <div key={s.l} className="border border-border bg-card px-2 py-3">
                    <p className="font-heading text-base font-bold text-secondary">{s.v}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{s.l}</p>
                  </div>
                ))}
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
              {editId ? t("editTitle") : t("addZone")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("zBasic")}>
            <Field label={t("fZoneName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Dhaka Metro" />
            </Field>
            <Field label={t("fDescription")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </SectionCard>
          <SectionCard title={t("zGeo")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fCountry")}>
                <Input value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fState")}>
                <Input value={fState} onChange={(e) => setFState(e.target.value)} className="bg-card" placeholder="Dhaka" />
              </Field>
              <Field label={t("fCity")}>
                <Input value={fCity} onChange={(e) => setFCity(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fPostal")}>
                <Input value={fPostal} onChange={(e) => setFPostal(e.target.value)} className="bg-card" placeholder="1000–1349" />
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
              if (confirmId) store.removeZones([confirmId]);
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
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
