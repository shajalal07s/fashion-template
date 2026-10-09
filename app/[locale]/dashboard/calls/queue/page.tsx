"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  PriorityBadge,
  QueueStatusBadge,
  downloadCsv,
  useCallFormat,
} from "@/components/admin/calls/shared";
import {
  type CallQueueItem,
  type QueueStatus,
} from "@/features/admin/calls";
import { useCallQueueStore, useQueueItems } from "@/store/call-queue.store";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import { encodeCustomerKey } from "@/features/admin/customer-key";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "all" | QueueStatus;
type SortKey = "scheduled" | "customer" | "attempts";

const FILTERS: Filter[] = ["all", "waiting", "calling", "done"];

function QueueCustomerCell({
  customer,
  phone,
  city,
  email,
}: {
  customer: string;
  phone: string;
  city: string;
  email?: string;
}) {
  const body = (
    <>
      <span className="text-sm font-medium whitespace-nowrap text-foreground">{customer}</span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {phone} · {city}
      </span>
    </>
  );
  if (!email) return <span className="flex flex-col items-start text-left">{body}</span>;
  return (
    <Link
      href={`/dashboard/customers/${encodeCustomerKey(email)}`}
      className="flex flex-col items-start text-left hover:underline"
    >
      {body}
    </Link>
  );
}

export default function CallsQueuePage() {
  const t = useTranslations("Dashboard.calls");
  const { date, time } = useCallFormat();
  const items = useQueueItems();
  const removeItems = useCallQueueStore((s) => s.remove);
  const appendItems = useCallQueueStore((s) => s.append);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("scheduled");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.phone.includes(q)
      );
    });
  }, [items, query, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "customer") return a.customer.localeCompare(b.customer) * dir;
      if (sortKey === "attempts") return (a.attempts - b.attempts) * dir;
      return (+new Date(a.scheduledAt) - +new Date(b.scheduledAt)) * dir;
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
    removeItems(ids);
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
      "call-queue.csv",
      ["id", "customer", "phone", "city", "agent", "priority", "attempts", "scheduledAt", "status"],
      list.map((r) => [r.id, r.customer, r.phone, r.city, r.agent, r.priority, r.attempts, r.scheduledAt, r.status])
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
      const parsed: CallQueueItem[] = [];
      lines.slice(1).forEach((line, i) => {
        const row = line.split(",");
        const customer = col(row, "customer", "name");
        if (!customer) return;
        parsed.push({
          id: col(row, "id") || `Q-IMP-${Date.now()}-${i}`,
          customer,
          phone: col(row, "phone") || "",
          city: col(row, "city") || "Dhaka",
          agent: col(row, "agent") || "Unassigned",
          priority: (["high", "normal", "low"].includes(col(row, "priority").toLowerCase())
            ? col(row, "priority").toLowerCase()
            : "normal") as CallQueueItem["priority"],
          attempts: Number(col(row, "attempts")) || 0,
          scheduledAt: new Date().toISOString(),
          status: "waiting",
        });
      });
      if (parsed.length === 0) throw new Error("empty");
      appendItems(parsed);
      toast.success(t("importSuccess", { count: parsed.length }));
    } catch {
      toast.error(t("importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const orders = useAdminOrders();
  const emailByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of buildCustomers(orders)) {
      if (!map.has(c.name)) map.set(c.name, c.email);
    }
    return map;
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("queueTitle")}
        description={t("found", { count: filtered.length })}
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="flex-wrap">
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f === "all" ? t("all") : t(`status.${f}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
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
                  <TableHead>{t("tableAgent")}</TableHead>
                  <TableHead>{t("tablePriority")}</TableHead>
                  {sortableHead("attempts", t("tableAttempts"), "text-center")}
                  {sortableHead("scheduled", t("tableScheduled"), "text-right")}
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
                        href={`/dashboard/calls/queue/${row.id}`}
                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                      >
                        {row.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <QueueCustomerCell
                        customer={row.customer}
                        phone={row.phone}
                        city={row.city}
                        email={emailByName.get(row.customer)}
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/agents/${encodeURIComponent(row.agent)}`}
                        className="hover:text-secondary hover:underline"
                      >
                        {row.agent}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={row.priority} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {row.attempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{date(row.scheduledAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{time(row.scheduledAt)}</p>
                    </TableCell>
                    <TableCell>
                      <QueueStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/calls/queue/${row.id}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t("viewAction")} ${row.id}`}
                            title={t("viewAction")}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/calls/queue/${row.id}`}>
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
    </div>
  );
}
