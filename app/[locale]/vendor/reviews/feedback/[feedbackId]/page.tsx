"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { feedbackResponseSchema, type FeedbackStatus } from "@/features/vendor/reviews";
import { useVendorFeedback, useVendorStore } from "@/store/vendor.store";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { toast } from "sonner";

export default function VendorFeedbackDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ feedbackId: string }>();
  const id = params.feedbackId;
  const feedback = useVendorFeedback();
  const store = useVendorStore();

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const item = useMemo(() => feedback.find((f) => f.id === id), [feedback, id]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("responded");
  const [editing, setEditing] = useState(false);

  if (!item) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero eyebrow={t("nav_reviews")} title={t("rwFeedback")} subtitle={id} highlightLabel={t("rwStatus")} highlightValue="—" highlightIcon={Inbox}>
          <Link href="/vendor/reviews/feedback" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("rwFeedback")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Inbox} title={t("emptyTitle")} description={t("emptyDescription")} />
      </div>
    );
  }

  const submit = () => {
    const parsed = feedbackResponseSchema.safeParse({ response: draft.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid response");
      return;
    }
    store.respondFeedback(item.id, draft.trim(), status);
    store.notifyVendor(`Feedback ${item.id} responded.`, "review");
    setEditing(false);
    setDraft("");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")} title={`${t("rwFeedback")} · ${item.id}`} subtitle={`${item.customer} · ${dateOf(item.date)}`}
        highlightLabel={t("rwRating")} highlightValue={`${item.rating} / 5`} highlightIcon={Inbox}
      >
        <Link href="/vendor/reviews/feedback" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("rwFeedback")}
        </Link>
        {item.productId ? (
          <Link href={`/vendor/products/${item.productId}`} className={heroPillClassName}>
            {t("rwProduct")}
          </Link>
        ) : null}
      </AccountingHero>

      <ReviewTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <CustomerAvatar name={item.customer} />
              <div>
                <p className="text-sm font-bold">{item.customer}</p>
                <p className="text-[11px] text-muted-foreground">{item.type} · {item.sentiment} · {item.status} · {dateOf(item.date)}</p>
              </div>
              <span className="ml-auto"><StarsRow value={item.rating} /></span>
            </div>
            <p className="text-sm font-semibold">{item.product}</p>
            <p className="text-sm">{item.text}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("rwReply")}</CardTitle>
            {item.responded && !editing ? (
              <Button variant="outline" size="sm" className="h-7 bg-card text-[11px]" onClick={() => { setDraft(item.reply ?? ""); setEditing(true); }}>
                {t("rwEditResponse")}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {item.responded && !editing ? (
              <div className="border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">{item.status}</p>
                <p className="pt-1 text-sm">{item.reply}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Field label={t("rwWriteResponse")}>
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} className="bg-card" maxLength={500} />
                </Field>
                <p className="text-right text-[11px] text-muted-foreground">{draft.length}/500 {t("rwChars")}</p>
                <Field label={t("rwStatus")}>
                  <Select value={status} onValueChange={(v) => setStatus((v as FeedbackStatus) ?? "responded")}>
                    <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["read", "review", "responded", "resolved", "archived"] as FeedbackStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex justify-end gap-2">
                  {editing ? <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(""); }}>{t("cancel")}</Button> : null}
                  <Button size="sm" onClick={submit} disabled={!draft.trim()}>{t("rwSubmitResponse")}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
