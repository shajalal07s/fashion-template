"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { useCustomerDirectory } from "@/components/admin/customers/useCustomerDirectory";
import { walletForCustomer } from "@/features/admin/customer-mgmt";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CustomerWalletPage() {
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const directory = useCustomerDirectory();
  const mgmt = useCustomerMgmtStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewEmail, setViewEmail] = useState<string | null>(null);
  const [adjustEmail, setAdjustEmail] = useState<string | null>(null);
  const [adjKind, setAdjKind] = useState<"add" | "deduct">("add");
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjReason, setAdjReason] = useState("");

  const wallets = useMemo(
    () =>
      directory.map((c) => {
        const base = walletForCustomer(c.email, c.spent, c.orders);
        const extra = mgmt.walletExtra[c.email.toLowerCase()] ?? [];
        const txs = [...extra, ...base.txs];
        const balance = txs.length > 0 ? txs[0].balanceAfter : base.balance;
        return { customer: c, balance, txs };
      }),
    [directory, mgmt.walletExtra]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wallets;
    return wallets.filter(
      (w) => w.customer.name.toLowerCase().includes(q) || w.customer.email.toLowerCase().includes(q)
    );
  }, [wallets, query]);

  const withBalance = useMemo(() => filtered.filter((w) => w.balance > 0), [filtered]);
  const totalBalance = useMemo(() => filtered.reduce((n, w) => n + w.balance, 0), [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const viewed = viewEmail ? (wallets.find((w) => w.customer.email === viewEmail) ?? null) : null;
  const adjusting = adjustEmail ? (wallets.find((w) => w.customer.email === adjustEmail) ?? null) : null;

  const handleAdjust = () => {
    if (!adjusting || adjAmount <= 0 || !adjReason.trim()) return;
    const delta = adjKind === "add" ? adjAmount : -adjAmount;
    mgmt.adjustWallet(adjusting.customer.email, {
      id: `WTX-A${adjusting.txs.length}${adjAmount}${adjusting.customer.email.length}`,
      type: "adjustment",
      description: adjReason.trim(),
      amount: delta,
      balanceAfter: Math.max(0, adjusting.balance + delta),
      status: "completed",
      date: "2026-09-26",
      reference: "ADMIN",
    });
    setAdjustEmail(null);
    setAdjAmount(0);
    setAdjReason("");
    toast.success(tm("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={tm("wTitle")}
        subtitle={tm("wSubtitle", { count: withBalance.length })}
        highlightLabel={tm("wBalance")}
        highlightValue={money(totalBalance)}
        highlightIcon={Wallet}
      >
        <span className={heroPillClassName}>
          {tm("wPending")}: {money(wallets.flatMap((w) => w.txs).filter((x) => x.status === "pending").reduce((n, x) => n + Math.abs(x.amount), 0))}
        </span>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={tm("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{tm("tCustomer")}</TableHead>
                  <TableHead className="text-right">{tm("wBalance")}</TableHead>
                  <TableHead className="text-right">{tm("wCredits")}</TableHead>
                  <TableHead className="text-right">{tm("wDebits")}</TableHead>
                  <TableHead className="text-center">{tm("tTx")}</TableHead>
                  <TableHead className="w-28">{tm("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((w) => {
                  const credits = w.txs.filter((x) => x.amount > 0).reduce((n, x) => n + x.amount, 0);
                  const debits = Math.abs(w.txs.filter((x) => x.amount < 0).reduce((n, x) => n + x.amount, 0));
                  return (
                    <TableRow key={w.customer.email}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CustomerAvatar name={w.customer.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold whitespace-nowrap">{w.customer.name}</p>
                            <p className="text-xs text-muted-foreground">{w.customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                        {money(w.balance)}
                      </TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap text-green-600">+{money(credits)}</TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap text-destructive">-{money(debits)}</TableCell>
                      <TableCell className="text-center text-sm font-semibold">{w.txs.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setViewEmail(w.customer.email)} aria-label={`${tm("viewTitle")} ${w.customer.name}`} title={tm("viewTitle")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setAdjustEmail(w.customer.email)} aria-label={`${tm("adjustTitle")} ${w.customer.name}`} title={tm("adjustTitle")}>
                            <Plus className="size-4 text-secondary" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={Wallet} title={tm("emptyTitle")} description={tm("emptyDescription")} />
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewEmail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {viewed.customer.name} · {money(viewed.balance)}
                </DialogTitle>
              </DialogHeader>
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_td:not(:first-child)]:border-l [&_th]:h-10 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{tm("tTx")}</TableHead>
                    <TableHead>{tm("tType")}</TableHead>
                    <TableHead className="text-right">{tm("tAmount")}</TableHead>
                    <TableHead className="text-right">{tm("tBalanceAfter")}</TableHead>
                    <TableHead>{tm("tTxStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewed.txs.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>
                        <p className="font-mono text-xs font-bold">{x.id}</p>
                        <p className="max-w-40 truncate text-xs text-muted-foreground" title={x.description}>{x.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/20 text-[11px] font-semibold whitespace-nowrap text-[#8a5a00]">
                          {tm(`ty${x.type[0].toUpperCase()}${x.type.slice(1)}` as "tyCredit")}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right text-sm font-bold whitespace-nowrap", x.amount >= 0 ? "text-green-600" : "text-destructive")}>
                        {x.amount >= 0 ? "+" : ""}{money(x.amount)}
                      </TableCell>
                      <TableCell className="text-right text-sm whitespace-nowrap">{money(x.balanceAfter)}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] font-semibold", x.status === "completed" ? "bg-green-600/10 text-green-700" : "bg-primary/20 text-[#8a5a00]")}>
                          {tm(`st${x.status[0].toUpperCase()}${x.status.slice(1)}` as "stCompleted")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjusting} onOpenChange={(open) => !open && setAdjustEmail(null)}>
        <DialogContent className="sm:max-w-md">
          {adjusting ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {tm("adjustTitle")} · {adjusting.customer.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tm("adjAmount")}>
                  <Input type="number" min={0} value={adjAmount} onChange={(e) => setAdjAmount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
                </Field>
                <Field label={tm("tType")}>
                  <Select value={adjKind} onValueChange={(v) => setAdjKind((v as "add" | "deduct") ?? "add")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">{tm("adjAdd")}</SelectItem>
                      <SelectItem value="deduct">{tm("adjDeduct")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label={tm("adjReason")}>
                <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className="bg-card" />
              </Field>
              <div className="flex flex-col items-stretch border border-dashed border-secondary/40 bg-secondary/5 p-3">
                {[`${tm("currentBal")}: ${money(adjusting.balance)}`, `${adjKind === "add" ? "+" : "-"}${money(adjAmount)}`, `${tm("newBal")}: ${money(Math.max(0, adjusting.balance + (adjKind === "add" ? adjAmount : -adjAmount)))}`].map((s, i, arr) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className={i === arr.length - 1 ? "w-full py-1 text-center text-sm font-bold text-secondary" : "w-full py-1 text-center text-sm"}>{s}</span>
                    {i < arr.length - 1 ? <ArrowDown className="size-3.5 text-secondary" aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdjustEmail(null)}>{tm("cancelBtn")}</Button>
                <Button size="sm" onClick={handleAdjust}>{tm("saveBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
