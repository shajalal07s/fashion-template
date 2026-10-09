"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
  Search,
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { TrackingStatusBadge, TrackingTimeline } from "@/components/admin/returns/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { Shipment, TrackStatus } from "@/features/admin/returns";
import { useReturnsStore, useShipments } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: TrackStatus[] = ["processing", "picked", "transit", "out", "delivered", "delayed", "failed", "returned"];

export default function ShipmentsPage() {
  const t = useTranslations("Dashboard.tracking");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const shipments = useShipments();
  const patchShipment = useReturnsStore((s) => s.patchShipment);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [bigQuery, setBigQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TrackStatus>("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);

  const providers = useMemo(() => [...new Set(shipments.map((s) => s.provider))], [shipments]);

  const matchSearch = (s: Shipment, q: string) =>
    !q ||
    s.tracking.toLowerCase().includes(q) ||
    s.orderId.toLowerCase().includes(q) ||
    s.customer.toLowerCase().includes(q) ||
    s.vendor.toLowerCase().includes(q) ||
    s.provider.toLowerCase().includes(q);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter(
      (s) =>
        (statusFilter === "all" || s.status === statusFilter) &&
        (providerFilter === "all" || s.provider === providerFilter) &&
        matchSearch(s, q)
    );
  }, [shipments, query, statusFilter, providerFilter]);

  const searched = useMemo(() => {
    const q = bigQuery.trim().toLowerCase();
    if (!q) return null;
    return shipments.filter((s) => matchSearch(s, q));
  }, [shipments, bigQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const viewed = viewId ? (shipments.find((s) => s.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("tracking")}
        title={t("sTitle")}
        subtitle={t("sSubtitle", { count: filtered.length })}
        highlightLabel={t("kpiDelivered")}
        highlightValue={String(shipments.filter((s) => s.status === "delivered").length)}
        highlightIcon={PackageSearch}
      />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="pb-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("searchTitle")}</p>
            <Input
              value={bigQuery}
              onChange={(e) => setBigQuery(e.target.value)}
              placeholder={t("searchPh")}
              className="bg-card font-mono"
              aria-label={t("searchTitle")}
            />
          </div>
        </CardContent>
      </Card>

      {searched !== null ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-2 p-4">
            {searched.length > 0 ? (
              searched.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setViewId(s.id)}
                  className="flex flex-wrap items-center gap-2 border border-border px-3 py-2 text-left transition-colors hover:border-secondary"
                >
                  <span className="font-mono text-xs font-bold">{s.tracking}</span>
                  <span className="text-xs text-muted-foreground">{s.customer} · {s.orderId}</span>
                  <span className="ml-auto">
                    <TrackingStatusBadge status={s.status} />
                  </span>
                </button>
              ))
            ) : (
              <p className="py-2 text-center text-sm text-muted-foreground">{t("noResult")}</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as TrackStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label={t("tProvider")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={visible.length > 0 && visible.every((s) => selected.has(s.id))}
                      indeterminate={visible.some((s) => selected.has(s.id)) && !visible.every((s) => selected.has(s.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const s of visible) {
                            if (v === true) next.add(s.id);
                            else next.delete(s.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("sTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tProvider")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tLocation")}</TableHead>
                  <TableHead>{t("tEta")}</TableHead>
                  <TableHead className="w-20">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  <TableRow key={s.id} className={cn(selected.has(s.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(s.id);
                        else next.delete(s.id);
                        return next;
                      })} aria-label={s.tracking} />
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{s.orderId}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.tracking}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{s.customer}</p>
                      <p className="text-xs text-muted-foreground">{s.vendor}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{s.provider} · {s.method}</TableCell>
                    <TableCell>
                      <TrackingStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground" title={s.location}>{s.location}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{s.eta}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(s.id)} aria-label={`${t("viewTitle")} ${s.tracking}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Select value={s.status} onValueChange={(v) => {
                          patchShipment(s.id, { status: (v as TrackStatus) ?? s.status });
                          toast.success(t("toastUpdated"));
                        }}>
                          <SelectTrigger size="sm" className="h-8 w-28 bg-card" aria-label={`${t("tStatus")} ${s.tracking}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((st) => (
                              <SelectItem key={st} value={st}>{t(st)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={PackageSearch} title={t("emptyTitle")} description={t("emptyDescription")} />
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
                  <span className="font-mono">{viewed.tracking}</span>
                  <TrackingStatusBadge status={viewed.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <SectionCard title={t("dOrder")}>
                  <DetailKV label={t("tOrder")} value={viewed.orderId} />
                  <DetailKV label={t("tCustomer")} value={viewed.customer} />
                  <DetailKV label={t("tVendor")} value={viewed.vendor} />
                  <DetailKV label={t("fAmount")} value={money(viewed.amount)} />
                </SectionCard>
                <SectionCard title={t("dShipment")}>
                  <DetailKV label={t("tProvider")} value={`${viewed.provider} · ${viewed.method}`} />
                  <DetailKV label={t("fOrigin")} value={viewed.origin} />
                  <DetailKV label={t("fDestination")} value={viewed.destination} />
                  <DetailKV label={t("tEta")} value={viewed.eta} />
                </SectionCard>
              </div>
              <SectionCard title={t("dTimeline")}>
                <TrackingTimeline events={viewed.events} />
              </SectionCard>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Field label={t("tStatus")}>
                  <Select value={viewed.status} onValueChange={(v) => {
                    patchShipment(viewed.id, { status: (v as TrackStatus) ?? viewed.status });
                    toast.success(t("toastUpdated"));
                  }}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>{t(st)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex justify-end sm:ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                </div>
              </div>
            </>
          ) : null}
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
