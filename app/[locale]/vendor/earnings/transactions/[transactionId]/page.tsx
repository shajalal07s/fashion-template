"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, Copy, Download, Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { buildVendorTransactions, downloadCsv } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { TxnStatusBadge, TxnTypeBadge } from "@/components/vendor/earnings-shared";
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

export default function VendorTransactionDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ transactionId: string }>();
  const id = params.transactionId;
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const txn = useMemo(
    () => buildVendorTransactions(orders, payouts).find((x) => x.id === id),
    [orders, payouts, id]
  );

  if (!txn) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero
          eyebrow={t("nav_earnings")}
          title={t("eTxnTitle")}
          subtitle={id}
          highlightLabel={t("tStatus")}
          highlightValue="—"
          highlightIcon={Receipt}
        >
          <Link href="/vendor/earnings/transactions" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("eTxnTitle")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Receipt} title={t("emptyTitle")} description={t("eEmptyTxnDesc")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={`${t("eTxnId")} ${txn.id}`}
        subtitle={`${txn.description} · ${dateOf(txn.date)}`}
        highlightLabel={t("tAmount")}
        highlightValue={`${txn.net < 0 ? "−" : "+"}${money(Math.abs(txn.net))}`}
        highlightIcon={Receipt}
      >
        <Link href="/vendor/earnings/transactions" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("eTxnTitle")}
        </Link>
        <button
          type="button"
          onClick={() => {
            downloadCsv(`receipt-${txn.id}.csv`, ["field", "value"],
              [["id", txn.id], ["net", txn.net], ["balance", txn.balanceAfter]]);
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          {t("eReceipt")}
        </button>
        <button
          type="button"
          onClick={() => { void navigator.clipboard.writeText(txn.id); toast.success(t("eCopyTxn")); }}
          className={heroPillClassName}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          {t("eCopyTxn")}
        </button>
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-2">
        <TxnTypeBadge type={txn.type} />
        <TxnStatusBadge status={txn.status} />
        {txn.orderId ? (
          <Link href={`/vendor/orders/${txn.orderId}`} className="font-mono text-xs font-bold text-secondary hover:underline">
            #{txn.orderId}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eTxnInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <KV label={t("eTxnId")} value={txn.id} mono bold />
            <KV label={t("eType")} value={txn.type} />
            <KV label={t("tStatus")} value={txn.status} />
            <KV label={t("tDate")} value={dateOf(txn.date)} />
            <KV label={t("eDesc")} value={txn.description} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("eFinInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <KV label={t("eGrossAmt")} value={money(txn.gross)} />
            <KV label={t("eFee")} value={money(txn.fee)} />
            <KV label={t("commission")} value={money(txn.commission)} />
            <KV label={t("eNetAmt")} value={`${txn.net < 0 ? "−" : "+"}${money(Math.abs(txn.net))}`} bold />
            <KV label={t("eBalBefore")} value={money(txn.balanceBefore)} />
            <KV label={t("eBalAfter")} value={money(txn.balanceAfter)} bold />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("eReference")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:flex-wrap">
          {txn.orderId ? (
            <Link href={`/vendor/orders/${txn.orderId}`} className="border border-border px-3 py-2 font-mono text-xs font-bold transition-colors hover:border-secondary hover:text-secondary">
              {t("eOrderId")}: {txn.orderId}
            </Link>
          ) : null}
          {txn.payoutId ? (
            <span className="border border-border px-3 py-2 font-mono text-xs font-bold">{t("ePayoutId")}: {txn.payoutId}</span>
          ) : null}
          {txn.refundId ? (
            <Link href="/vendor/orders/returns" className="border border-border px-3 py-2 font-mono text-xs font-bold transition-colors hover:border-secondary hover:text-secondary">
              {t("eRefundId")}: {txn.refundId}
            </Link>
          ) : null}
          {!txn.orderId && !txn.payoutId && !txn.refundId ? (
            <span className="text-sm text-muted-foreground">{t("eTxnEmpty")}</span>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="bg-card" onClick={() => { void navigator.clipboard.writeText(txn.id); toast.success(t("eCopyTxn")); }}>
          {t("eCopyTxn")}
        </Button>
      </div>
    </div>
  );
}
