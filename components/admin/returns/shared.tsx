"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import {
  calcRefund,
  REFUND_METHODS,
  type RefundRequest,
  type RefundStatus,
  type ReturnRequest,
  type ReturnStatus,
  type TrackEvent,
  type TrackStatus,
} from "@/features/admin/returns";
import { useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TRACK_CLASS: Record<TrackStatus, string> = {
  processing: "bg-muted text-muted-foreground",
  picked: "bg-primary/20 text-[#8a5a00]",
  transit: "bg-secondary/15 text-secondary",
  out: "bg-secondary/15 text-secondary",
  delivered: "bg-green-600/10 text-green-700",
  delayed: "bg-primary/20 text-[#8a5a00]",
  failed: "bg-destructive/10 text-destructive",
  returned: "bg-purple-600/10 text-purple-700",
};

const RETURN_CLASS: Record<ReturnStatus, string> = {
  pending: "bg-primary/20 text-[#8a5a00]",
  review: "bg-secondary/15 text-secondary",
  approved: "bg-green-600/10 text-green-700",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-green-600/10 text-green-700",
  received: "bg-secondary/15 text-secondary",
  awaiting: "bg-primary/20 text-[#8a5a00]",
  transit: "bg-secondary/15 text-secondary",
  refund_pending: "bg-purple-600/10 text-purple-700",
};

const REFUND_CLASS: Record<RefundStatus, string> = {
  pending: "bg-primary/20 text-[#8a5a00]",
  review: "bg-secondary/15 text-secondary",
  approved: "bg-green-600/10 text-green-700",
  processing: "bg-secondary/15 text-secondary",
  completed: "bg-green-600/10 text-green-700",
  rejected: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function TrackingStatusBadge({ status }: { status: TrackStatus }) {
  const t = useTranslations("Dashboard.tracking");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", TRACK_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const t = useTranslations("Dashboard.returns");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", RETURN_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const t = useTranslations("Dashboard.returns");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", REFUND_CLASS[status])}>
      {t(status)}
    </Badge>
  );
}

export function TrackingTimeline({ events }: { events: TrackEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, idx) => (
        <li key={idx} className="flex gap-3">
          <span className="flex flex-col items-center">
            {e.done ? (
              <CheckCircle2 className="size-5 shrink-0 text-green-600" aria-hidden="true" />
            ) : (
              <CircleDot className="size-5 shrink-0 text-secondary" aria-hidden="true" />
            )}
            {idx < events.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
          </span>
          <div className="flex flex-col gap-0.5 pb-5">
            <p className="text-sm font-bold text-foreground">{e.status}</p>
            <p className="text-xs text-muted-foreground">
              {e.location} · {e.date} · {e.time}
            </p>
            <p className="text-xs text-muted-foreground">{e.description}</p>
          </div>
        </li>
      ))}
    </ol>
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

export function ReturnDetailsDialog({
  ret,
  onClose,
}: {
  ret: ReturnRequest | null;
  onClose: () => void;
}) {
  const t = useTranslations("Dashboard.returns");
  const format = useFormatter();
  const [tab, setTab] = useState("overview");
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  if (!ret) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent />
      </Dialog>
    );
  }

  return (
    <Dialog open={!!ret} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
            {t("dReturn")} · <span className="font-mono">{ret.id}</span>
            <ReturnStatusBadge status={ret.status} />
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="overview">{t("dCustomer")}</TabsTrigger>
            <TabsTrigger value="order">{t("dOrder")}</TabsTrigger>
            <TabsTrigger value="product">{t("dProduct")}</TabsTrigger>
            <TabsTrigger value="return">{t("dReturn")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex items-center gap-3 border border-border bg-card p-3 pt-2">
            <CustomerAvatar name={ret.customer} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{ret.customer}</p>
              <p className="truncate text-xs text-muted-foreground">{ret.email}</p>
            </div>
          </TabsContent>
          <TabsContent value="order" className="flex flex-col divide-y divide-border pt-2">
            <KV label={t("tOrder")} value={ret.orderId} />
            <KV label={t("tDate")} value={ret.date} />
            <KV label={t("tAmount")} value={money(ret.price * ret.qty)} bold />
            <KV label={t("fMethod")} value={ret.method} />
          </TabsContent>
          <TabsContent value="product" className="flex flex-col divide-y divide-border pt-2">
            <KV label={t("tProduct")} value={`${ret.product} (${ret.sku})`} />
            <KV label={t("tVendor")} value={ret.vendor} />
            <KV label={t("fCondition")} value={ret.condition} />
            <KV label={t("tAmount")} value={`${ret.qty} × ${money(ret.price)}`} bold />
          </TabsContent>
          <TabsContent value="return" className="flex flex-col divide-y divide-border pt-2">
            <KV label={t("tReturn")} value={ret.id} />
            <KV label={t("tReason")} value={ret.reason} />
            <KV label={t("fMessage")} value={ret.message} />
            <KV label={t("tAmount")} value={money(ret.amount)} bold />
            <KV label={t("fMethod")} value={ret.method} />
            <KV label={t("tStatus")} value={ret.status} />
            {ret.approvedBy ? <KV label={t("tBy")} value={`${ret.approvedBy} · ${ret.approvedDate}`} /> : null}
            {ret.rejectReason ? <KV label={t("rejectReason")} value={ret.rejectReason} /> : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const REFUND_STEPS = ["stRequested", "stReview", "stApproved", "stProcessing", "stCompleted"] as const;

export function RefundDetailsDialog({
  refund,
  onClose,
}: {
  refund: RefundRequest | null;
  onClose: () => void;
}) {
  const t = useTranslations("Dashboard.returns");
  const format = useFormatter();
  const [tab, setTab] = useState("overview");
  const patchRefund = useReturnsStore((s) => s.patchRefund);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [fProduct, setFProduct] = useState<number | null>(null);
  const [fShip, setFShip] = useState<number | null>(null);
  const [fTax, setFTax] = useState<number | null>(null);
  const [fFee, setFFee] = useState<number | null>(null);
  const [fAdj, setFAdj] = useState<number | null>(null);

  if (!refund) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent />
      </Dialog>
    );
  }

  const product = fProduct ?? refund.productAmt;
  const ship = fShip ?? refund.shipRefund;
  const tax = fTax ?? refund.taxRefund;
  const fee = fFee ?? refund.restockFee;
  const adj = fAdj ?? refund.discountAdj;
  const total = calcRefund(product, ship, tax, fee, adj);

  const stepIndex =
    refund.status === "completed" ? 5 : refund.status === "processing" ? 4 : refund.status === "approved" ? 3 : refund.status === "review" ? 2 : 1;

  const applyCalc = () => {
    patchRefund(refund.id, { productAmt: product, shipRefund: ship, taxRefund: tax, restockFee: fee, discountAdj: adj, approved: total, final: total });
    toast.success(t("toastSaved"));
    setFProduct(null); setFShip(null); setFTax(null); setFFee(null); setFAdj(null);
  };

  const numField = (label: string, value: number, set: (v: number) => void) => (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
        aria-label={label}
        className="h-8 w-28 border border-border bg-card px-2 text-right text-sm font-semibold"
      />
    </div>
  );

  return (
    <Dialog open={!!refund} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-heading text-base font-bold">
            {t("fTitle")} · <span className="font-mono">{refund.id}</span>
            <RefundStatusBadge status={refund.status} />
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="overview">{t("fInfo")}</TabsTrigger>
            <TabsTrigger value="calc">{t("fAdjust")}</TabsTrigger>
            <TabsTrigger value="timeline">{t("dTimeline")}</TabsTrigger>
            <TabsTrigger value="notes">{t("dNotes")}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="flex flex-col divide-y divide-border pt-2">
            <KV label={t("tRefund")} value={refund.id} />
            <KV label={t("tReturnId")} value={refund.returnId} />
            <KV label={t("tOrder")} value={refund.orderId} />
            <KV label={t("tCustomer")} value={`${refund.customer} (${refund.email})`} />
            <KV label={t("tVendor")} value={refund.vendor} />
            <KV label={t("tRequested")} value={money(refund.requested)} />
            <KV label={t("fApprovedAmt")} value={money(refund.approved)} bold />
            <KV label={t("tMethod")} value={refund.method} />
            <KV label={t("fOrigMethod")} value={`${refund.origPayment} · ${refund.origTxn}`} />
            <KV label={t("fOrderAmt")} value={money(refund.orderAmount)} />
          </TabsContent>
          <TabsContent value="calc" className="flex flex-col pt-2">
            {numField(t("fProductAmt"), product, (v) => setFProduct(v))}
            {numField(t("fShipRefund"), ship, (v) => setFShip(v))}
            {numField(t("fTaxRefund"), tax, (v) => setFTax(v))}
            {numField(t("fRestock"), fee, (v) => setFFee(v))}
            {numField(t("fDiscountAdj"), adj, (v) => setFAdj(v))}
            <div className="mt-2 flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
              <span className="text-sm font-bold">{t("fFinal")}</span>
              <span className="font-heading text-lg font-bold text-secondary">{money(total)}</span>
            </div>
            <Field label={t("tMethod")}>
              <select
                value={refund.method}
                onChange={(e) => patchRefund(refund.id, { method: e.target.value })}
                aria-label={t("tMethod")}
                className="h-9 w-full border border-border bg-card px-2 text-sm"
              >
                {REFUND_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end">
              <Button size="sm" onClick={applyCalc}>{t("saveBtn")}</Button>
            </div>
          </TabsContent>
          <TabsContent value="timeline" className="pt-2">
            <ol className="flex flex-col">
              {REFUND_STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    {i < stepIndex ? (
                      <CheckCircle2 className="size-5 shrink-0 text-green-600" aria-hidden="true" />
                    ) : (
                      <CircleDot className="size-5 shrink-0 text-secondary" aria-hidden="true" />
                    )}
                    {i < REFUND_STEPS.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                  </span>
                  <div className="pb-5">
                    <p className="text-sm font-bold">{t(s)}</p>
                    <p className="text-xs text-muted-foreground">{refund.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>
          <TabsContent value="notes" className="pt-2 text-sm">
            {refund.note ? (
              <p className="border border-border bg-card p-3">
                <span className="block text-xs font-bold text-muted-foreground">{refund.by ?? "Admin"} · {refund.completedDate ?? refund.date}</span>
                {refund.note}
              </p>
            ) : (
              <p className="py-4 text-center text-muted-foreground">{t("emptyDescription")}</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
