"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Receipt,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { PAYOUT_CONFIG, enrichPayout } from "@/features/vendor/payouts";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorPayouts } from "@/store/vendor.store";
import { PayoutTabs, PoStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highest" | "lowest" | "recent";

export default function VendorPayoutHistoryPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const rows = useMemo(() => payouts.map(enrichPayout), [payouts]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fMethod, setFMethod] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rows];
    if (fStatus !== "all") list = list.filter((p) => p.status === fStatus);
    if (fMethod !== "all") list = list.filter((p) => p.method === fMethod);
    if (needle) list = list.filter((p) => `${p.id} ${p.txnId} ${p.reference}`.toLowerCase().includes(needle));
    switch (sort) {
      case "oldest": list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "highest": list.sort((a, b) => b.amount - a.amount); break;
      case "lowest": list.sort((a, b) => a.amount - b.amount); break;
      case "recent": list.sort((a, b) => (b.processed || b.date).localeCompare(a.processed || a.date)); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [rows, q, fStatus, fMethod, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poHistory")}
        subtitle={`${num(filtered.length)} · ${t("poSubtitle")}`}
        highlightLabel={t("poTotal")}
        highlightValue={num(payouts.length)}
        highlightIcon={Receipt}
      >
        <button
          type="button"
          onClick={() => {
            downloadCsv("payout-history.csv", ["id", "date", "amount", "fee", "net", "method", "status", "processed"],
              filtered.map((p) => [p.id, p.date, p.amount, p.fee, p.net, p.method, p.status, p.processed]));
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

      <PayoutTabs />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="PO-310, TXN-PO-310, REF-PO-310" className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={fStatus} onValueChange={(v) => { setFStatus(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("tStatus")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {["pending", "processing", "completed", "failed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fMethod} onValueChange={(v) => { setFMethod(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("poMethod")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {PAYOUT_CONFIG.methods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("eNewest")}</SelectItem>
              <SelectItem value="oldest">{t("eOldest")}</SelectItem>
              <SelectItem value="highest">{t("eHighest")}</SelectItem>
              <SelectItem value="lowest">{t("eLowest")}</SelectItem>
              <SelectItem value="recent">{t("eRecentUpd")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(fStatus !== "all" || fMethod !== "all") ? (
        <div className="flex gap-1.5">
          <button type="button" onClick={() => { setFStatus("all"); setFMethod("all"); setQ(""); }} className="flex items-center gap-1 text-[11px] font-bold text-destructive hover:underline">
            {t("eClearFilters")} <X className="size-3" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {!ready ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            {visible.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tPayout")}</TableHead>
                    <TableHead>{t("tDate")}</TableHead>
                    <TableHead className="text-right">{t("tAmount")}</TableHead>
                    <TableHead className="text-right">{t("poFee")}</TableHead>
                    <TableHead className="text-right">{t("poNet")}</TableHead>
                    <TableHead>{t("poMethod")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-28">{t("eActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Link href={`/vendor/payouts/${p.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{p.id}</Link></TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{dateOf(p.date)}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">{money(p.amount)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{money(p.fee)}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(p.net)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{p.method}</TableCell>
                      <TableCell><PoStatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Link href={`/vendor/payouts/${p.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${p.id}`}><Eye className="size-4" aria-hidden="true" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon-sm" onClick={() => { void navigator.clipboard.writeText(p.id); toast.success(t("eCopyTxn")); }} aria-label={t("eCopyTxn")}><Copy className="size-4" aria-hidden="true" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={Receipt} title={t("poEmpty")} description={t("poEmptyDesc")} />
                <Link href="/vendor/payouts/request"><Button size="sm">{t("poRequest")}</Button></Link>
              </div>
            )}
          </CardContent>
          <CardContent className="grid gap-3 p-3 md:hidden">
            {visible.length > 0 ? visible.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <Link href={`/vendor/payouts/${p.id}`} className="font-mono text-xs font-bold">{p.id}</Link>
                  <PoStatusBadge status={p.status} />
                </div>
                <p className="font-heading text-xl font-bold text-secondary">{money(p.amount)}</p>
                <p className="text-xs text-muted-foreground">{t("poNet")}: {money(p.net)} · {p.method}</p>
                <p className="text-xs text-muted-foreground">{dateOf(p.date)}</p>
                <Link href={`/vendor/payouts/${p.id}`} className="border-t border-border pt-2 text-xs font-bold text-secondary hover:underline">{t("viewDetails")}</Link>
              </div>
            )) : <EmptyState icon={Receipt} title={t("poEmpty")} description={t("poEmptyDesc")} />}
          </CardContent>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} / {num(filtered.length)}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous"><ChevronLeft className="size-3.5" aria-hidden="true" /></Button>
              <span className="px-2 text-xs text-muted-foreground">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} aria-label="Next"><ChevronRight className="size-3.5" aria-hidden="true" /></Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
