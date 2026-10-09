"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  Download,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { UserSearch } from "lucide-react";
import { CustomerAvatar, CustomerStatusBadge } from "@/components/admin/customers/shared";
import { encodeCustomerKey } from "@/features/admin/customer-key";
import type { CustomerStatus } from "@/features/admin/customer-mgmt";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CustomerRecord } from "@/store/admin-customers.store";

export type CustomerRow = CustomerRecord;

export interface EnrichedCustomer extends CustomerRow {
  status: CustomerStatus;
  verified: boolean;
  wallet: number;
  reviews: number;
  joined: string;
}

type SortKey = "name" | "orders" | "spent" | "wallet" | "joined" | "lastOrder";

const TOGGLE_COLUMNS = ["phone", "orders", "spent", "wallet", "reviews", "joined", "lastOrder"] as const;
type ToggleCol = (typeof TOGGLE_COLUMNS)[number];

export function CustomersTable({
  rows,
  pageSize: controlledPageSize,
  onPageSizeChange,
  onDelete,
  onBulkDelete,
  onBulkStatus,
}: {
  rows: EnrichedCustomer[];
  pageSize?: number;
  onPageSizeChange?: (n: number) => void;
  onDelete?: (emails: string[]) => void;
  onBulkDelete?: (emails: string[]) => void;
  onBulkStatus?: (emails: string[], status: CustomerStatus) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const tc = useTranslations("Dashboard.calls");
  const tm = useTranslations("Dashboard.customers");
  const format = useFormatter();
  const [page, setPage] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<ToggleCol>>(new Set());

  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = (n: number) => {
    if (onPageSizeChange) onPageSizeChange(n);
    else setInternalPageSize(n);
    setPage(0);
  };

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const date = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const [sortKey, setSortKey] = useState<SortKey>("spent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "orders") return (a.orders - b.orders) * dir;
      if (sortKey === "spent") return (a.spent - b.spent) * dir;
      if (sortKey === "wallet") return (a.wallet - b.wallet) * dir;
      if (sortKey === "joined") return (a.joined > b.joined ? 1 : -1) * dir;
      if (sortKey === "lastOrder") return (a.lastOrder > b.lastOrder ? 1 : -1) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sorted, safePage, pageSize]
  );

  const activeSelected = useMemo(
    () => [...selected].filter((email) => rows.some((r) => r.email === email)),
    [selected, rows]
  );

  const show = (c: ToggleCol) => !hidden.has(c);
  const toggleCol = (c: ToggleCol) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "joined" ? "asc" : "desc");
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

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      toast.success(tc("copied"));
      window.setTimeout(() => setCopiedPhone(null), 1500);
    } catch {
      toast.error(tc("copied"));
    }
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? rows.filter((r) => selected.has(r.email)) : rows;
    if (list.length === 0) return;
    const lines = [
      ["name", "email", "phone", "city", "orders", "spent", "wallet", "status"].join(","),
      ...list.map((r) =>
        [r.name, r.email, r.phone, r.city, r.orders, r.spent, r.wallet, r.status].map(csvEscape).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("customers.exportSuccess", { count: list.length }));
  };

  const colLabel = (c: ToggleCol) =>
    c === "phone"
      ? t("customers.tablePhone")
      : c === "orders"
        ? t("customers.tableOrders")
        : c === "spent"
          ? t("customers.tableSpent")
          : c === "wallet"
            ? tm("tWallet")
            : c === "reviews"
              ? tm("tReviews")
              : c === "joined"
                ? tm("tJoined")
                : tm("tLastActive");

  const profileHref = (email: string) => `/dashboard/customers/${encodeCustomerKey(email)}`;

  return (
    <Card className="border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" aria-label={tm("tCustomer")} />}
          >
            <Columns3 className="size-3.5" aria-hidden="true" />
            {visible.length}/{sorted.length}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TOGGLE_COLUMNS.map((c) => (
              <DropdownMenuItem key={c} onSelect={(e) => e.preventDefault()} onClick={() => toggleCol(c)}>
                <Checkbox checked={show(c)} aria-label={colLabel(c)} />
                {colLabel(c)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {activeSelected.length > 0 ? (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("products.bulkClear")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold text-foreground">
              {t("products.bulkSelected", { count: activeSelected.length })}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 gap-1.5" onClick={handleExport}>
                <Download className="size-3.5" aria-hidden="true" />
                {t("products.exportBtn")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card" onClick={() => { onBulkStatus?.(activeSelected, "blocked"); setSelected(new Set()); }}>
                <Ban className="size-3.5 text-destructive" aria-hidden="true" />
                {tm("bulkBlock")}
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card" onClick={() => { onBulkStatus?.(activeSelected, "active"); setSelected(new Set()); }}>
                <CheckCircle2 className="size-3.5 text-green-600" aria-hidden="true" />
                {tm("bulkUnblock")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => {
                  onBulkDelete?.(activeSelected);
                  setSelected(new Set());
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("products.bulkDelete")}
              </Button>
            </div>
          </>
        ) : null}
      </div>
      <CardContent className="overflow-x-auto p-0">
        {visible.length > 0 ? (
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="w-10">
                  <Checkbox
                    checked={visible.length > 0 && visible.every((r) => selected.has(r.email))}
                    indeterminate={visible.some((r) => selected.has(r.email)) && !visible.every((r) => selected.has(r.email))}
                    onCheckedChange={(v) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        for (const r of visible) {
                          if (v === true) next.add(r.email);
                          else next.delete(r.email);
                        }
                        return next;
                      });
                    }}
                    aria-label={t("products.bulkSelected", { count: visible.length })}
                  />
                </TableHead>
                {sortableHead("name", t("customers.tableCustomer"))}
                {show("phone") ? <TableHead>{t("customers.tablePhone")}</TableHead> : null}
                {show("orders") ? sortableHead("orders", t("customers.tableOrders"), "text-center") : null}
                {show("spent") ? sortableHead("spent", t("customers.tableSpent"), "text-right") : null}
                {show("wallet") ? sortableHead("wallet", tm("tWallet"), "text-right") : null}
                {show("reviews") ? <TableHead className="text-center">{tm("tReviews")}</TableHead> : null}
                <TableHead>{tm("tStatus")}</TableHead>
                {show("joined") ? sortableHead("joined", tm("tJoined")) : null}
                {show("lastOrder") ? sortableHead("lastOrder", tm("tLastActive"), "text-right") : null}
                <TableHead className="w-24">{t("customers.colAction")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.email} className={cn(selected.has(row.email) && "bg-secondary/5")}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(row.email)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(row.email);
                          else next.delete(row.email);
                          return next;
                        })
                      }
                      aria-label={row.email}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CustomerAvatar name={row.name} />
                      <div>
                        <p className="text-sm font-semibold whitespace-nowrap text-foreground">
                          <Link href={profileHref(row.email)} className="hover:text-secondary hover:underline">
                            {row.name}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  {show("phone") ? (
                    <TableCell className="whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {row.phone}
                        <button
                          type="button"
                          onClick={() => void copyPhone(row.phone)}
                          aria-label={row.phone}
                          className="flex size-5 items-center justify-center transition-colors hover:bg-muted hover:text-secondary"
                        >
                          {copiedPhone === row.phone ? (
                            <Check className="size-3 text-green-600" aria-hidden="true" />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                        </button>
                      </span>
                    </TableCell>
                  ) : null}
                  {show("orders") ? <TableCell className="text-center font-semibold">{row.orders}</TableCell> : null}
                  {show("spent") ? (
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">
                      {money(row.spent)}
                    </TableCell>
                  ) : null}
                  {show("wallet") ? (
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="size-3.5 text-secondary" aria-hidden="true" />
                        {money(row.wallet)}
                      </span>
                    </TableCell>
                  ) : null}
                  {show("reviews") ? (
                    <TableCell className="text-center text-sm">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                        {row.reviews}
                      </span>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <CustomerStatusBadge status={row.status} />
                      {row.verified ? (
                        <Badge className="bg-green-600/10 text-[10px] font-semibold text-green-700">{tm("verified")}</Badge>
                      ) : (
                        <Badge className="bg-muted text-[10px] font-semibold text-muted-foreground">{tm("unverified")}</Badge>
                      )}
                    </div>
                  </TableCell>
                  {show("joined") ? (
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{date(row.joined)}</TableCell>
                  ) : null}
                  {show("lastOrder") ? (
                    <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      {date(row.lastOrder)}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={profileHref(row.email)}>
                        <Button variant="ghost" size="icon-sm" aria-label={`${t("orders.viewAction")} ${row.name}`} title={t("orders.viewAction")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={row.name} />}
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={profileHref(row.email)} />}>
                            <Eye className="size-3.5" aria-hidden="true" />
                            {tm("tabOverview")}
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`${profileHref(row.email)}/edit`} />}>
                            <Pencil className="size-3.5" aria-hidden="true" />
                            {t("customers.editCustomer")}
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href="/dashboard/customers/activity" />}>
                            <History className="size-3.5" aria-hidden="true" />
                            {tm("tabActivity")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onBulkStatus?.([row.email], row.status === "blocked" ? "active" : "blocked")}
                            className={row.status === "blocked" ? "text-green-700" : "text-destructive"}
                          >
                            {row.status === "blocked" ? (
                              <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            ) : (
                              <Ban className="size-3.5" aria-hidden="true" />
                            )}
                            {row.status === "blocked" ? tm("bulkUnblock") : tm("bulkBlock")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete?.([row.email])} className="text-destructive">
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            {t("products.bulkDelete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8">
            <EmptyState icon={UserSearch} title={tm("emptyTitle")} description={tm("emptyDescription")} />
          </div>
        )}
      </CardContent>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) || 10)}>
            <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
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
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {t("orders.pageOf", { page: safePage + 1, pages: pageCount })}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            {t("orders.prevPage")}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
            {t("orders.nextPage")}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

    </Card>
  );
}
