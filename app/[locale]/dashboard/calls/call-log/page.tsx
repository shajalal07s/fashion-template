"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { PackageSearch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Link } from "@/i18n/navigation";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import { encodeCustomerKey } from "@/features/admin/customer-key";
import {
  OutcomeBadge,
  downloadCsv,
  useCallFormat,
} from "@/components/admin/calls/shared";
import { demoLogs, formatDuration, type CallLog, type CallOutcome } from "@/features/admin/calls";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "all" | CallOutcome;
type SortKey = "date" | "customer" | "duration";

const FILTERS: Filter[] = ["all", "completed", "missed", "failed"];

export default function CallLogPage() {
  const t = useTranslations("Dashboard.calls");
  const { date, time } = useCallFormat();
  const [items, setItems] = useState<CallLog[]>(demoLogs);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [direction, setDirection] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const orders = useAdminOrders();

  const emailByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of buildCustomers(orders)) {
      if (!map.has(c.name)) map.set(c.name, c.email);
    }
    return map;
  }, [orders]);

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      toast.success(t("copied"));
      window.setTimeout(() => setCopiedPhone(null), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((o) => {
      if (filter !== "all" && o.outcome !== filter) return false;
      if (direction !== "all" && o.direction !== direction) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    });
  }, [items, query, filter, direction]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "customer") return a.customer.localeCompare(b.customer) * dir;
      if (sortKey === "duration") return (a.durationSec - b.durationSec) * dir;
      return (+new Date(a.startedAt) - +new Date(b.startedAt)) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  );

  const activeSelected = useMemo(
    () => [...selected].filter((id) => sorted.some((r) => r.id === id)),
    [selected, sorted]
  );
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.id));

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "customer" ? "asc" : "desc");
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

  const sortableHead = (key: SortKey, label: string, className?: string) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-white/80"
      >
        {label}
        {sortIcon(key)}
      </button>
    </TableHead>
  );

  const handleDelete = (ids: string[]) => {
    setItems((prev) => prev.filter((r) => !ids.includes(r.id)));
    setSelected(new Set());
    toast.success(t("toastDeleted", { count: ids.length }));
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? sorted.filter((r) => selected.has(r.id)) : sorted;
    if (list.length === 0) {
      toast.error(t("noSelection"));
      return;
    }
    downloadCsv(
      "call-log.csv",
      ["id", "customer", "phone", "direction", "agent", "startedAt", "durationSec", "outcome"],
      list.map((r) => [r.id, r.customer, r.phone, r.direction, r.agent, r.startedAt, r.durationSec, r.outcome])
    );
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("empty");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const col = (row: string[], ...names: string[]) => {
        for (const name of names) {
          const i = headers.indexOf(name);
          if (i >= 0 && row[i]) return row[i].replace(/^"|"$/g, "");
        }
        return "";
      };
      const parsed: CallLog[] = [];
      lines.slice(1).forEach((line, i) => {
        const row = line.split(",");
        const customer = col(row, "customer", "name");
        if (!customer) return;
        parsed.push({
          id: col(row, "id") || `C-IMP-${Date.now()}-${i}`,
          customer,
          phone: col(row, "phone") || "",
          direction: (col(row, "direction") === "inbound" ? "inbound" : "outbound") as CallLog["direction"],
          agent: col(row, "agent") || "Unassigned",
          startedAt: new Date().toISOString(),
          durationSec: Number(col(row, "durationsec", "duration")) || 0,
          outcome: (["completed", "missed", "failed"].includes(col(row, "outcome").toLowerCase())
            ? col(row, "outcome").toLowerCase()
            : "completed") as CallLog["outcome"],
        });
      });
      if (parsed.length === 0) throw new Error("empty");
      setItems((prev) => [...parsed, ...prev]);
      toast.success(t("importSuccess", { count: parsed.length }));
    } catch {
      toast.error(t("importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const details = detailsId ? items.find((r) => r.id === detailsId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("logTitle")} description={t("found", { count: filtered.length })} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="flex-wrap">
              {FILTERS.map((f) => (
                <TabsTrigger key={f} value={f}>
                  {f === "all" ? t("all") : t(`status.${f}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={direction} onValueChange={(v) => setDirection(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("tableDirection")}</SelectItem>
              <SelectItem value="inbound">{t("direction.inbound")}</SelectItem>
              <SelectItem value="outbound">{t("direction.outbound")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="bg-card pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" onClick={handleExport}>
              <Download className="size-3.5 text-secondary" aria-hidden="true" />
              {t("exportBtn")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-card"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5 text-secondary" aria-hidden="true" />
              {t("importBtn")}
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border bg-card">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelected(new Set())}
              aria-label={t("bulkClear")}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold text-foreground">
              {t("bulkSelected", { count: activeSelected.length })}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => handleDelete(activeSelected)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("bulkDelete")}
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!allVisibleSelected && someVisibleSelected}
                      onCheckedChange={(v) => toggleAllVisible(v === true)}
                      aria-label={t("bulkSelected", { count: visible.length })}
                    />
                  </TableHead>
                  <TableHead>{t("tableId")}</TableHead>
                  {sortableHead("customer", t("tableCustomer"))}
                  <TableHead>{t("tableDirection")}</TableHead>
                  <TableHead>{t("tableAgent")}</TableHead>
                  {sortableHead("duration", t("tableDuration"), "text-right")}
                  {sortableHead("date", t("tableDate"), "text-right")}
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{t("viewAction")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.id} className={cn(selected.has(row.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(v) => toggleOne(row.id, v === true)}
                        aria-label={row.id}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/call-log/${row.id}`}
                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                      >
                        {row.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const email = emailByName.get(row.customer);
                        const name = (
                          <span className="text-sm font-medium whitespace-nowrap text-foreground">
                            {row.customer}
                          </span>
                        );
                        return (
                          <>
                            {email ? (
                              <Link
                                href={`/dashboard/customers/${encodeCustomerKey(email)}`}
                                className="hover:underline"
                              >
                                {name}
                              </Link>
                            ) : (
                              name
                            )}
                            <span className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                              {row.phone}
                              <button
                                type="button"
                                onClick={() => void copyPhone(row.phone)}
                                aria-label={row.phone}
                                title={row.phone}
                                className="flex size-5 items-center justify-center transition-colors hover:bg-muted hover:text-secondary"
                              >
                                {copiedPhone === row.phone ? (
                                  <Check className="size-3 text-green-600" aria-hidden="true" />
                                ) : (
                                  <Copy className="size-3" aria-hidden="true" />
                                )}
                              </button>
                            </span>
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`direction.${row.direction}`)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/agents/${encodeURIComponent(row.agent)}`}
                        className="hover:text-secondary hover:underline"
                      >
                        {row.agent}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">
                      {formatDuration(row.durationSec)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{date(row.startedAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{time(row.startedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={row.outcome} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDetailsId(row.id)}
                          aria-label={`${t("viewAction")} ${row.id}`}
                          title={t("viewAction")}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Link href={`/dashboard/calls/call-log/${row.id}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t("editTitle")} ${row.id}`}
                            title={t("editTitle")}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete([row.id])}
                          aria-label={`${t("bulkDelete")} ${row.id}`}
                          title={t("bulkDelete")}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState
                icon={PackageSearch}
                title={t("emptyTitle")}
                description={t("emptyDescription")}
              />
            </div>
          )}
        </CardContent>
        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("pageOf", { page: safePage + 1, pages: pageCount })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-card"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {t("prevPage")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-card"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                {t("nextPage")}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetailsId(null)}>
        <DialogContent className="sm:max-w-md">
          {details ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{details.id}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableCustomer")}</span>
                  <span className="font-semibold">{details.customer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tablePhone")}</span>
                  <span className="font-mono">{details.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableDirection")}</span>
                  <span className="font-medium">{t(`direction.${details.direction}`)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableAgent")}</span>
                  <span className="font-medium">{details.agent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableDuration")}</span>
                  <span className="font-bold text-secondary">{formatDuration(details.durationSec)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableStatus")}</span>
                  <OutcomeBadge outcome={details.outcome} />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
