"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowDown, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionStatusBadge, CommissionTimeline } from "@/components/admin/commission/shared";
import type { CommissionTx } from "@/features/admin/commission";
import { useCommissionAdjustments } from "@/store/commission.store";

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-secondary" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}

export function TxDetailsDialog({
  tx,
  onClose,
}: {
  tx: CommissionTx | null;
  onClose: () => void;
}) {
  const t = useTranslations("Dashboard.commission");
  const format = useFormatter();
  const [tab, setTab] = useState("overview");
  const adjustments = useCommissionAdjustments();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const txAdjustments = tx ? adjustments.filter((a) => a.txId === tx.id) : [];
  const steps = tx
    ? [
        `${money(tx.gross)} ${t("dSubtotal")}`,
        `-${money(tx.discount)} ${t("tDiscount")}`,
        `${money(tx.commissionable)} ${t("tCommAmt")}`,
        `${tx.rate > 0 ? `${tx.rate}%` : money(tx.commission)} ${t("tCom")}`,
        `${money(tx.commission)} ${t("pvCommission")}`,
        `${money(tx.earning)} ${t("pvEarning")}`,
      ]
    : [];

  return (
    <Dialog open={!!tx} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {tx ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
                <ReceiptText className="size-4 text-secondary" aria-hidden="true" />
                {t("viewDetails")} · <span className="font-mono">{tx.id}</span>
                <CommissionStatusBadge status={tx.status} />
              </DialogTitle>
            </DialogHeader>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex w-full flex-wrap">
                <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
                <TabsTrigger value="calc">{t("tabCalc")}</TabsTrigger>
                <TabsTrigger value="rule">{t("tabRule")}</TabsTrigger>
                <TabsTrigger value="adjust">{t("tabAdjust")}</TabsTrigger>
                <TabsTrigger value="timeline">{t("tabTimeline")}</TabsTrigger>
                <TabsTrigger value="audit">{t("tabAudit")}</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="flex flex-col divide-y divide-border">
                <KV label={t("tTx")} value={tx.id} />
                <KV label={t("tOrder")} value={tx.orderId} />
                <KV label={t("tVendor")} value={tx.vendor} />
                <KV label={t("tProduct")} value={`${tx.product} (${tx.sku})`} />
                <KV label={t("tCategory")} value={tx.category} />
                <KV label={t("tDate")} value={tx.date} />
                <KV label={t("fRule")} value={`${tx.rule} · ${t(`scope${tx.ruleScope[0].toUpperCase()}${tx.ruleScope.slice(1)}` as "scopeGlobal")}`} />
              </TabsContent>
              <TabsContent value="calc" className="flex flex-col">
                <p className="pb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("dCalcTitle")}
                </p>
                <div className="flex flex-col items-stretch gap-0">
                  {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span
                        className={
                          i === steps.length - 1
                            ? "w-full bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-2.5 text-center text-sm font-bold text-secondary"
                            : i === steps.length - 2
                              ? "w-full bg-muted px-4 py-2 text-center text-sm font-semibold"
                              : "w-full border border-border bg-card px-4 py-2 text-center text-sm"
                        }
                      >
                        {s}
                      </span>
                      {i < steps.length - 1 ? (
                        <ArrowDown className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col divide-y divide-border border-t border-border">
                  <KV label={t("dSubtotal")} value={money(tx.gross)} />
                  <KV label={t("tDiscount")} value={`-${money(tx.discount)}`} />
                  <KV label={t("dTax")} value={money(0)} />
                  <KV label={t("dShipping")} value={money(0)} />
                  <KV label={t("tCommAmt")} value={money(tx.commissionable)} />
                  <KV label={t("tRate")} value={`${tx.rate}%`} />
                  <KV label={t("tCom")} value={money(tx.commission)} bold />
                  <KV label={t("tEarning")} value={money(tx.earning)} bold />
                </div>
              </TabsContent>
              <TabsContent value="rule" className="flex flex-col gap-2">
                <div className="border border-dashed border-secondary/40 bg-secondary/5 px-4 py-4 text-center">
                  <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                    {t("appliedRule")}
                  </p>
                  <p className="font-heading text-xl font-bold text-secondary">{tx.rule}</p>
                </div>
                <KV label={t("srcLabel")} value={t(`scope${tx.ruleScope[0].toUpperCase()}${tx.ruleScope.slice(1)}` as "scopeGlobal")} />
                <KV label={t("rateLabel")} value={`${tx.rate}%`} />
                <KV label={t("statusLabel")} value={tx.status} />
              </TabsContent>
              <TabsContent value="adjust" className="flex flex-col divide-y divide-border">
                {txAdjustments.length > 0 ? (
                  txAdjustments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <span className="font-mono font-bold">{a.id}</span>
                        <span className="block text-xs text-muted-foreground">{a.reason}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-bold text-secondary">
                          {a.delta > 0 ? "+" : ""}
                          {money(a.delta)}
                        </span>
                        <Badge className="bg-muted font-semibold text-muted-foreground">{t(a.status)}</Badge>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("emptyTitle")}</p>
                )}
              </TabsContent>
              <TabsContent value="timeline">
                <CommissionTimeline events={tx.timeline} />
              </TabsContent>
              <TabsContent value="audit" className="flex flex-col divide-y divide-border">
                <KV label={t("auditCreated")} value={tx.date} />
                <KV label={t("auditApproved")} value={tx.date} />
                <KV label={t("auditPaid")} value={tx.date} />
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
