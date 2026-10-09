"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Receipt,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { TxnStatus, TxnType, VendorTransaction } from "@/features/vendor/earnings";
import { buildVendorTransactions, downloadCsv } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorPayouts } from "@/store/vendor.store";
import { EarnTabs, TxnStatusBadge, TxnTypeBadge } from "@/components/vendor/earnings-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highest" | "lowest" | "recentUpd" | "pendingFirst";

function useDebounced<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setD(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return d;
}

const TYPES: TxnType[] = ["sale", "commission", "refund", "payout", "adjustment", "bonus", "penalty", "withdrawal", "chargeback"];
const STATUSES: TxnStatus[] = ["completed", "pending", "processing", "failed", "cancelled", "reversed"];

export default function VendorTransactionsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const orders = useVendorOrders();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const txns = useMemo(() => buildVendorTransactions(orders, payouts), [orders, payouts]);

  const [ready, setReady] = useState(false);
  const [qRaw, setQRaw] = useState("");
  const query = useDebounced(qRaw);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sheet, setSheet] = useState(false);
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fDate, setFDate] = useState("all");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = fMin === "" ? -Infinity : Number(fMin);
    const max = fMax === "" ? Infinity : Number(fMax);
    const now = +new Date("2026-09-26");
    const cutoff = (() => {
      if (fDate === "today") return now - 86400000;
      if (fDate === "yesterday") return now - 2 * 86400000;
      if (fDate === "7") return now - 7 * 86400000;
      if (fDate === "30") return now - 30 * 86400000;
      if (fDate === "month") return +new Date("2026-09-01");
      if (fDate === "lastMonth") return +new Date("2026-08-01");
      return 0;
    })();
    let list = [...txns];
    if (fType !== "all") list = list.filter((x) => x.type === fType);
    if (fStatus !== "all") list = list.filter((x) => x.status === fStatus);
    if (cutoff > 0 && fDate !== "lastMonth") list = list.filter((x) => +new Date(x.date) >= cutoff);
    if (fDate === "lastMonth") list = list.filter((x) => x.date.startsWith("2026-08"));
    if (fDate === "custom" && (fFrom || fTo)) {
      list = list.filter((x) => (!fFrom || x.date >= fFrom) && (!fTo || x.date <= fTo));
    }
    list = list.filter((x) => x.net >= min && x.net <= max);
    if (q) {
      list = list.filter((x) =>
        `${x.id} ${x.orderId} ${x.payoutId} ${x.refundId} ${x.product} ${x.customer} ${x.description}`.toLowerCase().includes(q)
      );
    }
    const rank: Record<string, number> = { pending: 0, processing: 1, completed: 2, failed: 3, cancelled: 4, reversed: 5 };
    switch (sort) {
      case "oldest": list.sort((a, b) => +new Date(a.date) - +new Date(b.date)); break;
      case "highest": list.sort((a, b) => Math.abs(b.net) - Math.abs(a.net)); break;
      case "lowest": list.sort((a, b) => Math.abs(a.net) - Math.abs(b.net)); break;
      case "recentUpd": list.sort((a, b) => +new Date(b.updated) - +new Date(a.updated)); break;
      case "pendingFirst": list.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)); break;
      default: list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
    return list;
  }, [txns, query, fType, fStatus, fDate, fMin, fMax, fFrom, fTo, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (fType !== "all") chips.push({ label: fType, clear: () => setFType("all") });
  if (fStatus !== "all") chips.push({ label: fStatus, clear: () => setFStatus("all") });
  if (fDate !== "all") chips.push({ label: fDate, clear: () => setFDate("all") });
  if (fMin !== "" || fMax !== "") chips.push({ label: `${fMin || "0"}–${fMax || "∞"}`, clear: () => { setFMin(""); setFMax(""); } });

  const clearAll = () => {
    setQRaw(""); setFType("all"); setFStatus("all"); setFDate("all");
    setFMin(""); setFMax(""); setFFrom(""); setFTo(""); setPage(0);
  };

  const receipt = (x: VendorTransaction) => {
    downloadCsv(`receipt-${x.id}.csv`,
      ["field", "value"],
      [["id", x.id], ["date", x.date], ["type", x.type], ["status", x.status], ["description", x.description],
       ["gross", x.gross], ["fee", x.fee], ["commission", x.commission], ["net", x.net],
       ["before", x.balanceBefore], ["after", x.balanceAfter], ["order", x.orderId], ["payout", x.payoutId]]);
    toast.success(t("exported"));
  };

  const actions = (x: VendorTransaction) => (
    <>
      <Link href={`/vendor/earnings/transactions/${x.id}`}>
        <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${x.id}`} title={t("view")}>
          <Eye className="size-4" aria-hidden="true" />
        </Button>
      </Link>
      <Button variant="ghost" size="icon-sm" onClick={() => { void navigator.clipboard.writeText(x.id); toast.success(t("eCopyTxn")); }} aria-label={t("eCopyTxn")} title={t("eCopyTxn")}>
        <Copy className="size-4" aria-hidden="true" />
      </Button>
      {x.orderId ? (
        <Link href={`/vendor/orders/${x.orderId}`}>
          <Button variant="ghost" size="icon-sm" aria-label={`${t("eViewOrder")} ${x.orderId}`} title={t("eViewOrder")}>
            <FileText className="size-4" aria-hidden="true" />
          </Button>
        </Link>
      ) : null}
      <Button variant="ghost" size="icon-sm" onClick={() => receipt(x)} aria-label={`${t("eReceipt")} ${x.id}`} title={t("eReceipt")}>
        <Receipt className="size-4" aria-hidden="true" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${t("eActions")} ${x.id}`} />}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/vendor/earnings/transactions/${x.id}`} />}>{t("viewDetails")}</DropdownMenuItem>
          {x.orderId ? <DropdownMenuItem render={<Link href={`/vendor/orders/${x.orderId}`} />}>{t("eViewOrder")}</DropdownMenuItem> : null}
          <DropdownMenuItem onClick={() => receipt(x)}>{t("eDownload")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(x.orderId || x.payoutId || x.id); toast.success(t("eCopyRef")); }}>{t("eCopyRef")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            downloadCsv(`txn-${x.id}.csv`, ["id", "net"], [[x.id, x.net]]);
            toast.success(t("exported"));
          }}>{t("eExport")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_earnings")}
        title={t("eTxnTitle")}
        subtitle={`${num(filtered.length)} · ${t("eSubtitle")}`}
        highlightLabel={t("eTxnTitle")}
        highlightValue={num(txns.length)}
        highlightIcon={Receipt}
      >
        <button type="button" onClick={() => setSheet(true)} className={heroPillClassName}>
          <Filter className="size-3.5" aria-hidden="true" />
          {t("eApply")}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadCsv("transactions.csv", ["id", "date", "type", "ref", "desc", "net", "fee", "balance", "status"],
              filtered.map((x) => [x.id, x.date, x.type, x.orderId || x.payoutId, x.description, x.net, x.fee, x.balanceAfter, x.status]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
        <button type="button" onClick={() => window.location.reload()} className={heroPillClassName}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </AccountingHero>

      <EarnTabs />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={qRaw} onChange={(e) => { setQRaw(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("eType")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("eNewest")}</SelectItem>
              <SelectItem value="oldest">{t("eOldest")}</SelectItem>
              <SelectItem value="highest">{t("eHighest")}</SelectItem>
              <SelectItem value="lowest">{t("eLowest")}</SelectItem>
              <SelectItem value="recentUpd">{t("eRecentUpd")}</SelectItem>
              <SelectItem value="pendingFirst">{t("ePendingFirst")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <button key={i} type="button" onClick={c.clear} className="flex items-center gap-1 border border-secondary/50 bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary hover:bg-secondary/20">
              {c.label}<X className="size-3" aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="text-[11px] font-bold text-destructive hover:underline">{t("eClearFilters")}</button>
        </div>
      ) : null}

      {!ready ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            {visible.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("eTxnId")}</TableHead>
                    <TableHead>{t("tDate")}</TableHead>
                    <TableHead>{t("eType")}</TableHead>
                    <TableHead>{t("eRef")}</TableHead>
                    <TableHead className="text-right">{t("tAmount")}</TableHead>
                    <TableHead className="text-right">{t("eBalance")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-44">{t("eActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((x) => (
                    <TableRow key={x.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/vendor/earnings/transactions/${x.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{x.id}</Link>
                        <p className="max-w-44 truncate text-[11px] text-muted-foreground" title={x.description}>{x.description}</p>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(x.date)}</TableCell>
                      <TableCell><TxnTypeBadge type={x.type} /></TableCell>
                      <TableCell className="font-mono text-xs">
                        {x.orderId ? <Link href={`/vendor/orders/${x.orderId}`} className="hover:text-secondary hover:underline">{x.orderId}</Link> : (x.payoutId || x.refundId || "—")}
                      </TableCell>
                      <TableCell className={cn("text-right font-bold whitespace-nowrap", x.net < 0 ? "text-destructive" : "text-green-700")}>
                        {x.net < 0 ? `−${money(-x.net)}` : `+${money(x.net)}`}
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">{money(x.balanceAfter)}</TableCell>
                      <TableCell>
                        <Link href={`/vendor/earnings/transactions/${x.id}`}><TxnStatusBadge status={x.status} /></Link>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-0.5">{actions(x)}</div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={Receipt} title={query || chips.length > 0 ? t("eNoResults") : t("eEmptyTxn")} description={query || chips.length > 0 ? t("emptyDescription") : t("eEmptyTxnDesc")} />
                {query || chips.length > 0 ? <Button variant="outline" size="sm" className="bg-card" onClick={clearAll}>{t("eClearFilters")}</Button> : null}
              </div>
            )}
          </CardContent>
          <CardContent className="grid gap-3 p-3 md:hidden">
            {visible.length > 0 ? visible.map((x) => (
              <div key={x.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <TxnTypeBadge type={x.type} />
                  <span className={cn("font-heading text-base font-bold", x.net < 0 ? "text-destructive" : "text-green-700")}>
                    {x.net < 0 ? `−${money(-x.net)}` : `+${money(x.net)}`}
                  </span>
                </div>
                <Link href={`/vendor/earnings/transactions/${x.id}`} className="font-mono text-xs font-bold">{x.id}</Link>
                {x.orderId ? <Link href={`/vendor/orders/${x.orderId}`} className="font-mono text-[11px] text-secondary hover:underline">#{x.orderId}</Link> : null}
                <p className="truncate text-sm">{x.description}</p>
                <div className="flex items-center justify-between">
                  <TxnStatusBadge status={x.status} />
                  <span className="text-xs text-muted-foreground">{dateOf(x.date)}</span>
                </div>
                <div className="flex items-center gap-0.5 border-t border-border pt-2">{actions(x)}</div>
              </div>
            )) : <EmptyState icon={Receipt} title={t("eEmptyTxn")} description={t("eEmptyTxnDesc")} />}
          </CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} / {num(filtered.length)}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous">
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} aria-label="Next">
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="font-heading text-base font-bold">{t("eApply")}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Field label={t("eType")}>
              <Select value={fType} onValueChange={(v) => setFType(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  {TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("tStatus")}>
              <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("eDateRange")}>
              <Select value={fDate} onValueChange={(v) => setFDate(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  <SelectItem value="today">{t("eToday")}</SelectItem>
                  <SelectItem value="yesterday">{t("eYesterday")}</SelectItem>
                  <SelectItem value="7">{t("eLast7")}</SelectItem>
                  <SelectItem value="30">{t("eLast30")}</SelectItem>
                  <SelectItem value="month">{t("eThisMonthF")}</SelectItem>
                  <SelectItem value="lastMonth">{t("eLastMonth")}</SelectItem>
                  <SelectItem value="custom">{t("eCustom")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {fDate === "custom" ? (
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("eFrom")}><Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="bg-card" /></Field>
                <Field label={t("eTo")}><Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="bg-card" /></Field>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("eMin")}><Input value={fMin} onChange={(e) => setFMin(e.target.value)} placeholder="0" inputMode="decimal" className="bg-card" /></Field>
              <Field label={t("eMax")}><Input value={fMax} onChange={(e) => setFMax(e.target.value)} placeholder="∞" inputMode="decimal" className="bg-card" /></Field>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-card" onClick={() => { clearAll(); setSheet(false); }}>{t("eReset")}</Button>
              <Button className="flex-1" onClick={() => { setPage(0); setSheet(false); }}>{t("eApply")}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
