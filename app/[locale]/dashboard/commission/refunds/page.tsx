"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Search,
  Undo2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PackageSearch } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import type { Reversal } from "@/features/admin/commission";
import { useCommissionReversals, useCommissionStore } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CommissionRefundsPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const reversals = useCommissionReversals();
  const patchReversal = useCommissionStore((s) => s.patchReversal);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reversals;
    return reversals.filter(
      (r) => r.id.toLowerCase().includes(q) || r.txId.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q)
    );
  }, [reversals, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const totalReversed = useMemo(() => filtered.reduce((n, r) => n + r.reversed, 0), [filtered]);
  const viewed = viewId ? (reversals.find((r) => r.id === viewId) ?? null) : null;

  const handleExport = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["reversal", "tx", "order", "vendor", "refund", "reversed", "status"].join(","),
      ...filtered.map((r) => [r.id, r.txId, r.orderId, r.vendor, r.refund, r.reversed, r.status].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commission-reversals.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  const typeKey = (ty: Reversal["type"]) =>
    ty === "full_refund" ? "typeFullRefund" : ty === "partial_refund" ? "typePartialRefund" : ty === "full_reversal" ? "typeFullReversal" : "typePartialReversal";

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("rfTitle")}
        subtitle={t("rfSubtitle", { count: filtered.length })}
        highlightLabel={t("tReversed")}
        highlightValue={money(totalReversed)}
        highlightIcon={Undo2}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t("searchPlaceholder")}
          className="bg-card pl-9"
        />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tRev")}</TableHead>
                  <TableHead>{t("tTx")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead className="text-right">{t("tOriginal")}</TableHead>
                  <TableHead className="text-right">{t("tRefund")}</TableHead>
                  <TableHead className="text-right">{t("tReversed")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{r.id}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{r.date}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs whitespace-nowrap">{r.txId}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.orderId}</p>
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{r.vendor}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.original)}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.refund)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-destructive">
                      {money(r.reversed)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">
                        {t(typeKey(r.type))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", r.status === "completed" ? "bg-green-600/10 text-green-700" : r.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>
                        {t(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(r.id)} aria-label={`${t("revDetails")} ${r.id}`} title={t("revDetails")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status === "pending" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patchReversal(r.id, { status: "completed" });
                              toast.success(t("toastApproved"));
                            }}
                            aria-label={`${t("completed")} ${r.id}`}
                            title={t("completed")}
                          >
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={PackageSearch} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground">{safePage + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <Undo2 className="size-4 text-secondary" aria-hidden="true" />
                  {t("revDetails")} · <span className="font-mono">{viewed.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <DetailRow label={t("tTx")} value={`${viewed.txId} / ${viewed.orderId}`} />
                <DetailRow label={t("tVendor")} value={viewed.vendor} />
                <DetailRow label={t("tOriginal")} value={money(viewed.original)} />
                <DetailRow label={t("tRefund")} value={money(viewed.refund)} />
                <DetailRow label={t("tReversed")} value={money(viewed.reversed)} strong />
                <DetailRow label={t("tRemain")} value={money(viewed.remaining)} strong />
                <DetailRow label={t("tType")} value={t(typeKey(viewed.type))} />
                <DetailRow label={t("tReason")} value={viewed.reason} />
                <DetailRow label={t("tDate")} value={viewed.date} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-secondary" : "font-medium"}>{value}</span>
    </div>
  );
}
