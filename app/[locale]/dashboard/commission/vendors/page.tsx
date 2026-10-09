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
  History,
  Pencil,
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
import { PackageSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { rateLabel, PRIORITY_ORDER, type CommissionType, type VendorCommission } from "@/features/admin/commission";
import { useCommissionStore, useCommissionVendors } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "vendor" | "sales" | "earned";

export default function VendorCommissionPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const vendors = useCommissionVendors();
  const patchVendor = useCommissionStore((s) => s.patchVendor);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("sales");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<CommissionType>("percentage");
  const [formRate, setFormRate] = useState(10);
  const [formFixed, setFormFixed] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) => v.vendor.toLowerCase().includes(q) || v.store.toLowerCase().includes(q)
    );
  }, [vendors, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "sales") return (a.sales - b.sales) * dir;
      if (sortKey === "earned") return (a.earned - b.earned) * dir;
      return a.vendor.localeCompare(b.vendor) * dir;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const totalEarned = useMemo(() => filtered.reduce((n, v) => n + v.earned, 0), [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
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
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["vendor", "store", "sales", "rate", "earned", "pending", "paid", "status"].join(","),
      ...filtered.map((v) => [v.vendor, v.store, v.sales, rateLabel(v.rateType, v.rate, v.fixed), v.earned, v.pending, v.paid, v.status].map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  const openEdit = (v: VendorCommission) => {
    setFormType(v.rateType);
    setFormRate(v.rate);
    setFormFixed(v.fixed);
    setEditId(v.id);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    patchVendor(editId, { rateType: formType, rate: formRate, fixed: formFixed });
    setEditId(null);
    toast.success(t("toastUpdated"));
  };

  const viewed = viewId ? (vendors.find((v) => v.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("vTitle")}
        subtitle={t("vSubtitle", { count: filtered.length })}
        highlightLabel={t("tEarned")}
        highlightValue={money(totalEarned)}
        highlightIcon={Wallet}
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
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("vendor")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tVendor")} {sortIcon("vendor")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("sales")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tSales")} {sortIcon("sales")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tRate")}</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("earned")} className="inline-flex items-center gap-1.5 font-semibold hover:text-white/80">
                      {t("tEarned")} {sortIcon("earned")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">{t("tPending")}</TableHead>
                  <TableHead className="text-right">{t("tEarning")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{v.vendor}</p>
                      <p className="text-xs text-muted-foreground">{v.store}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(v.sales)}</TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {rateLabel(v.rateType, v.rate, v.fixed)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(v.earned)}
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap text-[#8a5a00]">
                      {money(v.pending)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
                      {money(v.sales - v.earned)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", v.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(v.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(v.id)} aria-label={`${t("viewTitle")} ${v.vendor}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)} aria-label={`${t("editCom")} ${v.vendor}`} title={t("editCom")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Link href="/dashboard/commission/history">
                          <Button variant="ghost" size="icon-sm" aria-label={`${t("vHistory")} ${v.vendor}`} title={t("vHistory")}>
                            <History className="size-4 text-secondary" aria-hidden="true" />
                          </Button>
                        </Link>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {viewed.vendor} · {viewed.store}
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={t("vInfo")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">{t("tVendor")}</span>
                  <span className="text-right font-semibold">{viewed.vendor}</span>
                  <span className="text-muted-foreground">{t("tStore")}</span>
                  <span className="text-right font-semibold">{viewed.store}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-right font-medium break-all">{viewed.email}</span>
                  <span className="text-muted-foreground">{t("tSales")}</span>
                  <span className="text-right font-bold">{money(viewed.sales)}</span>
                  <span className="text-muted-foreground">{t("tEarned")}</span>
                  <span className="text-right font-bold text-secondary">{money(viewed.earned)}</span>
                  <span className="text-muted-foreground">{t("tEarning")}</span>
                  <span className="text-right font-bold text-green-600">{money(viewed.sales - viewed.earned)}</span>
                </div>
              </SectionCard>
              <SectionCard title={t("vConfig")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">{t("gType")}</span>
                  <span className="text-right font-semibold">{t(`opt${viewed.rateType[0].toUpperCase()}${viewed.rateType.slice(1)}` as "optPercentage")}</span>
                  <span className="text-muted-foreground">{t("tRate")}</span>
                  <span className="text-right font-bold text-secondary">{rateLabel(viewed.rateType, viewed.rate, viewed.fixed)}</span>
                  <span className="text-muted-foreground">{t("tStatus")}</span>
                  <span className="text-right">
                    <Badge className={cn("font-semibold", viewed.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                      {t(viewed.status)}
                    </Badge>
                  </span>
                </div>
              </SectionCard>
              <SectionCard title={t("vRule")}>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITY_ORDER.map((p) => {
                    const isActive = p.scope === viewed.activeRule;
                    return (
                      <div
                        key={p.scope}
                        className={cn(
                          "flex flex-col items-center gap-1 border px-2 py-3 text-center",
                          isActive ? "border-secondary bg-secondary/10" : "border-border bg-card"
                        )}
                      >
                        <span className={cn("font-heading text-lg font-bold", isActive ? "text-secondary" : "text-muted-foreground")}>
                          {p.level}
                        </span>
                        <span className={cn("text-[11px] font-semibold", isActive ? "text-secondary" : "text-muted-foreground")}>
                          {t(`scope${p.scope[0].toUpperCase()}${p.scope.slice(1)}` as "scopeGlobal")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="pt-1 text-center text-xs font-semibold text-secondary">
                  {t("appliedRule")}: {t(`scope${viewed.activeRule[0].toUpperCase()}${viewed.activeRule.slice(1)}` as "scopeGlobal")}
                </p>
              </SectionCard>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setViewId(null);
                    openEdit(viewed);
                  }}
                >
                  {t("editCom")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("editCom")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("gType")}>
              <Select value={formType} onValueChange={(v) => setFormType(v as CommissionType)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t("optPercentage")}</SelectItem>
                  <SelectItem value="fixed">{t("optFixed")}</SelectItem>
                  <SelectItem value="mixed">{t("optMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("gRate")}>
              <Input
                type="number"
                min={0}
                value={formRate}
                onChange={(e) => setFormRate(Math.max(0, Number(e.target.value) || 0))}
                className="bg-card"
                disabled={formType === "fixed"}
              />
            </Field>
            <Field label={t("gFixed")}>
              <Input
                type="number"
                min={0}
                value={formFixed}
                onChange={(e) => setFormFixed(Math.max(0, Number(e.target.value) || 0))}
                className="bg-card"
                disabled={formType === "percentage"}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSaveEdit}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
