"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  HandCoins,
  Search,
} from "lucide-react";
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
import { PackageSearch, ScrollText } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CommissionStatusBadge } from "@/components/admin/commission/shared";
import { TxDetailsDialog } from "@/components/admin/commission/TxDetailsDialog";
import type { CommissionStatus, CommissionTx, RuleScope } from "@/features/admin/commission";
import { useCommissionStore, useCommissionTxs } from "@/store/commission.store";
import { toast } from "sonner";

type SortKey = "date" | "commission";

const STATUSES: CommissionStatus[] = ["pending", "approved", "paid", "refunded", "reversed", "cancelled", "adjusted"];
const SCOPES: RuleScope[] = ["global", "vendor", "category", "product"];

export default function CommissionHistoryPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const txs = useCommissionTxs();
  const patchTx = useCommissionStore((s) => s.patchTx);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CommissionStatus>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | RuleScope>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewTx, setViewTx] = useState<CommissionTx | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter(
      (x) =>
        (statusFilter === "all" || x.status === statusFilter) &&
        (scopeFilter === "all" || x.ruleScope === scopeFilter) &&
        (!q ||
          x.id.toLowerCase().includes(q) ||
          x.orderId.toLowerCase().includes(q) ||
          x.vendor.toLowerCase().includes(q) ||
          x.product.toLowerCase().includes(q))
    );
  }, [txs, query, statusFilter, scopeFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "commission") return (a.commission - b.commission) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const totalCom = useMemo(() => filtered.reduce((n, x) => n + x.commission, 0), [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ArrowUp className="size-3.5 text-white" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3.5 text-white" aria-hidden="true" />
    );
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["tx", "order", "vendor", "product", "gross", "commission", "earning", "status", "date"].join(","),
      ...filtered.map((x) => [x.id, x.orderId, x.vendor, x.product, x.gross, x.commission, x.earning, x.status, x.date].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commission-history.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("hTitle")}
        subtitle={t("hSubtitle", { count: filtered.length })}
        highlightLabel={t("tCom")}
        highlightValue={money(totalCom)}
        highlightIcon={ScrollText}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "all" | CommissionStatus);
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={scopeFilter}
          onValueChange={(v) => {
            setScopeFilter(v as "all" | RuleScope);
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("fRule")}: {t("all")}</SelectItem>
            {SCOPES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`scope${s[0].toUpperCase()}${s.slice(1)}` as "scopeGlobal")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tDate")} {sortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tTx")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead className="text-right">{t("tGross")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("commission")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tCom")} {sortIcon("commission")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">{t("tEarning")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{x.date}</TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{x.id}</p>
                      <p className="font-mono text-xs text-muted-foreground">{x.orderId}</p>
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{x.vendor}</TableCell>
                    <TableCell className="max-w-44 truncate text-sm" title={x.product}>{x.product}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(x.gross)}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(x.commission)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
                      {money(x.earning)}
                    </TableCell>
                    <TableCell>
                      <CommissionStatusBadge status={x.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTx(x)} aria-label={`${t("viewDetails")} ${x.id}`} title={t("viewDetails")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {x.status === "pending" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patchTx(x.id, { status: "approved" });
                              toast.success(t("toastApproved"));
                            }}
                            aria-label={`${t("approved")} ${x.id}`}
                            title={t("approved")}
                          >
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {x.status === "approved" || x.status === "adjusted" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patchTx(x.id, { status: "paid" });
                              toast.success(t("toastPaid"));
                            }}
                            aria-label={`${t("paid")} ${x.id}`}
                            title={t("paid")}
                          >
                            <HandCoins className="size-4 text-secondary" aria-hidden="true" />
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

      <TxDetailsDialog tx={viewTx} onClose={() => setViewTx(null)} />
    </div>
  );
}
