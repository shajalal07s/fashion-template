"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Hourglass,
  Search,
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
import { Input } from "@/components/ui/input";
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
  PriorityBadge,
  ReviewDetailsDialog,
  Stars,
  VerifiedBadge,
  type AnyReview,
} from "@/components/admin/reviews/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { reviewPriority } from "@/features/admin/reviews";
import { useProductReviews, useReviewsStore, useVendorReviews } from "@/store/reviews.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NOW = +new Date("2026-09-26");

interface QueueRow {
  id: string;
  kind: "product" | "vendor";
  customer: string;
  target: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  reports: number;
}

export default function PendingReviewsPage() {
  const t = useTranslations("Dashboard.reviews");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const products = useProductReviews();
  const vendors = useVendorReviews();
  const store = useReviewsStore();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState<"reject" | "delete" | null>(null);

  const queue = useMemo<QueueRow[]>(() => {
    const list: QueueRow[] = [
      ...products
        .filter((r) => r.status === "pending")
        .map((r) => ({ id: r.id, kind: "product" as const, customer: r.customer, target: r.product, rating: r.rating, text: r.text, date: r.date, verified: r.verified, reports: r.reports })),
      ...vendors
        .filter((r) => r.status === "pending")
        .map((r) => ({ id: r.id, kind: "vendor" as const, customer: r.customer, target: r.store, rating: r.rating, text: r.text, date: r.date, verified: r.verified, reports: r.reports })),
    ];
    const prioRank = (q: QueueRow) => {
      const p = reviewPriority(q.reports, "pending", q.date);
      return p === "urgent" ? 0 : p === "high" ? 1 : 2;
    };
    return list.sort((a, b) => prioRank(a) - prioRank(b) || +new Date(a.date) - +new Date(b.date));
  }, [products, vendors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((r) => r.customer.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
  }, [queue, query]);

  const activeSelected = useMemo(
    () => [...selected].filter((id) => queue.some((r) => `${r.kind}:${r.id}` === id)),
    [selected, queue]
  );

  const waitingDays = (date: string) =>
    Math.max(0, Math.round((NOW - +new Date(date)) / 86400000));

  const oldest = queue.length > 0 ? queue.reduce((a, b) => (+new Date(a.date) < +new Date(b.date) ? a : b)) : null;
  const highCount = queue.filter((q) => reviewPriority(q.reports, "pending", q.date) !== "normal").length;

  const patchRow = (row: QueueRow, status: "published" | "rejected" | "hidden") => {
    const patch = { status, moderationReason: status === "published" ? undefined : "Manual moderation", moderationDate: "2026-09-26" };
    if (row.kind === "product") store.patchProduct(row.id, patch);
    else store.patchVendor(row.id, patch);
  };

  const bulkAction = (action: "approve" | "reject" | "delete") => {
    for (const key of activeSelected) {
      const [kind, ...rest] = key.split(":");
      const id = rest.join(":");
      if (action === "delete") {
        if (kind === "product") store.removeProducts([id]);
        else store.removeVendors([id]);
      } else {
        const status = action === "approve" ? "published" : "rejected";
        if (kind === "product") store.patchProduct(id, { status, moderationDate: "2026-09-26" });
        else store.patchVendor(id, { status, moderationDate: "2026-09-26" });
      }
    }
    toast.success(
      action === "approve"
        ? t("toastApprovedMany", { count: activeSelected.length })
        : t("toastDeleted", { count: activeSelected.length })
    );
    setSelected(new Set());
    setConfirmBulk(null);
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

  const stats = [
    { l: t("sTotalPending"), v: queue.length },
    { l: t("sProductPending"), v: queue.filter((q) => q.kind === "product").length },
    { l: t("sVendorPending"), v: queue.filter((q) => q.kind === "vendor").length },
    { l: t("sHighPriority"), v: highCount },
    { l: t("sOldest"), v: oldest ? `${waitingDays(oldest.date)}d` : "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reviews")}
        title={t("pdTitle")}
        subtitle={t("pdSubtitle", { count: queue.length })}
        highlightLabel={t("sHighPriority")}
        highlightValue={num(highCount)}
        highlightIcon={Hourglass}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading text-2xl font-bold">{typeof s.v === "number" ? num(s.v) : s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
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
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive hover:text-destructive" onClick={() => setConfirmBulk("delete")}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("bulkDelete")}
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((r) => selected.has(`${r.kind}:${r.id}`))}
                      indeterminate={filtered.some((r) => selected.has(`${r.kind}:${r.id}`)) && !filtered.every((r) => selected.has(`${r.kind}:${r.id}`))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const r of filtered) {
                            if (v === true) next.add(`${r.kind}:${r.id}`);
                            else next.delete(`${r.kind}:${r.id}`);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("pdTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tTarget")}</TableHead>
                  <TableHead className="text-center">{t("tRating")}</TableHead>
                  <TableHead>{t("tReview")}</TableHead>
                  <TableHead className="text-right">{t("tWaiting")}</TableHead>
                  <TableHead>{t("tPriority")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const key = `${r.kind}:${r.id}`;
                  const priority = reviewPriority(r.reports, "pending", r.date);
                  return (
                    <TableRow key={key} className={cn(selected.has(key) && "bg-secondary/5")}>
                      <TableCell>
                        <Checkbox checked={selected.has(key)} onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(key);
                          else next.delete(key);
                          return next;
                        })} aria-label={r.id} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CustomerAvatar name={r.customer} size="sm" />
                          <div>
                            <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                            <VerifiedBadge verified={r.verified} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {t(r.kind === "product" ? "typeProduct" : "typeVendor")}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm font-semibold" title={r.target}>{r.target}</TableCell>
                      <TableCell className="text-center">
                        <Stars value={r.rating} />
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-xs text-muted-foreground" title={r.text}>
                        “{r.text}”
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold whitespace-nowrap">
                        {waitingDays(r.date)}d
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setViewKey(key)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => { patchRow(r, "published"); toast.success(t("toastApproved")); }} aria-label={r.id} title={t("approve")}>
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { patchRow(r, "rejected"); toast.success(t("toastRejected")); }} aria-label={r.id} title={t("reject")}>
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Hourglass} title={t("emptyTitle")} description={t("emptyPending")} />
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDetailsDialog review={viewed} onClose={() => setViewKey(null)} />

      <Dialog open={!!confirmBulk} onOpenChange={(open) => !open && setConfirmBulk(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {confirmBulk === "delete" ? t("deleteTitle") : t("rejectTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmBulk === "delete" ? t("deleteDesc") : t("rejectDesc")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmBulk(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={() => confirmBulk && bulkAction(confirmBulk === "delete" ? "delete" : "reject")}>
              {confirmBulk === "delete" ? t("deleteBtn") : t("rejectBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
