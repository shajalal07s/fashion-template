"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { FeedbackStatus, FeedbackType } from "@/features/vendor/reviews";
import { useVendorFeedback } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";

export default function VendorFeedbackPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const feedback = useVendorFeedback();

  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const stats = useMemo(() => ({
    total: feedback.length,
    positive: feedback.filter((f) => f.sentiment === "positive").length,
    neutral: feedback.filter((f) => f.sentiment === "neutral").length,
    negative: feedback.filter((f) => f.sentiment === "negative").length,
    unresolved: feedback.filter((f) => ["new", "read", "review"].includes(f.status)).length,
    responded: feedback.filter((f) => f.responded).length,
  }), [feedback]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...feedback];
    if (fType !== "all") list = list.filter((f) => f.type === fType);
    if (fStatus !== "all") list = list.filter((f) => f.status === fStatus);
    if (needle) list = list.filter((f) => `${f.customer} ${f.product} ${f.text}`.toLowerCase().includes(needle));
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [feedback, q, fType, fStatus]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")} title={t("rwFeedback")} subtitle={`${num(stats.total)} · ${num(stats.unresolved)} ${t("rwUnresolved")}`}
        highlightLabel={t("rwFeedback")} highlightValue={num(stats.total)} highlightIcon={Inbox}
      />

      <ReviewTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <EarnStatCard label={t("rwTotal")} value={num(stats.total)} href="/vendor/reviews/feedback" accent />
        <EarnStatCard label={t("rwPositive")} value={num(stats.positive)} href="/vendor/reviews/feedback" />
        <EarnStatCard label={t("rwNeutral")} value={num(stats.neutral)} href="/vendor/reviews/feedback" />
        <EarnStatCard label={t("rwNegative")} value={num(stats.negative)} href="/vendor/reviews/feedback" />
        <EarnStatCard label={t("rwUnresolved")} value={num(stats.unresolved)} href="/vendor/reviews/feedback" />
        <EarnStatCard label={t("rwResponded")} value={num(stats.responded)} href="/vendor/reviews/feedback" />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex gap-2">
          <Select value={fType} onValueChange={(v) => setFType(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("rwType")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {(["product", "store", "delivery", "packaging", "service", "general"] as FeedbackType[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("rwStatus")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {(["new", "read", "review", "responded", "resolved", "archived"] as FeedbackStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("rwCustomer")}</TableHead>
                  <TableHead>{t("rwType")}</TableHead>
                  <TableHead>{t("rwProduct")}</TableHead>
                  <TableHead>{t("rwRating")}</TableHead>
                  <TableHead>{t("rwReview")}</TableHead>
                  <TableHead>{t("rwSentiment")}</TableHead>
                  <TableHead>{t("rwStatus")}</TableHead>
                  <TableHead className="w-24">{t("cpActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <CustomerAvatar name={f.customer} size="sm" />
                        <span className="max-w-24 truncate text-sm font-bold">{f.customer}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{f.type}</TableCell>
                    <TableCell className="max-w-32 truncate text-xs">{f.product}</TableCell>
                    <TableCell><StarsRow value={f.rating} /></TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate text-sm" title={f.text}>{f.text}</p>
                      <p className="text-[11px] text-muted-foreground">{dateOf(f.date)}{f.responded ? ` · ${t("rwResponded")}` : ""}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold",
                        f.sentiment === "positive" ? "bg-green-600/10 text-green-700"
                        : f.sentiment === "negative" ? "bg-destructive/10 text-destructive"
                        : "bg-primary/20 text-[#8a5a00]")}>
                        {f.sentiment}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{f.status}</TableCell>
                    <TableCell>
                      <Link href={`/vendor/reviews/feedback/${f.id}`}>
                        <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]">{t("view")}</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <div className="py-8"><EmptyState icon={Inbox} title={t("eNoResults")} description={t("emptyDescription")} /></div>}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {filtered.length > 0 ? filtered.map((f) => (
            <div key={f.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-bold">{f.customer}</span>
                <StarsRow value={f.rating} />
              </div>
              <p className="line-clamp-3 text-sm">“{f.text}”</p>
              <p className="text-[11px] text-muted-foreground">{f.type} · {f.status} · {dateOf(f.date)}</p>
              <Link href={`/vendor/reviews/feedback/${f.id}`} className="border-t border-border pt-2 text-xs font-bold text-secondary hover:underline">{t("view")}</Link>
            </div>
          )) : <EmptyState icon={Inbox} title={t("eNoResults")} description={t("emptyDescription")} />}
        </CardContent>
      </Card>
    </div>
  );
}
