"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/common/EmptyState";
import { PackageSearch } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isBalanced, journalTotals } from "@/features/admin/accounting";
import { useAccountingStore, useAccounts, useJournalEntries } from "@/store/accounting.store";

type SortKey = "date" | "ref" | "amount";

export default function AccountingJournalPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const journal = useJournalEntries();
  const accounts = useAccounts();
  const addJournal = useAccountingStore((s) => s.addJournal);
  const patchJournal = useAccountingStore((s) => s.patchJournal);
  const removeJournal = useAccountingStore((s) => s.removeJournal);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "posted" | "draft">("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [formDate, setFormDate] = useState("2026-09-24");
  const [formDesc, setFormDesc] = useState("");
  const [formDebitAcc, setFormDebitAcc] = useState("");
  const [formCreditAcc, setFormCreditAcc] = useState("");
  const [formAmount, setFormAmount] = useState(0);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journal.filter(
      (j) =>
        (statusFilter === "all" || j.status === statusFilter) &&
        (!q || j.description.toLowerCase().includes(q) || j.ref.toLowerCase().includes(q))
    );
  }, [journal, query, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "ref") return a.ref.localeCompare(b.ref) * dir;
      if (sortKey === "amount") return (journalTotals(a).debit - journalTotals(b).debit) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeSelected = useMemo(
    () => [...selected].filter((id) => journal.some((j) => j.id === id)),
    [selected, journal]
  );

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

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? journal.filter((j) => selected.has(j.id)) : filtered;
    if (list.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["date", "ref", "description", "account", "debit", "credit", "status"].join(","),
      ...list.flatMap((j) =>
        j.lines.map((l) =>
          [j.date, j.ref, j.description, accountName(l.accountId), l.debit, l.credit, j.status]
            .map(esc)
            .join(",")
        )
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-entries.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const openAdd = () => {
    setFormDate("2026-09-24");
    setFormDesc("");
    setFormDebitAcc(accounts[0]?.id ?? "");
    setFormCreditAcc(accounts[1]?.id ?? "");
    setFormAmount(0);
    setAddOpen(true);
  };

  const handleSaveNew = () => {
    if (!formDesc.trim() || !formDebitAcc || !formCreditAcc || formAmount <= 0) return;
    if (formDebitAcc === formCreditAcc) return;
    const nextNum = 102 + journal.length;
    addJournal({
      id: `j-${Date.now()}`,
      date: formDate,
      ref: `JE-${String(nextNum).padStart(4, "0")}`,
      description: formDesc.trim(),
      lines: [
        { accountId: formDebitAcc, debit: formAmount, credit: 0 },
        { accountId: formCreditAcc, debit: 0, credit: formAmount },
      ],
      status: "draft",
    });
    setAddOpen(false);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("journalTitle")}
        subtitle={t("journalSubtitle", { count: filtered.length })}
        highlightLabel={t("tableDebit")}
        highlightValue={money(filtered.reduce((n, j) => n + journalTotals(j).debit, 0))}
        highlightIcon={NotebookPen}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addEntry")}
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
            setStatusFilter(v as "all" | "posted" | "draft");
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("viewAll")}</SelectItem>
            <SelectItem value="posted">{t("posted")}</SelectItem>
            <SelectItem value="draft">{t("draft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold text-foreground">{activeSelected.length}</p>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => {
                  removeJournal(activeSelected);
                  setSelected(new Set());
                  toast.success(t("toastDeleted", { count: activeSelected.length }));
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
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
                      checked={visible.length > 0 && visible.every((j) => selected.has(j.id))}
                      indeterminate={visible.some((j) => selected.has(j.id)) && !visible.every((j) => selected.has(j.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const j of visible) {
                            if (v === true) next.add(j.id);
                            else next.delete(j.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("journalTitle")}
                    />
                  </TableHead>
                  <TableHead className="w-10" />
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableDate")} {sortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("ref")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableRef")} {sortIcon("ref")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableDescription")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("amount")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableDebit")} {sortIcon("amount")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((j) => {
                  const { debit, credit } = journalTotals(j);
                  const balanced = isBalanced(j);
                  const isOpen = expanded.has(j.id);
                  return (
                    <Fragment key={j.id}>
                      <TableRow className={cn(selected.has(j.id) && "bg-secondary/5")}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(j.id)}
                            onCheckedChange={(v) =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(j.id);
                                else next.delete(j.id);
                                return next;
                              })
                            }
                            aria-label={j.ref}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(j.id)}
                            aria-expanded={isOpen}
                            aria-label={j.ref}
                            className="flex size-6 items-center justify-center text-muted-foreground hover:text-secondary"
                          >
                            <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                          </button>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{j.date}</TableCell>
                        <TableCell className="font-mono text-xs font-bold whitespace-nowrap">{j.ref}</TableCell>
                        <TableCell className="max-w-56 truncate text-sm" title={j.description}>
                          {j.description}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                          {money(debit)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge className={cn("font-semibold", j.status === "posted" ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>
                              {t(j.status)}
                            </Badge>
                            <Badge className={cn("font-semibold", balanced ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive")}>
                              {t(balanced ? "balanced" : "unbalanced")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {j.status === "draft" ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  patchJournal(j.id, { status: "posted" });
                                  toast.success(t("toastPosted"));
                                }}
                                aria-label={`${t("post")} ${j.ref}`}
                                title={t("post")}
                              >
                                <Upload className="size-4 text-secondary" aria-hidden="true" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                removeJournal([j.id]);
                                toast.success(t("toastDeleted", { count: 1 }));
                              }}
                              aria-label={j.ref}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow key={`${j.id}-lines`} className="bg-muted/40 hover:bg-muted/40">
                          <TableCell />
                          <TableCell />
                          <TableCell colSpan={3}>
                            <div className="flex flex-col gap-1 py-1">
                              {j.lines.map((l, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">{accountName(l.accountId)}</span>
                                  {" — "}
                                  {l.debit > 0 ? `${t("tableDebit")} ${money(l.debit)}` : `${t("tableCredit")} ${money(l.credit)}`}
                                </p>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold whitespace-nowrap">
                            {money(credit)}
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("addEntry")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tableDate")}>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tableAmount")}>
                <Input
                  type="number"
                  min={0}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                />
              </Field>
            </div>
            <Field label={t("tableDescription")}>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="bg-card" placeholder="September rent paid" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t("tableDebit")} — ${t("tableAccount")}`}>
                <Select value={formDebitAcc} onValueChange={(v) => setFormDebitAcc(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`${t("tableCredit")} — ${t("tableAccount")}`}>
                <Select value={formCreditAcc} onValueChange={(v) => setFormCreditAcc(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSaveNew}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
