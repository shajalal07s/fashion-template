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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RefundDetailsDialog, RefundStatusBadge } from "@/components/admin/returns/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { RefundRequest, RefundStatus } from "@/features/admin/returns";
import { useRefundRequests, useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: RefundStatus[] = ["pending", "review", "approved", "processing", "completed", "rejected", "failed", "cancelled"];

export default function RefundRequestsPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const refunds = useRefundRequests();
  const store = useReturnsStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RefundStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return refunds.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q || r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q))
    );
  }, [refunds, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(filtered.length, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => refunds.some((r) => r.id === id)),
    [selected, refunds]
  );

  const runAction = (id: string, action: string) => {
    const r = refunds.find((x) => x.id === id);
    if (!r) return;
    if (action === "approve") {
      store.patchRefund(id, { status: "approved", approved: r.final });
      toast.success(t("toastRefundApproved"));
    } else if (action === "reject") {
      store.patchRefund(id, { status: "rejected" });
      toast.success(t("toastSaved"));
    } else if (action === "process") {
      store.patchRefund(id, { status: "processing" });
      toast.success(t("toastProcessed"));
    } else if (action === "complete") {
      store.patchRefund(id, { status: "completed", completedDate: "2026-09-26", by: "Admin" });
      toast.success(t("toastCompleted"));
    } else if (action === "fail") {
      store.patchRefund(id, { status: "failed" });
      toast.success(t("toastSaved"));
    } else if (action === "cancel") {
      store.patchRefund(id, { status: "cancelled" });
      toast.success(t("toastSaved"));
    }
    setConfirmAction(null);
  };

  const viewed = viewId ? (refunds.find((r) => r.id === viewId) ?? null) : null;

  const exportCsv = () => {
    const list = activeSelected.length > 0 ? refunds.filter((r) => selected.has(r.id)) : filtered;
    if (list.length === 0) return;
    const lines = [
      ["refund", "order", "customer", "requested", "final", "method", "status"].join(","),
      ...list.map((r) => [r.id, r.orderId, r.customer, r.requested, r.final, r.method, r.status].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "refund-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("fTitle")}
        subtitle={t("fSubtitle", { count: filtered.length })}
        highlightLabel={t("fTotalAmt")}
        highlightValue={money(filtered.reduce((n, r) => n + r.final, 0))}
        highlightIcon={HandCoins}
      >
        <button type="button" onClick={exportCsv} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as RefundStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {STATUSES.map((s) => (
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
                for (const id of activeSelected) store.patchRefund(id, { status: "approved" });
                setSelected(new Set());
                toast.success(t("toastRefundApproved"));
              }}>
                {t("approve")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => {
                for (const id of activeSelected) store.patchRefund(id, { status: "processing" });
                setSelected(new Set());
                toast.success(t("toastProcessed"));
              }}>
                {t("process")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => {
                for (const id of activeSelected) store.patchRefund(id, { status: "completed", completedDate: "2026-09-26", by: "Admin" });
                setSelected(new Set());
                toast.success(t("toastCompleted"));
              }}>
                {t("complete")}
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
                      aria-label={t("fTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tRefund")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead className="text-right">{t("tRequested")}</TableHead>
                  <TableHead className="text-right">{t("fFinal")}</TableHead>
                  <TableHead>{t("tMethod")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r: RefundRequest) => (
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
                        <div>
                          <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                          <p className="text-xs text-muted-foreground">{r.vendor}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.requested)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.final)}</TableCell>
                    <TableCell className="max-w-32 truncate text-xs text-muted-foreground" title={r.method}>{r.method}</TableCell>
                    <TableCell>
                      <RefundStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status === "pending" || r.status === "review" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ id: r.id, action: "approve" })} aria-label={r.id} title={t("approve")}>
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status === "approved" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ id: r.id, action: "process" })} aria-label={r.id} title={t("process")}>
                            <Check className="size-4 text-secondary" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status === "processing" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction({ id: r.id, action: "complete" })} aria-label={r.id} title={t("complete")}>
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status !== "completed" && r.status !== "cancelled" ? (
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmAction({ id: r.id, action: "reject" })} aria-label={r.id} title={t("reject")}>
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={HandCoins} title={t("emptyTitle")} description={t("emptyRefunds")} />
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {from}–{to} of {num(filtered.length)}
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

      <RefundDetailsDialog refund={viewed} onClose={() => setViewId(null)} />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>{t("cancelBtn")}</Button>
            <Button
              size="sm"
              variant={confirmAction?.action === "reject" ? "destructive" : "default"}
              onClick={() => confirmAction && runAction(confirmAction.id, confirmAction.action)}
            >
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
