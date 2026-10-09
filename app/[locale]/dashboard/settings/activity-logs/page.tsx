"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Eye, History, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { ActivityLog } from "@/features/admin/settings";
import { useActivityLogs } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CLASS: Record<ActivityLog["status"], string> = {
  success: "bg-green-600/10 text-green-700",
  warning: "bg-primary/20 text-[#8a5a00]",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-secondary/15 text-secondary",
};

export default function ActivityLogsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const logs = useActivityLogs();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewId, setViewId] = useState<string | null>(null);

  const modules = useMemo(() => [...new Set(logs.map((l) => l.module))], [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(
      (l) =>
        (moduleFilter === "all" || l.module === moduleFilter) &&
        (!q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
    );
  }, [logs, query, moduleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(filtered.length, (safePage + 1) * pageSize);

  const viewed = viewId ? (logs.find((l) => l.id === viewId) ?? null) : null;

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["date", "user", "role", "action", "module", "ip", "status"].join(","),
      ...filtered.map((l) => [l.date, l.user, l.role, l.action, l.module, l.ip, l.status].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("alTitle")}
        subtitle={t("alSubtitle", { count: filtered.length })}
        highlightLabel={t("tDate")}
        highlightValue={num(logs.length)}
        highlightIcon={History}
      >
        <button type="button" onClick={exportCsv} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v ?? "all"); setPage(0); }}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("fModule")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
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
                  <TableHead>{t("tDate")}</TableHead>
                  <TableHead>{t("tUser")}</TableHead>
                  <TableHead>{t("tAction")}</TableHead>
                  <TableHead>{t("tModule")}</TableHead>
                  <TableHead>{t("tIp")}</TableHead>
                  <TableHead>{t("tDevice")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-20">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {l.date}<br />{l.time}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{l.user}</p>
                      <p className="text-xs text-muted-foreground">{l.role}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm font-semibold" title={l.action}>{l.action}</p>
                      <p className="max-w-52 truncate text-xs text-muted-foreground" title={l.description}>{l.description}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{l.module}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{l.ip}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{l.device}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", STATUS_CLASS[l.status])}>{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewId(l.id)} aria-label={`${t("alDetails")} ${l.id}`} title={t("alDetails")}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={History} title={t("emptyTitle")} description={t("emptyDescription")} />
              <Button variant="outline" size="sm" className="bg-card" onClick={() => { setQuery(""); setModuleFilter("all"); setPage(0); }}>
                {t("clearFilters")}
              </Button>
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {from}–{to} of {num(filtered.length)}
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

      <Sheet open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {viewed ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading text-base font-bold">{t("alDetails")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col divide-y divide-border pt-4 text-sm">
                <DetailRow label={t("tUser")} value={`${viewed.user} (${viewed.role})`} />
                <DetailRow label={t("tAction")} value={viewed.action} />
                <DetailRow label={t("tModule")} value={viewed.module} />
                <DetailRow label={t("tDate")} value={`${viewed.date}, ${viewed.time}`} />
                <DetailRow label={t("tIp")} value={viewed.ip} />
                <DetailRow label={t("fBrowser")} value={viewed.browser} />
                <DetailRow label={t("tDevice")} value={viewed.device} />
                <DetailRow label={t("tStatus")} value={viewed.status} />
                <DetailRow label={t("viewTitle")} value={viewed.description} />
                {viewed.prevValue ? <DetailRow label={t("fPrev")} value={viewed.prevValue} /> : null}
                {viewed.newValue ? <DetailRow label={t("fNew")} value={viewed.newValue} /> : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}
