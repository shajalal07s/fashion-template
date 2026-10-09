"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, Copy, Download, Printer, Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { enrichPayout, payoutTimeline } from "@/features/vendor/payouts";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorPayouts } from "@/store/vendor.store";
import { PoStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function KV({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", bold && "font-bold text-secondary", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

export default function VendorPayoutDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ payoutId: string }>();
  const id = params.payoutId;
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const detail = useMemo(() => {
    const p = payouts.find((x) => x.id === id);
    return p ? enrichPayout(p) : null;
  }, [payouts, id]);

  if (!detail) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_payouts")} title={t("poHistory")} subtitle={id}
          highlightLabel={t("tStatus")} highlightValue="—" highlightIcon={Receipt}
        >
          <Link href="/vendor/payouts/history" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("poHistory")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Receipt} title={t("emptyTitle")} description={t("poEmptyDesc")} />
      </div>
    );
  }

  const steps = payoutTimeline(detail);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={`${t("tPayout")} ${detail.id}`}
        subtitle={`${detail.method} · ${money(detail.amount)}`}
        highlightLabel={t("tStatus")}
        highlightValue={detail.status}
        highlightIcon={Receipt}
      >
        <Link href="/vendor/payouts/history" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("poHistory")}
        </Link>
        <button
          type="button"
          onClick={() => {
            downloadCsv(`payout-${detail.id}.csv`, ["field", "value"],
              [["id", detail.id], ["amount", detail.amount], ["net", detail.net], ["ref", detail.reference]]);
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          {t("poReceipt")}
        </button>
        <button type="button" onClick={() => window.setTimeout(() => printInvoiceDoc(`Payout ${detail.id}`), 50)} className={heroPillClassName}>
          <Printer className="size-3.5" aria-hidden="true" />
          {t("ePrint")}
        </button>
      </AccountingHero>

      <div className="flex items-center gap-2">
        <PoStatusBadge status={detail.status} />
        <span className="font-mono text-xs text-muted-foreground">{detail.reference}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("tPayout")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <KV label={t("tPayout")} value={detail.id} mono bold />
            <KV label={t("tDate")} value={detail.requested} />
            <KV label={t("tAmount")} value={money(detail.amount)} bold />
            <KV label={t("poFee")} value={money(detail.fee)} />
            <KV label={t("poNet")} value={money(detail.net)} bold />
            <KV label={t("poMethod")} value={detail.method} />
            <KV label={t("poAccount")} value={detail.account} mono />
            <KV label={t("tStatus")} value={detail.status} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("poTimeline")}</CardTitle>
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
                    <span className="block font-bold">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.date}</span>
                  </span>
                </li>
              ))}
            </ol>
            {detail.failureReason ? (
              <p className="mt-3 border border-destructive/30 bg-destructive/5 p-2.5 text-sm font-semibold text-destructive" role="alert">
                {t("poFailure")}: {detail.failureReason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("poTxn")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:flex-wrap">
          {[`${t("poTxn")}: ${detail.txnId}`, `${t("poRef")}: ${detail.reference}`].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { void navigator.clipboard.writeText(s.split(": ")[1] ?? s); toast.success(t("eCopyRef")); }}
              className="flex items-center gap-1.5 border border-border px-3 py-2 font-mono text-xs font-bold transition-colors hover:border-secondary hover:text-secondary"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {s}
            </button>
          ))}
          <span className="px-3 py-2 text-xs text-muted-foreground">
            {t("poProcessed")}: {detail.processed || "—"} · {t("poExpected")}: {detail.expected}
          </span>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="bg-card" onClick={() => { void navigator.clipboard.writeText(detail.id); toast.success(t("eCopyTxn")); }}>
          {t("eCopyTxn")}
        </Button>
      </div>
    </div>
  );
}
