"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as CrumbSep,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SearchX } from "lucide-react";
import { downloadCsv } from "@/features/admin/reports";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

export function ReportKpi({ label, value, delta, icon: Icon, tile}: { label: string; value: string; delta?: number; icon: LucideIcon; tile: string }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="font-heading truncate text-xl font-bold text-foreground">{value}</p>
          {delta !== undefined ? (
            <span className={`w-fit px-1.5 py-0.5 text-[11px] font-bold ${positive ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {positive ? "+" : ""}{delta}%
            </span>
          ) : null}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export interface ReportColumn<T> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  searchValue?: (row: T) => string;
}

export function ReportTable<T extends { id?: string }>({
  rows,
  columns,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  onClearFilters,
}: {
  rows: T[];
  columns: Array<ReportColumn<T>>;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  onClearFilters?: () => void;
}) {
  const t = useTranslations("Dashboard.reports");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => (c.searchValue ? c.searchValue(r) : "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(sorted.length, (safePage + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const alignCls = (a?: "left" | "center" | "right") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
          className="bg-card"
          aria-label={searchPlaceholder}
        />
      </div>
      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  {columns.map((c) => (
                    <TableHead key={c.key} className={alignCls(c.align)}>
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80"
                        >
                          {c.label}
                          {sortKey !== c.key ? (
                            <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                          ) : sortDir === "asc" ? (
                            <ArrowUp className="size-3.5 text-white" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5 text-white" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        c.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row, i) => (
                  <TableRow key={row.id ?? i}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={alignCls(c.align)}>
                        {c.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={SearchX} title={emptyTitle} description={emptyDescription} />
              {onClearFilters ? (
                <Button variant="outline" size="sm" className="bg-card" onClick={() => { setQuery(""); onClearFilters(); }}>
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {from}–{to} of {sorted.length}
          </p>
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
    </div>
  );
}

export function ExportReportButton({
  reportType,
  headers,
  rows,
  filtersLabel,
}: {
  reportType: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  filtersLabel?: string;
}) {
  const t = useTranslations("Dashboard.reports");
  const doCsv = () => {
    if (rows.length === 0) {
      toast.error(t("emptyTitle"));
      return;
    }
    downloadCsv(`${reportType}-report.csv`, headers, rows);
    toast.success(t("exported"));
  };
  const later = () => toast(t("exported"));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" aria-label={t("exportBtn")} />
        }
      >
        <Download className="size-3.5" aria-hidden="true" />
        {t("exportBtn")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={doCsv}>
          <FileText className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}{filtersLabel ? ` · ${filtersLabel}` : ""}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={later}>
          <FileSpreadsheet className="size-3.5" aria-hidden="true" />
          {t("exportExcel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GeoBreadcrumb({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {trail.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <CrumbSep className="size-3" aria-hidden="true" /> : null}
          {item.href ? (
            <Link href={item.href} className="font-semibold text-secondary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
