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
  Eye,
  HandCoins,
  Printer,
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
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AccInvoice } from "@/features/admin/accounting";
import { useAccInvoices, useAccountingStore } from "@/store/accounting.store";

type SortKey = "date" | "total";

export default function AccountingInvoicesPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const invoices = useAccInvoices();
  const patchInvoice = useAccountingStore((s) => s.patchInvoice);
  const removeInvoices = useAccountingStore((s) => s.removeInvoices);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccInvoice["status"]>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewId, setViewId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const dueOf = (i: AccInvoice) => Math.max(0, i.total - i.paidAmount);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter(
      (i) =>
        (statusFilter === "all" || i.status === statusFilter) &&
        (!q || i.customer.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    );
  }, [invoices, query, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "total") return (a.total - b.total) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const activeSelected = useMemo(
    () => [...selected].filter((id) => invoices.some((i) => i.id === id)),
    [selected, invoices]
  );
  const totalDue = useMemo(() => filtered.reduce((n, i) => n + dueOf(i), 0), [filtered]);

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

  const statusClass = (s: AccInvoice["status"]) =>
    s === "paid"
      ? "bg-green-600/10 text-green-700"
      : s === "partial"
        ? "bg-secondary/15 text-secondary"
        : s === "overdue"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/20 text-[#8a5a00]";

  const handleExport = () => {
    const list = activeSelected.length > 0 ? invoices.filter((i) => selected.has(i.id)) : filtered;
    if (list.length === 0) return;
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["invoice", "customer", "date", "due", "subtotal", "tax", "total", "paid", "status"].join(","),
      ...list.map((i) => [i.id, i.customer, i.date, i.due, i.subtotal, i.tax, i.total, i.paidAmount, i.status].map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess", { count: list.length }));
  };

  const openPay = (i: AccInvoice) => {
    setPayId(i.id);
    setPayAmount(dueOf(i));
  };

  const handlePay = () => {
    const inv = invoices.find((i) => i.id === payId);
    if (!inv) return;
    const next = Math.min(inv.total, inv.paidAmount + Math.max(0, payAmount));
    patchInvoice(inv.id, {
      paidAmount: next,
      status: next >= inv.total ? "paid" : next > 0 ? "partial" : inv.status,
    });
    setPayId(null);
    toast.success(t("toastPaid"));
  };

  const viewed = viewId ? (invoices.find((i) => i.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("invoicesTitle")}
        subtitle={t("invoicesSubtitle", { count: filtered.length })}
        highlightLabel={t("tableDueAmount")}
        highlightValue={money(totalDue)}
        highlightIcon={HandCoins}
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
            setStatusFilter(v as "all" | AccInvoice["status"]);
            setPage(0);
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("viewAll")}</SelectItem>
            <SelectItem value="paid">{t("paid")}</SelectItem>
            <SelectItem value="unpaid">{t("unpaid")}</SelectItem>
            <SelectItem value="partial">{t("partial")}</SelectItem>
            <SelectItem value="overdue">{t("overdue")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs font-semibold text-muted-foreground sm:ml-auto">
          {t("tableDueAmount")}: <span className="text-base font-bold text-destructive">{money(totalDue)}</span>
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
                  removeInvoices(activeSelected);
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
                      checked={visible.length > 0 && visible.every((i) => selected.has(i.id))}
                      indeterminate={visible.some((i) => selected.has(i.id)) && !visible.every((i) => selected.has(i.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const i of visible) {
                            if (v === true) next.add(i.id);
                            else next.delete(i.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("invoicesTitle")}
                    />
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableDate")} {sortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableCustomer")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("total")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tableTotal")} {sortIcon("total")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">{t("tableDueAmount")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((i) => (
                  <TableRow key={i.id} className={cn(selected.has(i.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(i.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(i.id);
                            else next.delete(i.id);
                            return next;
                          })
                        }
                        aria-label={i.id}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{i.id}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{i.date}</p>
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{i.customer}</TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(i.total)}
                    </TableCell>
                    <TableCell className={cn("text-right text-sm font-bold whitespace-nowrap", dueOf(i) > 0 ? "text-destructive" : "text-green-600")}>
                      {money(dueOf(i))}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", statusClass(i.status))}>
                        {t(i.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(i.id)} aria-label={`${t("viewTitle")} ${i.id}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        {dueOf(i) > 0 ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => openPay(i)} aria-label={`${t("recordPayment")} ${i.id}`} title={t("recordPayment")}>
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("viewTitle")} · <span className="font-mono">{viewed.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableCustomer")}</span>
                  <span className="font-semibold">{viewed.customer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableDate")}</span>
                  <span>{viewed.date} → {viewed.due}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableItems")}</span>
                  <span>{viewed.items}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">{t("tableTotal")}</span>
                  <span className="font-bold text-secondary">{money(viewed.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tablePaid")}</span>
                  <span className="font-semibold text-green-600">{money(viewed.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableDueAmount")}</span>
                  <span className="font-bold text-destructive">{money(dueOf(viewed))}</span>
                </div>
              </div>
              <div id="invoice-print" className="hidden">
                <InvoiceSlip invoice={viewed} money={money} />
              </div>
              <div className="flex items-center justify-end gap-2">
                {dueOf(viewed) > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-card"
                    onClick={() => {
                      setViewId(null);
                      openPay(viewed);
                    }}
                  >
                    <HandCoins className="size-3.5" aria-hidden="true" />
                    {t("recordPayment")}
                  </Button>
                ) : null}
                <Button size="sm" className="gap-1.5" onClick={() => printInvoiceDoc()}>
                  <Printer className="size-3.5" aria-hidden="true" />
                  {t("printBtn")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!payId} onOpenChange={(open) => !open && setPayId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("paymentTitle")}</DialogTitle>
          </DialogHeader>
          <Field label={t("paymentAmount")}>
            <Input
              type="number"
              min={0}
              value={payAmount}
              onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value) || 0))}
              className="bg-card"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPayId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handlePay}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceSlip({ invoice, money }: { invoice: AccInvoice; money: (v: number) => string }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-2 text-sm">
      <p className="text-center font-heading text-xl font-bold text-foreground">Fashion Store</p>
      <p className="text-center font-mono text-sm font-bold">{invoice.id}</p>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span>Customer</span>
        <span className="font-semibold">{invoice.customer}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Subtotal</span>
        <span>{money(invoice.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>VAT</span>
        <span>{money(invoice.tax)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
        <span>Total</span>
        <span>{money(invoice.total)}</span>
      </div>
    </div>
  );
}
