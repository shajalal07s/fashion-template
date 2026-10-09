"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  HandCoins,
  PackageCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ReturnDetailsDialog, ReturnStatusBadge } from "@/components/admin/returns/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { ReturnRequest } from "@/features/admin/returns";
import { useReturnRequests, useReturnsStore } from "@/store/returns.store";
import { toast } from "sonner";

const FLOW: ReturnRequest["status"][] = ["approved", "awaiting", "transit", "received", "refund_pending", "completed"];

export default function ApprovedReturnsPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const returns = useReturnRequests();
  const store = useReturnsStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const approved = useMemo(
    () => returns.filter((r) => FLOW.includes(r.status)).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [returns]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return approved;
    return approved.filter((r) => r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.product.toLowerCase().includes(q));
  }, [approved, query]);

  const advance = (r: ReturnRequest) => {
    const idx = FLOW.indexOf(r.status);
    const next = FLOW[Math.min(FLOW.length - 1, idx + 1)];
    store.patchReturn(r.id, { status: next });
    if (next === "refund_pending") {
      store.addRefund({
        id: `RFD-${700 + store.refunds.length + 1}`,
        returnId: r.id, orderId: r.orderId, customer: r.customer, email: r.email, vendor: r.vendor,
        requested: r.amount, approved: r.amount, final: r.amount, method: r.method,
        productAmt: r.amount, shipRefund: 0, taxRefund: 0, restockFee: 0, discountAdj: 0,
        origPayment: "—", origTxn: "—", orderAmount: r.amount,
        date: "2026-09-26", status: "pending", note: "",
      });
    }
    toast.success(t("toastSaved"));
  };

  const viewed = viewId ? (returns.find((r) => r.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("aTitle")}
        subtitle={t("aSubtitle", { count: approved.length })}
        highlightLabel={t("kpiApproved")}
        highlightValue={num(approved.length)}
        highlightIcon={CheckCircle2}
      />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tReturn")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tApprovedDate")}</TableHead>
                  <TableHead className="text-right">{t("tAmount")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const step = FLOW.indexOf(r.status) + 1;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</p>
                        <p className="font-mono text-xs text-muted-foreground">{r.orderId}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CustomerAvatar name={r.customer} size="sm" />
                          <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-40 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                        <p className="text-xs text-muted-foreground">{r.vendor}</p>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {r.approvedDate ? dateOf(r.approvedDate) : dateOf(r.date)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.amount)}</TableCell>
                      <TableCell>
                        <ReturnStatusBadge status={r.status} />
                        <div className="mt-1 flex gap-0.5" aria-hidden="true">
                          {FLOW.map((_, i) => (
                            <span key={i} className={`h-1 w-5 ${i < step ? "bg-secondary" : "bg-muted"}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                          {r.status === "approved" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => advance(r)} aria-label={r.id} title={t("awaiting")}>
                              <PackageCheck className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                          ) : r.status === "received" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => advance(r)} aria-label={r.id} title={t("createRefund")}>
                              <HandCoins className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                          ) : r.status !== "completed" && r.status !== "refund_pending" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => advance(r)} aria-label={r.id} title={t("viewTitle")}>
                              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={CheckCircle2} title={t("emptyTitle")} description={t("emptyReturns")} />
            </div>
          )}
        </CardContent>
      </Card>

      <ReturnDetailsDialog ret={viewed} onClose={() => setViewId(null)} />
    </div>
  );
}
