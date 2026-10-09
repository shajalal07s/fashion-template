"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  HandCoins,
  PackageCheck,
  Search,
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
import { Undo2 } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { ReturnDetailsDialog, ReturnStatusBadge } from "@/components/admin/returns/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { REJECTION_REASONS } from "@/features/admin/returns";
import type { ReturnRequest, ReturnStatus } from "@/features/admin/returns";
import { useReturnRequests, useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highest" | "lowest";
const STATUSES: ReturnStatus[] = ["pending", "review", "approved", "rejected", "cancelled", "completed", "received", "awaiting", "transit", "refund_pending"];

export default function ReturnRequestsPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const returns = useReturnRequests();
  const store = useReturnsStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReturnStatus>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return returns.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q ||
          r.id.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q))
    );
  }, [returns, query, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "oldest":
        list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        break;
      case "highest":
        list.sort((a, b) => b.amount - a.amount);
        break;
      case "lowest":
        list.sort((a, b) => a.amount - b.amount);
        break;
      default:
        list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
    return list;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(sorted.length, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => returns.some((r) => r.id === id)),
    [selected, returns]
  );

  const approveReturn = (id: string) => {
    store.patchReturn(id, { status: "approved", approvedBy: "Admin", approvedDate: "2026-09-26" });
    toast.success(t("toastApproved"));
    setApproveId(null);
  };

  const rejectReturn = () => {
    if (!rejectId) return;
    store.patchReturn(rejectId, { status: "rejected", rejectReason, note: rejectNotes });
    toast.success(t("toastRejected"));
    setRejectId(null);
    setRejectReason(REJECTION_REASONS[0]);
    setRejectNotes("");
  };

  const createRefund = (r: ReturnRequest) => {
    store.addRefund({
      id: `RFD-${700 + store.refunds.length + 1}`,
      returnId: r.id, orderId: r.orderId, customer: r.customer, email: r.email, vendor: r.vendor,
      requested: r.amount, approved: r.amount, final: r.amount, method: r.method,
      productAmt: r.amount, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 0,
      origPayment: "—", origTxn: "—", orderAmount: r.amount,
      date: "2026-09-26", status: "pending", note: "",
    });
    store.patchReturn(r.id, { status: "refund_pending" });
    toast.success(t("toastSaved"));
  };

  const viewed = viewId ? (returns.find((r) => r.id === viewId) ?? null) : null;

  const exportCsv = () => {
    const list = activeSelected.length > 0 ? returns.filter((r) => selected.has(r.id)) : filtered;
    if (list.length === 0) return;
    const lines = [
      ["return", "order", "customer", "product", "reason", "amount", "status", "date"].join(","),
      ...list.map((r) => [r.id, r.orderId, r.customer, r.product, r.reason, r.amount, r.status, r.date].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "return-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("qTitle")}
        subtitle={t("qSubtitle", { count: filtered.length })}
        highlightLabel={t("kpiPending")}
        highlightValue={num(returns.filter((r) => r.status === "pending" || r.status === "review").length)}
        highlightIcon={Undo2}
      >
        <button type="button" onClick={exportCsv} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as ReturnStatus | "all") ?? "all"); setPage(0); }}>
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
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["newest", "oldest", "highest", "lowest"] as SortKey[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                for (const id of activeSelected) store.patchReturn(id, { status: "approved", approvedBy: "Admin", approvedDate: "2026-09-26" });
                setSelected(new Set());
                toast.success(t("toastApproved"));
              }}>
                <Check className="size-3.5" aria-hidden="true" />
                {t("approve")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => {
                for (const id of activeSelected) store.patchReturn(id, { status: "rejected", rejectReason: "Bulk rejection" });
                setSelected(new Set());
                toast.success(t("toastRejected"));
              }}>
                <X className="size-3.5" aria-hidden="true" />
                {t("reject")}
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
                      aria-label={t("qTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tReturn")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tReason")}</TableHead>
                  <TableHead className="text-right">{t("tAmount")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
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
                      })} aria-label={r.id} />
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.orderId} · {dateOf(r.date)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-40 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                      <p className="text-xs text-muted-foreground">{r.vendor}</p>
                    </TableCell>
                    <TableCell>
                      <span className="bg-primary/20 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-[#8a5a00]">{r.reason}</span>
                      <p className="pt-0.5 text-xs text-muted-foreground">{r.condition}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.amount)}</TableCell>
                    <TableCell>
                      <ReturnStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {(r.status === "pending" || r.status === "review") ? (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => setApproveId(r.id)} aria-label={r.id} title={t("approve")}>
                              <Check className="size-4 text-green-600" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setRejectId(r.id)} aria-label={r.id} title={t("reject")}>
                              <X className="size-4" aria-hidden="true" />
                            </Button>
                          </>
                        ) : null}
                        {r.status === "approved" ? (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchReturn(r.id, { status: "received" }); toast.success(t("toastSaved")); }} aria-label={r.id} title={t("markReceived")}>
                              <PackageCheck className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => createRefund(r)} aria-label={r.id} title={t("createRefund")}>
                              <HandCoins className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={Undo2} title={t("emptyTitle")} description={t("emptyReturns")} />
              <Button variant="outline" size="sm" className="bg-card" onClick={() => { setQuery(""); setStatusFilter("all"); setPage(0); }}>
                {t("clearFilters")}
              </Button>
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {from}–{to} of {num(sorted.length)}
          </p>
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

      <ReturnDetailsDialog ret={viewed} onClose={() => setViewId(null)} />

      <Dialog open={!!approveId} onOpenChange={(open) => !open && setApproveId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("approveTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("approveDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setApproveId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => approveId && approveReturn(approveId)}>
              {t("approveBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("rejectTitle")}</DialogTitle>
          </DialogHeader>
          <Field label={t("rejectReason")}>
            <Select value={rejectReason} onValueChange={(v) => setRejectReason(v ?? REJECTION_REASONS[0])}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("rejectNotes")}>
            <Input value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={rejectReturn}>{t("rejectBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
