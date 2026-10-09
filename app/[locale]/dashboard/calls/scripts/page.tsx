"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  GitBranch,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PackageSearch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { downloadCsv } from "@/components/admin/calls/shared";
import { useCallScriptsStore, useScripts } from "@/store/call-scripts.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CallScriptsPage() {
  const t = useTranslations("Dashboard.calls");
  const items = useScripts();
  const patchScript = useCallScriptsStore((s) => s.patch);
  const removeScripts = useCallScriptsStore((s) => s.remove);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [items, query]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => filtered.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filtered, safePage]
  );

  const activeSelected = useMemo(
    () => [...selected].filter((id) => filtered.some((r) => r.id === id)),
    [selected, filtered]
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

  const toggleActive = (id: string) => {
    const current = items.find((s) => s.id === id);
    if (current) patchScript(id, { active: !current.active });
  };

  const handleDelete = (ids: string[]) => {
    removeScripts(ids);
    setSelected(new Set());
    toast.success(t("toastDeleted", { count: ids.length }));
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? filtered.filter((r) => selected.has(r.id)) : filtered;
    if (list.length === 0) {
      toast.error(t("noSelection"));
      return;
    }
    downloadCsv(
      "call-scripts.csv",
      ["id", "name", "calls", "successRate", "active"],
      list.map((r) => [r.id, r.name, r.calls, r.successRate, r.active])
    );
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const viewed = viewId ? items.find((r) => r.id === viewId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("scriptsTitle")} description={t("found", { count: filtered.length })} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
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
        <Button variant="outline" size="sm" className="h-8 w-fit gap-1.5 bg-card" onClick={handleExport}>
          <Download className="size-3.5 text-secondary" aria-hidden="true" />
          {t("exportBtn")}
        </Button>
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
                  <TableHead>{t("tableScript")}</TableHead>
                  <TableHead className="text-center">{t("tableSteps")}</TableHead>
                  <TableHead className="text-right">{t("tableCalls")}</TableHead>
                  <TableHead className="text-right">{t("tableSuccess")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">{t("scriptView")}</span>
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
                    <TableCell>
                      <p className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap text-foreground">
                        <GitBranch className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                        <Link
                          href={`/dashboard/calls/scripts/${row.id}`}
                          className="hover:text-secondary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </p>
                      <p className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                        {row.id}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {row.steps.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {row.calls.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-28 flex-col gap-1">
                        <span className="text-right text-sm font-bold text-secondary">
                          {row.successRate}%
                        </span>
                        <div className="h-1.5 w-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${row.successRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleActive(row.id)}
                        aria-pressed={row.active}
                      >
                        <Badge
                          className={cn(
                            "font-semibold whitespace-nowrap",
                            row.active
                              ? "bg-green-600/10 text-green-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {row.active ? t("active") : t("inactive")}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setViewId(row.id)}
                        aria-label={`${t("scriptView")} ${row.name}`}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewed.name}</DialogTitle>
              </DialogHeader>
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("scriptSteps")}
              </p>
              <ol className="flex flex-col gap-2">
                {viewed.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 border border-border bg-card px-3 py-2.5">
                    <span className="font-heading flex size-6 shrink-0 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
