"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Flag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CommissionTimeline } from "@/components/admin/commission/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import {
  MODERATION_REASONS,
  moderationHistoryFor,
  type ProductReview,
  type ReviewStatus,
  type VendorReview,
} from "@/features/admin/reviews";
import { useReviewsStore } from "@/store/reviews.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CLASS: Record<ReviewStatus, string> = {
  published: "bg-green-600/10 text-green-700",
  pending: "bg-primary/20 text-[#8a5a00]",
  rejected: "bg-destructive/10 text-destructive",
  hidden: "bg-muted text-muted-foreground",
  reported: "bg-destructive/10 text-destructive",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const t = useTranslations("Dashboard.reviews");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(cls, s <= value ? "fill-primary text-primary" : "text-muted-foreground")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "normal" | "high" | "urgent" }) {
  const t = useTranslations("Dashboard.reviews");
  return (
    <Badge
      className={cn(
        "font-semibold whitespace-nowrap",
        priority === "urgent"
          ? "bg-destructive/10 text-destructive"
          : priority === "high"
            ? "bg-primary/20 text-[#8a5a00]"
            : "bg-muted text-muted-foreground"
      )}
    >
      {priority === "urgent" ? <Flag className="mr-1 size-3" aria-hidden="true" /> : null}
      {t(priority)}
    </Badge>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const t = useTranslations("Dashboard.reviews");
  return (
    <Badge
      className={cn(
        "font-semibold whitespace-nowrap",
        verified ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
      )}
    >
      {t(verified ? "verified" : "unverified")}
    </Badge>
  );
}

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", bold && "font-bold text-secondary")}>{value}</span>
    </div>
  );
}

export type AnyReview =
  | ({ kind: "product" } & ProductReview)
  | ({ kind: "vendor" } & VendorReview);

export function ReviewDetailsDialog({
  review,
  onClose,
  onModerate,
}: {
  review: AnyReview | null;
  onClose: () => void;
  onModerate?: (id: string, kind: "product" | "vendor", status: ReviewStatus, reason?: string) => void;
}) {
  const t = useTranslations("Dashboard.reviews");
  const format = useFormatter();
  const [tab, setTab] = useState("overview");
  const [reason, setReason] = useState(MODERATION_REASONS[0]);
  const [notes, setNotes] = useState("");
  const patchProduct = useReviewsStore((s) => s.patchProduct);
  const patchVendor = useReviewsStore((s) => s.patchVendor);

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  if (!review) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent />
      </Dialog>
    );
  }

  const isProduct = review.kind === "product";
  const history = moderationHistoryFor(review.date, review.status).map((e) => ({
    event: e.event,
    date: e.date,
    time: "—",
    user: e.user,
    description: e.description,
  }));

  const apply = (status: ReviewStatus) => {
    const patch = {
      status,
      moderationReason: status === "published" ? undefined : reason,
      moderationDate: "2026-09-26",
    };
    if (isProduct) patchProduct(review.id, patch);
    else patchVendor(review.id, patch);
    onModerate?.(review.id, review.kind, status, reason);
    toast.success(
      status === "published" ? t("toastApproved") : status === "hidden" ? t("toastHidden") : t("toastRejected")
    );
    onClose();
  };

  return (
    <Dialog open={!!review} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
            {t("detailPanel")} · <span className="font-mono">{review.id}</span>
            <ReviewStatusBadge status={review.status} />
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
            <TabsTrigger value="review">{t("tabReview")}</TabsTrigger>
            <TabsTrigger value="reports">{t("tabReports")}</TabsTrigger>
            <TabsTrigger value="history">{t("tabHistory")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-3 border border-border bg-card p-3">
              <CustomerAvatar name={review.customer} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{review.customer}</p>
                <p className="truncate text-xs text-muted-foreground">{review.email}</p>
              </div>
              <span className="ml-auto">
                <VerifiedBadge verified={review.verified} />
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              <KV label={isProduct ? t("tProduct") : t("tVendor")} value={isProduct ? (review as ProductReview).product : (review as VendorReview).store} bold />
              <KV label={t("tRating")} value={`${review.rating} / 5`} />
              <KV label={t("tDate")} value={dateOf(review.date)} />
              {isProduct ? (
                <KV label={t("helpfulVotes")} value={String((review as ProductReview).helpful)} />
              ) : (
                <KV label={t("tOrder")} value={(review as VendorReview).orderId} />
              )}
              <KV label={t("reportCount")} value={String(review.reports)} />
            </div>
          </TabsContent>
          <TabsContent value="review" className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Stars value={review.rating} size="md" />
              <span className="text-xs text-muted-foreground">{dateOf(review.date)}</span>
            </div>
            {isProduct && (review as ProductReview).title ? (
              <p className="font-heading text-base font-bold">{(review as ProductReview).title}</p>
            ) : null}
            <p className="border border-border bg-card p-3 text-sm leading-relaxed">{review.text}</p>
            {isProduct && (review as ProductReview).images > 0 ? (
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(3, (review as ProductReview).images) }).map((_, i) => (
                  <span key={i} className="flex size-14 items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-xs font-bold text-secondary">
                    IMG
                  </span>
                ))}
                {(review as ProductReview).images > 3 ? (
                  <span className="flex size-14 items-center justify-center bg-muted text-xs font-bold">
                    +{(review as ProductReview).images - 3}
                  </span>
                ) : null}
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="reports" className="flex flex-col gap-2 pt-2 text-sm">
            {review.reports > 0 ? (
              <p className="border border-destructive/30 bg-destructive/5 px-3 py-2">
                {t("reportCount")}: <strong>{review.reports}</strong> · {review.moderationReason ?? t("open")}
              </p>
            ) : (
              <p className="py-4 text-center text-muted-foreground">{t("emptyReports")}</p>
            )}
          </TabsContent>
          <TabsContent value="history" className="pt-2">
            <CommissionTimeline events={history} />
          </TabsContent>
        </Tabs>
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t("modReason")}>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label={t("modReason")}
                className="h-9 w-full border border-border bg-card px-2 text-sm"
              >
                {MODERATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label={t("modNotes")}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPh")} className="min-h-9 bg-card" />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" className="gap-1.5 bg-green-600 text-white hover:bg-green-700" onClick={() => apply("published")}>
              {t("approve")}
            </Button>
            <Button size="sm" variant="outline" className="bg-card" onClick={() => apply("hidden")}>
              {t("hide")}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => apply("rejected")}>
              {t("reject")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
