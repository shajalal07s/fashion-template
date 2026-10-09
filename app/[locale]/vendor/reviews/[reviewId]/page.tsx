"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, Pencil, ThumbsUp, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import {
  enrichReviews,
  reviewResponseSchema,
  reviewTimeline,
} from "@/features/vendor/reviews";
import { useVendorProducts, useVendorReviews, useVendorStore } from "@/store/vendor.store";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorReviewDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ reviewId: string }>();
  const id = params.reviewId;
  const raw = useVendorReviews();
  const products = useVendorProducts();
  const store = useVendorStore();

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const review = useMemo(() => enrichReviews(raw, products).find((r) => r.id === id), [raw, products, id]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!review) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero eyebrow={t("nav_reviews")} title={t("rwTitle2")} subtitle={id} highlightLabel={t("rwStatus")} highlightValue="—" highlightIcon={MessageSquare}>
          <Link href="/vendor/reviews/products" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("rwProducts")}
          </Link>
        </AccountingHero>
        <EmptyState icon={MessageSquare} title={t("emptyTitle")} description={t("emptyReviews")} />
      </div>
    );
  }

  const steps = reviewTimeline(review);

  const submit = () => {
    const parsed = reviewResponseSchema.safeParse({ response: draft.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid response");
      return;
    }
    if (review.replied) store.editReviewReply(review.id, draft.trim());
    else store.replyReview(review.id, draft.trim());
    store.notifyVendor(`Response ${review.replied ? "edited" : "published"} for review ${review.id}.`, "review");
    setEditing(false);
    setDraft("");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")} title={`${t("rwTitle2")} · ${review.id}`} subtitle={`${review.customer} · ${dateOf(review.date)}`}
        highlightLabel={t("rwRating")} highlightValue={`${review.rating} / 5`} highlightIcon={MessageSquare}
      >
        <Link href="/vendor/reviews/products" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("rwProducts")}
        </Link>
        {review.productId ? (
          <Link href={`/vendor/products/${review.productId}`} className={heroPillClassName}>
            {t("rwProduct")}
          </Link>
        ) : null}
      </AccountingHero>

      <ReviewTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2.5">
                <CustomerAvatar name={review.customer} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{review.customer}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {review.verified ? `✓ ${t("rwVerified")}` : t("rwStatus")} · {dateOf(review.date)} · {review.status}
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1.5">
                  <StarsRow value={review.rating} />
                  <span className="font-heading text-lg font-bold">{review.rating}.0</span>
                </span>
              </div>
              <p className="font-heading text-base font-bold">{review.title}</p>
              <p className="text-sm">{review.text}</p>
              {review.images.length > 0 ? (
                <div className="flex gap-2">
                  {review.images.map((src) => (
                    <button key={src} type="button" onClick={() => setLightbox(src)} className="transition-opacity hover:opacity-80" aria-label="Open image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={review.product} className="size-20 object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ThumbsUp className="size-3.5" aria-hidden="true" />
                {review.helpful} {t("rwHelpful")}{review.reports > 0 ? ` · ${review.reports} ${t("rwReports")}` : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("rwResponse")}</CardTitle>
              {review.replied ? (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 bg-card text-[11px]" onClick={() => { setDraft(review.reply ?? ""); setEditing(true); }}>
                    <Pencil className="size-3" aria-hidden="true" />
                    {t("rwEditResponse")}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 bg-card text-[11px] text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-3" aria-hidden="true" />
                    {t("rwDeleteResponse")}
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {review.replied && !editing ? (
                <div className="border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{review.responseDate} · Ayesha Boutique</p>
                  <p className="pt-1 text-sm">{review.reply}</p>
                </div>
              ) : !review.replied && !editing ? (
                <Button size="sm" onClick={() => { setDraft(""); setEditing(true); }}>{t("rwRespond")}</Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("rwWriteResponse")} rows={4} className="bg-card" maxLength={500} />
                  <p className="text-right text-[11px] text-muted-foreground">{draft.length}/500 {t("rwChars")}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(""); }}>{t("cancel")}</Button>
                    <Button size="sm" onClick={submit} disabled={!draft.trim()}>{t("rwSubmitResponse")}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("rwProduct")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {review.productId ? (
                <Link href={`/vendor/products/${review.productId}`} className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={review.image} alt={review.product} className="size-12 shrink-0 object-cover" loading="lazy" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{review.product}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{review.sku}</span>
                  </span>
                </Link>
              ) : <p className="text-sm">{review.product}</p>}
              <div className="flex justify-between pt-2 text-sm">
                <span className="text-muted-foreground">{t("rwOrderRef")}</span>
                <Link href={`/vendor/orders/${review.orderId}`} className="font-mono text-xs font-bold text-secondary hover:underline">{review.orderId}</Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("rwTimeline")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ol className="flex flex-col gap-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      s.done ? "bg-green-600 text-white" : "bg-muted text-muted-foreground")}>
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block", s.done ? "font-bold" : "text-muted-foreground")}>{s.label}</span>
                      <span className="block text-xs text-muted-foreground">{s.date}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o: boolean) => !o && setLightbox(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{review.product}</DialogTitle>
          </DialogHeader>
          {lightbox ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox} alt={review.product} className="max-h-[70vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("rwDeleteResponse")}?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>{t("cancel")}</Button>
            <Button
              size="sm"
              onClick={() => {
                store.deleteReviewReply(review.id);
                store.notifyVendor(`Response deleted for review ${review.id}.`, "review");
                setConfirmDelete(false);
                toast.success(t("toastSaved"));
              }}
            >
              {t("rwDeleteResponse")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
