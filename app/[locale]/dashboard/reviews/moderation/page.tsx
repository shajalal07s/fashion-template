"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Flag,
  Gavel,
  Hourglass,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import {
  PriorityBadge,
  ReviewDetailsDialog,
  ReviewStatusBadge,
  Stars,
  VerifiedBadge,
  type AnyReview,
} from "@/components/admin/reviews/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { reviewPriority } from "@/features/admin/reviews";
import { useProductReviews, useReviewsStore, useVendorReviews } from "@/store/reviews.store";
import { toast } from "sonner";

interface QueueItem {
  key: string;
  kind: "product" | "vendor";
  id: string;
  customer: string;
  target: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  reports: number;
  status: string;
}

export default function ReviewModerationPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const products = useProductReviews();
  const vendors = useVendorReviews();
  const store = useReviewsStore();
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const queue = useMemo<QueueItem[]>(() => {
    const list: QueueItem[] = [
      ...products
        .filter((r) => r.status === "pending" || r.status === "reported")
        .map((r) => ({ key: `product:${r.id}`, kind: "product" as const, id: r.id, customer: r.customer, target: r.product, rating: r.rating, text: r.text, date: r.date, verified: r.verified, reports: r.reports, status: r.status })),
      ...vendors
        .filter((r) => r.status === "pending" || r.status === "reported")
        .map((r) => ({ key: `vendor:${r.id}`, kind: "vendor" as const, id: r.id, customer: r.customer, target: r.store, rating: r.rating, text: r.text, date: r.date, verified: r.verified, reports: r.reports, status: r.status })),
    ];
    const rank = (q: QueueItem) => {
      const p = reviewPriority(q.reports, q.status === "reported" ? "reported" : "pending", q.date);
      return p === "urgent" ? 0 : p === "high" ? 1 : 2;
    };
    return list.sort((a, b) => rank(a) - rank(b) || +new Date(a.date) - +new Date(b.date));
  }, [products, vendors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((r) => r.customer.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
  }, [queue, query]);

  const stats = [
    { l: t("pdTitle"), v: queue.length },
    { l: t("kpiReported"), v: queue.filter((q) => q.status === "reported").length },
    { l: t("sRecentlyApproved"), v: [...products, ...vendors].filter((r) => r.status === "published").length },
    { l: t("sRecentlyRejected"), v: [...products, ...vendors].filter((r) => r.status === "rejected").length },
    { l: t("sRecentlyHidden"), v: [...products, ...vendors].filter((r) => r.status === "hidden").length },
    { l: t("sAttention"), v: queue.filter((q) => reviewPriority(q.reports, q.status === "reported" ? "reported" : "pending", q.date) === "urgent").length },
  ];

  const patchItem = (q: QueueItem, status: "published" | "rejected" | "hidden") => {
    const patch = { status, moderationReason: status === "published" ? undefined : "Manual moderation", moderationDate: "2026-09-26" };
    if (q.kind === "product") store.patchProduct(q.id, patch);
    else store.patchVendor(q.id, patch);
    toast.success(status === "published" ? t("toastApproved") : status === "hidden" ? t("toastHidden") : t("toastRejected"));
  };

  const deleteItem = (key: string) => {
    const [kind, ...rest] = key.split(":");
    const id = rest.join(":");
    if (kind === "product") store.removeProducts([id]);
    else store.removeVendors([id]);
    setConfirmDelete(null);
    toast.success(t("toastDeleted", { count: 1 }));
  };

  const viewed: AnyReview | null = viewKey
    ? (() => {
        const [kind, ...rest] = viewKey.split(":");
        const id = rest.join(":");
        if (kind === "product") {
          const r = products.find((x) => x.id === id);
          return r ? { kind: "product" as const, ...r } : null;
        }
        const r = vendors.find((x) => x.id === id);
        return r ? { kind: "vendor" as const, ...r } : null;
      })()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("mdTitle")}
        subtitle={t("mdSubtitle")}
        highlightLabel={t("queue")}
        highlightValue={num(queue.length)}
        highlightIcon={Gavel}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading text-2xl font-bold">{num(s.v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="flex flex-row items-center gap-2 pt-4 pb-2">
          <Hourglass className="size-4 text-secondary" aria-hidden="true" />
          <CardTitle className="font-heading text-base font-bold">
            {t("queue")} ({num(filtered.length)})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((q) => {
              const priority = reviewPriority(q.reports, q.status === "reported" ? "reported" : "pending", q.date);
              return (
                <div key={q.key} className="flex flex-col gap-2 border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <CustomerAvatar name={q.customer} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-bold">{q.customer}</span>
                        <Stars value={q.rating} />
                        <VerifiedBadge verified={q.verified} />
                        <PriorityBadge priority={priority} />
                      </p>
                      <p className="truncate text-xs font-semibold text-secondary" title={q.target}>{q.target}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground" title={q.text}>“{q.text}”</p>
                      <p className="pt-0.5 text-[11px] text-muted-foreground">
                        {dateOf(q.date)} · {q.reports} {t("tReports")} · <ReviewStatusBadge status={q.status as "pending"} />
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setViewKey(q.key)} aria-label={`${t("viewTitle")} ${q.id}`} title={t("viewTitle")}>
                      <Eye className="size-4" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => patchItem(q, "published")} aria-label={q.id} title={t("approve")}>
                      <Check className="size-4 text-green-600" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => patchItem(q, "hidden")} aria-label={q.id} title={t("hide")}>
                      <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => patchItem(q, "rejected")} aria-label={q.id} title={t("reject")}>
                      <X className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(q.key)} aria-label={q.id} title={t("delete")}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4">
              <EmptyState icon={Flag} title={t("emptyTitle")} description={t("emptyPending")} />
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDetailsDialog review={viewed} onClose={() => setViewKey(null)} />

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("deleteDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={() => confirmDelete && deleteItem(confirmDelete)}>
              {t("deleteBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
