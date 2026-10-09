"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { useCustomerDirectory } from "@/components/admin/customers/useCustomerDirectory";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { reviewsForCustomer, type CustomerReview, type ReviewStatus } from "@/features/admin/customer-mgmt";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REVIEW_STATUSES: ReviewStatus[] = ["published", "pending", "hidden", "reported", "rejected"];
const REVIEW_CLASS: Record<ReviewStatus, string> = {
  published: "bg-green-600/10 text-green-700",
  pending: "bg-primary/20 text-[#8a5a00]",
  hidden: "bg-muted text-muted-foreground",
  reported: "bg-destructive/10 text-destructive",
  rejected: "bg-destructive/10 text-destructive",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("size-3.5", s <= value ? "fill-primary text-primary" : "text-muted-foreground")} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function CustomerReviewsPage() {
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const directory = useCustomerDirectory();
  const orders = useAdminOrders();
  const mgmt = useCustomerMgmtStore();
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewReview, setViewReview] = useState<CustomerReview | null>(null);
  const [responseText, setResponseText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const all = useMemo(() => {
    const list: CustomerReview[] = [];
    for (const c of directory) {
      for (const r of reviewsForCustomer(c.email, c.name, orders)) {
        if (mgmt.deletedReviews.includes(r.id)) continue;
        list.push({
          ...r,
          status: mgmt.reviewStatus[r.id] ?? r.status,
          response: mgmt.reviewResponses[r.id] ?? r.response,
        });
      }
    }
    return list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [directory, orders, mgmt.deletedReviews, mgmt.reviewStatus, mgmt.reviewResponses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q || r.customer.toLowerCase().includes(q) || r.product.toLowerCase().includes(q))
    );
  }, [all, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={tm("rTitle")}
        subtitle={tm("rSubtitle", { count: all.length })}
        highlightLabel={tm("tReviews")}
        highlightValue={String(all.length)}
        highlightIcon={Star}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={tm("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "all" | ReviewStatus); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tm("all")}</SelectItem>
            {REVIEW_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tm(`r${s[0].toUpperCase()}${s.slice(1)}` as "rPublished")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{tm("tCustomer")}</TableHead>
                  <TableHead>{tm("tProduct")}</TableHead>
                  <TableHead className="text-center">{tm("tRating")}</TableHead>
                  <TableHead>{tm("tReview")}</TableHead>
                  <TableHead>{tm("tReviewStatus")}</TableHead>
                  <TableHead className="w-32">{tm("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <div>
                          <p className="max-w-32 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                          <p className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(r.date)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm" title={r.product}>{r.product}</TableCell>
                    <TableCell className="text-center">
                      <Stars value={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-xs text-muted-foreground" title={r.text}>{r.text}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", REVIEW_CLASS[r.status])}>
                        {tm(`r${r.status[0].toUpperCase()}${r.status.slice(1)}` as "rPublished")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setViewReview(r); setResponseText(r.response ?? ""); }} aria-label={`${tm("viewTitle")} ${r.id}`} title={tm("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status !== "published" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { mgmt.setReviewStatus(r.id, "published"); toast.success(tm("toastSaved")); }} aria-label={r.id} title={tm("rPublished")}>
                            <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { mgmt.setReviewStatus(r.id, "hidden"); toast.success(tm("toastSaved")); }} aria-label={r.id} title={tm("rHidden")}>
                            <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(r.id)} aria-label={r.id}>
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
              <EmptyState icon={Star} title={tm("emptyTitle")} description={tm("emptyReviews")} />
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

      <Dialog open={!!viewReview} onOpenChange={(open) => !open && setViewReview(null)}>
        <DialogContent className="sm:max-w-md">
          {viewReview ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewReview.product}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Stars value={viewReview.rating} />
                <span className="text-xs text-muted-foreground">{viewReview.customer} · {dateOf(viewReview.date)}</span>
              </div>
              <p className="text-sm">{viewReview.text}</p>
              <Field label={tm("respond")}>
                <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder={tm("responsePh")} className="bg-card" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewReview(null)}>{tm("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { mgmt.setReviewResponse(viewReview.id, responseText); setViewReview(null); toast.success(tm("toastSaved")); }}>
                  {tm("saveBtn")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{tm("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tm("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>{tm("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirmDelete) mgmt.deleteReview(confirmDelete); setConfirmDelete(null); toast.success(tm("toastDeleted", { count: 1 })); }}>
              {tm("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
