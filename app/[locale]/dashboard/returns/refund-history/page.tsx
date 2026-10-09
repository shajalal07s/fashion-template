"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, Eye, HandCoins, Search } from "lucide-react";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RefundDetailsDialog, RefundStatusBadge } from "@/components/admin/returns/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import type { RefundRequest } from "@/features/admin/returns";
import { useRefundRequests } from "@/store/returns.store";
import { toast } from "sonner";

export default function RefundHistoryPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const refunds = useRefundRequests();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [query, setQuery] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const history = useMemo(
    () =>
      refunds
        .filter((r) => r.status === "completed" || r.status === "failed" || r.status === "cancelled")
        .sort((a, b) => +new Date(b.completedDate ?? b.date) - +new Date(a.completedDate ?? a.date)),
    [refunds]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (r) => r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)
    );
  }, [history, query]);

  const viewed: RefundRequest | null = viewId ? (refunds.find((r) => r.id === viewId) ?? null) : null;

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["refund", "order", "customer", "original", "refunded", "method", "status", "date"].join(","),
      ...filtered.map((r) => [r.id, r.orderId, r.customer, r.requested, r.final, r.method, r.status, r.completedDate ?? r.date].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "refund-history.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("hTitle")}
        subtitle={t("hSubtitle", { count: filtered.length })}
        highlightLabel={t("fTotalAmt")}
        highlightValue={money(filtered.reduce((n, r) => n + r.final, 0))}
        highlightIcon={HandCoins}
      >
        <button type="button" onClick={exportCsv} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}
        </button>
      </AccountingHero>

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
                  <TableHead>{t("tRefund")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead className="text-right">{t("tOriginal")}</TableHead>
                  <TableHead className="text-right">{t("tFinal")}</TableHead>
                  <TableHead>{t("tMethod")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tProcessed")}</TableHead>
                  <TableHead className="w-20">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.orderId}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={r.customer} size="sm" />
                        <div>
                          <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                          <p className="text-xs text-muted-foreground">{r.vendor}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.requested)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">{money(r.final)}</TableCell>
                    <TableCell className="max-w-32 truncate text-xs text-muted-foreground" title={r.method}>{r.method}</TableCell>
                    <TableCell>
                      <RefundStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {r.completedDate ? dateOf(r.completedDate) : "—"} · {r.by ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={HandCoins} title={t("emptyTitle")} description={t("emptyHistory")} />
            </div>
          )}
        </CardContent>
      </Card>

      <RefundDetailsDialog refund={viewed} onClose={() => setViewId(null)} />
    </div>
  );
}
