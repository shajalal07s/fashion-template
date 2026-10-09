"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Eye, RotateCcw, Search, XCircle } from "lucide-react";
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
import { useReturnRequests, useReturnsStore } from "@/store/returns.store";
import { toast } from "sonner";

export default function RejectedReturnsPage() {
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

  const rejected = useMemo(
    () => returns.filter((r) => r.status === "rejected" || r.status === "cancelled").sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [returns]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rejected;
    return rejected.filter((r) => r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.product.toLowerCase().includes(q));
  }, [rejected, query]);

  const viewed = viewId ? (returns.find((r) => r.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("rTitle")}
        subtitle={t("rSubtitle", { count: rejected.length })}
        highlightLabel={t("kpiRejected")}
        highlightValue={num(rejected.length)}
        highlightIcon={XCircle}
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
                  <TableHead>{t("tReason")}</TableHead>
                  <TableHead>{t("tRejectedDate")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
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
                        <p className="max-w-28 truncate text-sm font-semibold" title={r.customer}>{r.customer}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-40 truncate text-sm font-semibold" title={r.product}>{r.product}</p>
                      <p className="text-xs text-muted-foreground">{money(r.amount)}</p>
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-xs text-muted-foreground" title={r.rejectReason ?? r.reason}>
                      {r.rejectReason ?? r.reason}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(r.date)}</TableCell>
                    <TableCell>
                      <ReturnStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("viewTitle")} ${r.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            store.patchReturn(r.id, { status: "pending", rejectReason: undefined });
                            toast.success(t("toastSaved"));
                          }}
                          aria-label={r.id}
                          title={t("approve")}
                        >
                          <RotateCcw className="size-4 text-secondary" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={XCircle} title={t("emptyTitle")} description={t("emptyReturns")} />
            </div>
          )}
        </CardContent>
      </Card>

      <ReturnDetailsDialog ret={viewed} onClose={() => setViewId(null)} />
    </div>
  );
}
