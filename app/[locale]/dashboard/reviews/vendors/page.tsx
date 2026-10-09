"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ReviewDetailsDialog,
  ReviewStatusBadge,
  Stars,
  VerifiedBadge,
  type AnyReview,
} from "@/components/admin/reviews/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { ReviewStatus, VendorReview } from "@/features/admin/reviews";
import { useReviewsStore, useVendorReviews } from "@/store/reviews.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorReviewsPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const reviews = useVendorReviews();
  const store = useReviewsStore();
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (ratingFilter === "all" || r.rating === Number(ratingFilter)) &&
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q ||
          r.customer.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.store.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q))
    );
  }, [reviews, query, ratingFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => reviews.some((r) => r.id === id)),
    [selected, reviews]
  );
  const avg = reviews.length > 0 ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  const setStatus = (r: VendorReview, status: ReviewStatus) => {
    store.patchVendor(r.id, { status, moderationReason: status === "published" ? undefined : "Manual moderation", moderationDate: "2026-09-26" });
    toast.success(status === "published" ? t("toastApproved") : status === "hidden" ? t("toastHidden") : t("toastRejected"));
  };

  const viewed: AnyReview | null = viewId
    ? (() => {
        const r = reviews.find((x) => x.id === viewId);
        return r ? { kind: "vendor" as const, ...r } : null;
      })()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("vTitle")}
        subtitle={t("vSubtitle", { count: filtered.length })}
        highlightLabel={t("sAvgVendor")}
        highlightValue={`${avg} / 5`}
        highlightIcon={Store}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: t("sPublished"), v: reviews.filter((r) => r.status === "published").length },
          { l: t("kpiPending"), v: reviews.filter((r) => r.status === "pending").length },
          { l: t("kpiReported"), v: reviews.filter((r) => r.status === "reported").length },
          { l: t("kpiRejected"), v: reviews.filter((r) => r.status === "rejected").length },
        ].map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
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
        <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("fRating")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRatings")}</SelectItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <SelectItem key={s} value={String(s)}>{s} ★</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter((v as ReviewStatus | "all") ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("fStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {(["published", "pending", "rejected", "hidden", "reported"] as ReviewStatus[]).map((s) => (
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
                for (const id of activeSelected) store.patchVendor(id, { status: "published", moderationDate: "2026-09-26" });
                setSelected(new Set());
                toast.success(t("toastApprovedMany", { count: activeSelected.length }));
              }}>
                <Check className="size-3.5" aria-hidden="true" />
                {t("bulkApprove")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removeVendors(activeSelected);
                setSelected(new Set());
                toast.success(t("toastDeleted", { count: activeSelected.length }));
              }}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("bulkDelete")}
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
                      aria-label={t("vTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead className="text-center">{t("tRating")}</TableHead>
                  <TableHead>{t("tReview")}</TableHead>
                  <TableHead>{t("tOrder")}</TableHead>
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
                      })} aria-label={r.id} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <div>
                          <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                          <p className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(r.date)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{r.vendor}</p>
                      <p className="text-xs text-muted-foreground">{r.store}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Stars value={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={r.text}>
                      “{r.text}”
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs whitespace-nowrap">{r.orderId}</p>
                      <p className="text-xs text-muted-foreground">{r.orderAmount}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <ReviewStatusBadge status={r.status} />
                        <VerifiedBadge verified={r.verified} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status !== "published" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => setStatus(r, "published")} aria-label={r.id} title={t("approve")}>
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeVendors([r.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={r.id}>
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

      <ReviewDetailsDialog review={viewed} onClose={() => setViewId(null)} />
    </div>
  );
}
