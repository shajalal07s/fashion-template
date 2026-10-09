"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Search,
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ReviewStatusBadge, Stars } from "@/components/admin/reviews/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { ReportStatus, ReviewReport, ReviewStatus } from "@/features/admin/reviews";
import { useReviewReports, useReviewsStore } from "@/store/reviews.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REPORT_STATUSES: ReportStatus[] = ["open", "under_review", "resolved", "dismissed"];
const REPORT_CLASS: Record<ReportStatus, string> = {
  open: "bg-destructive/10 text-destructive",
  under_review: "bg-primary/20 text-[#8a5a00]",
  resolved: "bg-green-600/10 text-green-700",
  dismissed: "bg-muted text-muted-foreground",
};

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", bold && "font-bold text-secondary")}>{value}</span>
    </div>
  );
}

export default function ReportedReviewsPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const reports = useReviewReports();
  const store = useReviewsStore();
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q || r.customer.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    );
  }, [reports, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => reports.some((r) => r.id === id)),
    [selected, reports]
  );

  const byStatus = (s: ReportStatus) => reports.filter((r) => r.status === s).length;

  const syncReview = (r: ReviewReport, status: ReviewStatus) => {
    if (r.kind === "product") store.patchProduct(r.reviewId, { status, moderationDate: "2026-09-26" });
    else store.patchVendor(r.reviewId, { status, moderationDate: "2026-09-26" });
  };

  const resolveReport = (id: string) => {
    const r = reports.find((x) => x.id === id);
    if (!r) return;
    store.patchReport(id, { status: "resolved" });
    toast.success(t("toastResolved"));
    setConfirmResolve(null);
  };

  const viewed = viewId ? (reports.find((r) => r.id === viewId) ?? null) : null;

  const stats = [
    { l: t("sTotalReports"), v: reports.length },
    { l: t("sOpen"), v: byStatus("open") },
    { l: t("sUnderReview"), v: byStatus("under_review") },
    { l: t("sResolved"), v: byStatus("resolved") },
    { l: t("sDismissed"), v: byStatus("dismissed") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("rpTitle")}
        subtitle={t("rpSubtitle", { count: reports.length })}
        highlightLabel={t("sOpen")}
        highlightValue={num(byStatus("open"))}
        highlightIcon={Flag}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading text-2xl font-bold">{num(s.v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as ReportStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("tReportStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {REPORT_STATUSES.map((s) => (
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
            <p className="text-sm font-semibold">{t("selectedCount", { count: activeSelected.length })}</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" onClick={() => {
                for (const id of activeSelected) store.patchReport(id, { status: "resolved" });
                setSelected(new Set());
                toast.success(t("toastResolved"));
              }}>
                <Check className="size-3.5" aria-hidden="true" />
                {t("resolveReport")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => {
                for (const id of activeSelected) store.patchReport(id, { status: "dismissed" });
                setSelected(new Set());
                toast.success(t("toastDismissed"));
              }}>
                {t("dismissReport")}
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
                      aria-label={t("rpTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tTarget")}</TableHead>
                  <TableHead className="text-center">{t("tRating")}</TableHead>
                  <TableHead>{t("tReportReason")}</TableHead>
                  <TableHead>{t("tReportedBy")}</TableHead>
                  <TableHead>{t("tReview")}</TableHead>
                  <TableHead>{t("tReportStatus")}</TableHead>
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
                      })} aria-label={r.id} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <div>
                          <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                          <p className="font-mono text-xs text-muted-foreground">{r.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-sm font-semibold" title={r.target}>{r.target}</TableCell>
                    <TableCell className="text-center">
                      <Stars value={r.rating} />
                    </TableCell>
                    <TableCell>
                      <span className="bg-destructive/10 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-destructive">{r.reason}</span>
                      <p className="pt-1 text-xs whitespace-nowrap text-muted-foreground">{dateOf(r.date)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-semibold whitespace-nowrap">{r.reportedBy}</p>
                      <p className="text-xs text-muted-foreground">{r.reporterType}</p>
                    </TableCell>
                    <TableCell>
                      <ReviewStatusBadge status={r.reviewStatus} />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", REPORT_CLASS[r.status])}>
                        {t(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("reportDetails")} ${r.id}`} title={t("reportDetails")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status === "open" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchReport(r.id, { status: "under_review" }); toast.success(t("toastSaved")); }} aria-label={r.id} title={t("startReview")}>
                            <Flag className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {r.status !== "resolved" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmResolve(r.id)} aria-label={r.id} title={t("resolveReport")}>
                            <Check className="size-4 text-green-600" aria-hidden="true" />
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
              <EmptyState icon={Flag} title={t("emptyTitle")} description={t("emptyReports")} />
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
                <DialogTitle className="font-heading text-base font-bold">
                  {t("reportDetails")} · <span className="font-mono">{viewed.id}</span>
                </DialogTitle>
              </DialogHeader>
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{t("reviewInfo")}</p>
              <div className="flex flex-col divide-y divide-border border-y border-border">
                <KV label={t("tCustomer")} value={viewed.customer} />
                <KV label={t("tTarget")} value={viewed.target} />
                <KV label={t("tRating")} value={`${viewed.rating} / 5`} />
                <KV label={t("tReview")} value={`“${viewed.text}”`} />
              </div>
              <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{t("reportInfo")}</p>
              <div className="flex flex-col divide-y divide-border border-y border-border">
                <KV label={t("tReportedBy")} value={`${viewed.reportedBy} (${viewed.reporterType})`} />
                <KV label={t("tReportReason")} value={viewed.reason} bold />
                <KV label={t("additionalInfo")} value={viewed.explanation} />
                <KV label={t("tReportDate")} value={dateOf(viewed.date)} />
                <KV label={t("tReportStatus")} value={viewed.status} />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {viewed.status !== "resolved" ? (
                  <>
                    <Button variant="outline" size="sm" className="bg-card" onClick={() => { store.patchReport(viewed.id, { status: "dismissed" }); setViewId(null); toast.success(t("toastDismissed")); }}>
                      {t("dismissReport")}
                    </Button>
                    <Button variant="outline" size="sm" className="bg-card" onClick={() => { syncReview(viewed, "hidden"); setViewId(null); toast.success(t("toastHidden")); }}>
                      {t("hideReview")}
                    </Button>
                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => { resolveReport(viewed.id); setViewId(null); }}>
                      {t("resolveReport")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="bg-card" onClick={() => { syncReview(viewed, "published"); setViewId(null); toast.success(t("toastApproved")); }}>
                      {t("restoreReview")}
                    </Button>
                    <Button variant="outline" size="sm" className="bg-card text-destructive hover:text-destructive" onClick={() => {
                      if (viewed.kind === "product") store.removeProducts([viewed.reviewId]);
                      else store.removeVendors([viewed.reviewId]);
                      setViewId(null);
                      toast.success(t("toastDeleted", { count: 1 }));
                    }}>
                      {t("deleteReview")}
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmResolve} onOpenChange={(open) => !open && setConfirmResolve(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmResolve(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => confirmResolve && resolveReport(confirmResolve)}>
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
