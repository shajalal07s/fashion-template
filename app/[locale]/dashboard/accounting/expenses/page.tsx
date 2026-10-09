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
  Plus,
  ReceiptText,
  Search,
  Trash2,
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
import { EXPENSE_CATEGORIES, type Expense } from "@/features/admin/accounting";
import { useAccountingStore, useExpenses } from "@/store/accounting.store";

type SortKey = "date" | "amount";

export default function AccountingExpensesPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const expenses = useExpenses();
  const addExpense = useAccountingStore((s) => s.addExpense);
  const patchExpense = useAccountingStore((s) => s.patchExpense);
  const removeExpenses = useAccountingStore((s) => s.removeExpenses);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Expense["status"]>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [formDate, setFormDate] = useState("2026-09-24");
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formVendor, setFormVendor] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState(0);
  const [formMethod, setFormMethod] = useState("Cash");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (statusFilter === "all" || e.status === statusFilter) &&
        (!q ||
          e.vendor.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q))
    );
  }, [expenses, query, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeSelected = useMemo(
    () => [...selected].filter((id) => expenses.some((e) => e.id === id)),
    [selected, expenses]
  );
  const totalAmount = useMemo(() => filtered.reduce((n, e) => n + e.amount, 0), [filtered]);

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

  const statusClass = (s: Expense["status"]) =>
    s === "paid"
      ? "bg-green-600/10 text-green-700"
      : s === "approved"
        ? "bg-secondary/15 text-secondary"
        : "bg-primary/20 text-[#8a5a00]";

  const handleExport = () => {
    const list = activeSelected.length > 0 ? expenses.filter((e) => selected.has(e.id)) : filtered;
    if (list.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["date", "category", "vendor", "description", "amount", "method", "status"].join(","),
      ...list.map((e) => [e.date, e.category, e.vendor, e.description, e.amount, e.method, e.status].map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const openAdd = () => {
    setFormDate("2026-09-24");
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormVendor("");
    setFormDesc("");
    setFormAmount(0);
    setFormMethod("Cash");
    setAddOpen(true);
  };

  const handleSaveNew = () => {
    if (!formVendor.trim() || formAmount <= 0) return;
    addExpense({
      id: `e-${Date.now()}`,
      date: formDate,
      category: formCategory,
      vendor: formVendor.trim(),
      description: formDesc.trim() || formCategory,
      amount: formAmount,
      method: formMethod,
      status: "pending",
    });
    setAddOpen(false);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("expensesTitle")}
        subtitle={t("expensesSubtitle", { count: filtered.length })}
        highlightLabel={t("kpiExpenses")}
        highlightValue={money(totalAmount)}
        highlightIcon={ReceiptText}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addExpense")}
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
            setStatusFilter(v as "all" | Expense["status"]);
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("viewAll")}</SelectItem>
            <SelectItem value="paid">{t("paid")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs font-semibold text-muted-foreground sm:ml-auto">
          {t("kpiExpenses")}: <span className="text-base font-bold text-secondary">{money(totalAmount)}</span>
        </p>
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
                  removeExpenses(activeSelected);
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
                      checked={visible.length > 0 && visible.every((e) => selected.has(e.id))}
                      indeterminate={visible.some((e) => selected.has(e.id)) && !visible.every((e) => selected.has(e.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const e of visible) {
                            if (v === true) next.add(e.id);
                            else next.delete(e.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("expensesTitle")}
                    />
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableDate")} {sortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableCategory")}</TableHead>
                  <TableHead>{t("tableVendor")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("amount")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableAmount")} {sortIcon("amount")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableMethod")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((e) => (
                  <TableRow key={e.id} className={cn(selected.has(e.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(e.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(e.id);
                            else next.delete(e.id);
                            return next;
                          })
                        }
                        aria-label={e.vendor}
                      />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{e.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">{e.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{e.vendor}</p>
                      <p className="max-w-48 truncate text-xs text-muted-foreground" title={e.description}>{e.description}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(e.amount)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{e.method}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", statusClass(e.status))}>
                        {t(e.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {e.status !== "paid" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patchExpense(e.id, { status: e.status === "pending" ? "approved" : "paid" });
                              toast.success(t(e.status === "pending" ? "toastApproved" : "toastPaid"));
                            }}
                            aria-label={`${t("approve")} ${e.vendor}`}
                            title={t("approve")}
                          >
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            removeExpenses([e.id]);
                            toast.success(t("toastDeleted", { count: 1 }));
                          }}
                          aria-label={e.vendor}
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
            <DialogTitle className="font-heading text-base font-bold">{t("addExpense")}</DialogTitle>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tableCategory")}>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tableMethod")}>
                <Select value={formMethod} onValueChange={(v) => setFormMethod(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Cash", "Bank", "bKash", "Nagad"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("tableVendor")}>
              <Input value={formVendor} onChange={(e) => setFormVendor(e.target.value)} className="bg-card" placeholder="Gulshan Holdings" />
            </Field>
            <Field label={t("tableDescription")}>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="bg-card" placeholder="September shop rent" />
            </Field>
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
