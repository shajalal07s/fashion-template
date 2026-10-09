"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Field } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Account, AccountType } from "@/features/admin/accounting";
import { useAccountingStore, useAccounts } from "@/store/accounting.store";

type SortKey = "code" | "name" | "balance";
const TYPES: AccountType[] = ["asset", "liability", "equity", "income", "expense"];

export default function AccountingAccountsPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const accounts = useAccounts();
  const addAccount = useAccountingStore((s) => s.addAccount);
  const patchAccount = useAccountingStore((s) => s.patchAccount);
  const removeAccounts = useAccountingStore((s) => s.removeAccounts);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AccountType>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("asset");
  const [formBalance, setFormBalance] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter(
      (a) =>
        (typeFilter === "all" || a.type === typeFilter) &&
        (!q || a.name.toLowerCase().includes(q) || a.code.includes(q))
    );
  }, [accounts, query, typeFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "balance") return (a.balance - b.balance) * dir;
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      return a.code.localeCompare(b.code) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeSelected = useMemo(
    () => [...selected].filter((id) => accounts.some((a) => a.id === id)),
    [selected, accounts]
  );
  const totalBalance = useMemo(
    () => filtered.reduce((n, a) => n + a.balance, 0),
    [filtered]
  );
  const typeTotals = useMemo(
    () =>
      TYPES.map((ty) => ({
        type: ty,
        total: accounts
          .filter((a) => a.type === ty && a.status === "active")
          .reduce((n, a) => n + a.balance, 0),
      })),
    [accounts]
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

  const handleExport = () => {
    const list = activeSelected.length > 0 ? accounts.filter((a) => selected.has(a.id)) : filtered;
    if (list.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["code", "name", "type", "balance", "status"].join(","),
      ...list.map((a) => [a.code, a.name, a.type, a.balance, a.status].map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart-of-accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const openAdd = () => {
    setFormCode("");
    setFormName("");
    setFormType("asset");
    setFormBalance(0);
    setAddOpen(true);
  };

  const openEdit = (a: Account) => {
    setFormCode(a.code);
    setFormName(a.name);
    setFormType(a.type);
    setFormBalance(a.balance);
    setEditId(a.id);
  };

  const handleSaveNew = () => {
    if (!formCode.trim() || !formName.trim()) return;
    addAccount({
      id: `a-${Date.now()}`,
      code: formCode.trim(),
      name: formName.trim(),
      type: formType,
      balance: Math.max(0, formBalance),
      status: "active",
    });
    setAddOpen(false);
    toast.success(t("toastSaved"));
  };

  const handleSaveEdit = () => {
    if (!editId || !formCode.trim() || !formName.trim()) return;
    patchAccount(editId, {
      code: formCode.trim(),
      name: formName.trim(),
      type: formType,
      balance: Math.max(0, formBalance),
    });
    setEditId(null);
    toast.success(t("toastSaved"));
  };

  const formFields = (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("tableCode")}>
          <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} className="bg-card font-mono" placeholder="1050" />
        </Field>
        <Field label={t("tableType")}>
          <Select value={formType} onValueChange={(v) => setFormType(v as AccountType)}>
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((ty) => (
                <SelectItem key={ty} value={ty}>
                  {t(ty)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={t("tableAccount")}>
        <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-card" placeholder="Cash in Hand" />
      </Field>
      <Field label={t("tableBalance")}>
        <Input
          type="number"
          min={0}
          value={formBalance}
          onChange={(e) => setFormBalance(Math.max(0, Number(e.target.value) || 0))}
          className="bg-card"
        />
      </Field>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("accountsTitle")}
        description={t("accountsSubtitle", { count: filtered.length })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" onClick={handleExport}>
              <Download className="size-3.5" aria-hidden="true" />
              {t("exportBtn")}
            </Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={openAdd}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("addAccount")}
            </Button>
          </div>
        }
      />

      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("accountsTitle")}
        subtitle={t("accountsSubtitle", { count: filtered.length })}
        highlightLabel={t("totalBalance")}
        highlightValue={money(totalBalance)}
        highlightIcon={Wallet}
      >
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
          {typeTotals.map((row) => (
            <div key={row.type} className="flex flex-col gap-0.5 border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">
              <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                {t(row.type)}
              </span>
              <span className="truncate text-sm font-bold text-white">{money(row.total)}</span>
            </div>
          ))}
        </div>
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
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as "all" | AccountType);
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("viewAll")}</SelectItem>
            {TYPES.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {t(ty)}
              </SelectItem>
            ))}
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
                  removeAccounts(activeSelected);
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
                      checked={visible.length > 0 && visible.every((a) => selected.has(a.id))}
                      indeterminate={visible.some((a) => selected.has(a.id)) && !visible.every((a) => selected.has(a.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const a of visible) {
                            if (v === true) next.add(a.id);
                            else next.delete(a.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("tableAccount")}
                    />
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("code")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableCode")} {sortIcon("code")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableAccount")} {sortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableType")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("balance")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableBalance")} {sortIcon("balance")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow key={a.id} className={cn(selected.has(a.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(a.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(a.id);
                            else next.delete(a.id);
                            return next;
                          })
                        }
                        aria-label={a.name}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">{a.code}</TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{a.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold text-[#8a5a00]">{t(a.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(a.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-semibold",
                          a.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t(a.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label={`${t("editTitle")} ${a.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => patchAccount(a.id, { status: a.status === "active" ? "inactive" : "active" })}
                          aria-label={a.name}
                          title={a.name}
                        >
                          <Power className={cn("size-4", a.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
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
            <DialogTitle className="font-heading text-base font-bold">{t("addAccount")}</DialogTitle>
          </DialogHeader>
          {formFields}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSaveNew}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("editTitle")}</DialogTitle>
          </DialogHeader>
          {formFields}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSaveEdit}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
