"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Flag,
  MoreHorizontal,
  Search,
  Star,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { ProductReview, ReviewStatus } from "@/features/admin/reviews";
import { useProductReviews, useReviewsStore } from "@/store/reviews.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highest" | "lowest" | "reported" | "helpful";

export default function ProductReviewsPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const reviews = useProductReviews();
  const store = useReviewsStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState<"reject" | "delete" | "hide" | null>(null);

  const vendors = useMemo(() => [...new Set(reviews.map((r) => r.vendor))], [reviews]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (ratingFilter === "all" || r.rating === Number(ratingFilter)) &&
        (statusFilter === "all" || r.status === statusFilter) &&
        (vendorFilter === "all" || r.vendor === vendorFilter) &&
        (!q ||
          r.customer.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q))
    );
  }, [reviews, query, ratingFilter, statusFilter, vendorFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "oldest":
        list.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        break;
      case "highest":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        list.sort((a, b) => a.rating - b.rating);
        break;
      case "reported":
        list.sort((a, b) => b.reports - a.reports);
        break;
      case "helpful":
        list.sort((a, b) => b.helpful - a.helpful);
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
    () => [...selected].filter((id) => reviews.some((r) => r.id === id)),
    [selected, reviews]
  );

  const setStatus = (r: ProductReview, status: ReviewStatus) => {
    store.patchProduct(r.id, { status, moderationReason: status === "published" ? undefined : "Manual moderation", moderationDate: "2026-09-26" });
    toast.success(status === "published" ? t("toastApproved") : status === "hidden" ? t("toastHidden") : t("toastRejected"));
  };

  const bulkAction = (action: "approve" | "reject" | "hide" | "delete") => {
    if (action === "delete") {
      store.removeProducts(activeSelected);
      toast.success(t("toastDeleted", { count: activeSelected.length }));
    } else {
      const status: ReviewStatus = action === "approve" ? "published" : action === "reject" ? "rejected" : "hidden";
      for (const id of activeSelected) store.patchProduct(id, { status, moderationDate: "2026-09-26" });
      toast.success(action === "approve" ? t("toastApprovedMany", { count: activeSelected.length }) : t("toastSaved"));
    }
    setSelected(new Set());
    setConfirmBulk(null);
  };

  const clearFilters = () => {
    setQuery("");
    setRatingFilter("all");
    setStatusFilter("all");
    setVendorFilter("all");
    setPage(0);
  };

  const viewed: AnyReview | null = viewId
    ? (() => {
        const r = reviews.find((x) => x.id === viewId);
        return r ? { kind: "product" as const, ...r } : null;
      })()
    : null;

  const exportCsv = () => {
    const list = activeSelected.length > 0 ? reviews.filter((r) => selected.has(r.id)) : filtered;
    if (list.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["id", "customer", "product", "vendor", "rating", "status", "date"].join(","),
      ...list.map((r) => [r.id, r.customer, r.product, r.vendor, r.rating, r.status, r.date].map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-reviews.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("pTitle")}
        subtitle={t("pSubtitle", { count: filtered.length })}
        highlightLabel={t("sAvg")}
        highlightValue={`${reviews.length > 0 ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0} / 5`}
        highlightIcon={Star}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: t("sPublished"), v: reviews.filter((r) => r.status === "published").length },
          { l: t("sPending"), v: reviews.filter((r) => r.status === "pending").length },
          { l: t("sReported"), v: reviews.filter((r) => r.status === "reported").length },
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

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
              {(["published", "pending", "rejected", "hidden"] as ReviewStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{t(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("fVendor")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["newest", "oldest", "highest", "lowest", "reported", "helpful"] as SortKey[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 bg-card" onClick={exportCsv}>
            <Download className="size-3.5" aria-hidden="true" />
            CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{t("selectedCount", { count: activeSelected.length })}</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" onClick={() => bulkAction("approve")}>
                <Check className="size-3.5" aria-hidden="true" />
                {t("bulkApprove")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => setConfirmBulk("reject")}>
                {t("bulkReject")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => setConfirmBulk("hide")}>
                {t("bulkHide")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => setConfirmBulk("delete")}>
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
                      aria-label={t("pTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead className="text-center">{t("tRating")}</TableHead>
                  <TableHead>{t("tReview")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="text-center">{t("tHelpful")}</TableHead>
                  <TableHead className="text-center">{t("tReports")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
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
                          <p className="max-w-32 truncate text-xs text-muted-foreground" title={r.email}>{r.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-40 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.sku} · {r.vendor}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Stars value={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={`${r.title} — ${r.text}`}>
                      “{r.text}”
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <ReviewStatusBadge status={r.status} />
                        <VerifiedBadge verified={r.verified} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold">{num(r.helpful)}</TableCell>
                    <TableCell className="text-center">
                      {r.reports > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                          <Flag className="size-3" aria-hidden="true" />
                          {r.reports}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label={r.id} />}
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-48">
                            {r.status !== "published" ? (
                              <DropdownMenuItem onClick={() => setStatus(r, "published")}>
                                <Check className="size-3.5 text-green-600" aria-hidden="true" />
                                {t("approve")}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => setStatus(r, r.status === "hidden" ? "published" : "hidden")}>
                              <Eye className="size-3.5" aria-hidden="true" />
                              {r.status === "hidden" ? t("unhide") : t("hide")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(r, "rejected")}>
                              <X className="size-3.5 text-destructive" aria-hidden="true" />
                              {t("reject")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => store.patchProduct(r.id, { reports: r.reports + 1, status: "reported" })}>
                              <Flag className="size-3.5" aria-hidden="true" />
                              {t("markReported")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { store.removeProducts([r.id]); toast.success(t("toastDeleted", { count: 1 })); }} className="text-destructive">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={Star} title={t("emptyTitle")} description={t("emptyDescription")} />
              <Button variant="outline" size="sm" className="bg-card" onClick={clearFilters}>
                {t("clearFilters")}
              </Button>
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {from}–{to} of {num(sorted.length)} reviews
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

      <ReviewDetailsDialog review={viewed} onClose={() => setViewId(null)} />

      <Dialog open={!!confirmBulk} onOpenChange={(open) => !open && setConfirmBulk(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {confirmBulk === "delete" ? t("deleteTitle") : confirmBulk === "reject" ? t("rejectTitle") : t("confirmTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmBulk === "delete" ? t("deleteDesc") : confirmBulk === "reject" ? t("rejectDesc") : t("confirmDesc")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmBulk(null)}>{t("cancelBtn")}</Button>
            <Button
              size="sm"
              variant={confirmBulk === "delete" || confirmBulk === "reject" ? "destructive" : "default"}
              onClick={() => confirmBulk && bulkAction(confirmBulk === "delete" ? "delete" : confirmBulk === "reject" ? "reject" : "hide")}
            >
              {confirmBulk === "delete" ? t("deleteBtn") : confirmBulk === "reject" ? t("rejectBtn") : t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
