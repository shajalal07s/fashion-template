"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  X,
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { useCommissionAdjustments, useCommissionStore, useCommissionTxs } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CommissionAdjustmentsPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const adjustments = useCommissionAdjustments();
  const txs = useCommissionTxs();
  const addAdjustment = useCommissionStore((s) => s.addAdjustment);
  const patchAdjustment = useCommissionStore((s) => s.patchAdjustment);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTx, setFormTx] = useState("");
  const [formKind, setFormKind] = useState<"increase" | "decrease">("increase");
  const [formAmount, setFormAmount] = useState(0);
  const [formReason, setFormReason] = useState("");
  const [formNote, setFormNote] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adjustments;
    return adjustments.filter(
      (a) => a.id.toLowerCase().includes(q) || a.txId.toLowerCase().includes(q) || a.vendor.toLowerCase().includes(q)
    );
  }, [adjustments, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const selectedTx = txs.find((x) => x.id === formTx) ?? null;
  const liveFinal = selectedTx
    ? selectedTx.commission + (formKind === "increase" ? formAmount : -formAmount)
    : 0;

  const openAdd = () => {
    setFormTx(txs[0]?.id ?? "");
    setFormKind("increase");
    setFormAmount(0);
    setFormReason("");
    setFormNote("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTx || formAmount <= 0 || !formReason.trim()) return;
    const delta = formKind === "increase" ? formAmount : -formAmount;
    addAdjustment({
      id: `ADJ-${300 + adjustments.length + 1}`,
      txId: selectedTx.id,
      vendor: selectedTx.vendor,
      original: selectedTx.commission,
      delta,
      final: selectedTx.commission + delta,
      reason: formReason.trim(),
      by: "Admin",
      date: "2026-09-24",
      status: "pending",
    });
    setDialogOpen(false);
    toast.success(t("toastSaved"));
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["adjustment", "tx", "vendor", "original", "delta", "final", "status"].join(","),
      ...filtered.map((a) => [a.id, a.txId, a.vendor, a.original, a.delta, a.final, a.status].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commission-adjustments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("aTitle")}
        subtitle={t("aSubtitle", { count: filtered.length })}
        highlightLabel={t("tDelta")}
        highlightValue={money(filtered.reduce((n, a) => n + a.delta, 0))}
        highlightIcon={SlidersHorizontal}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addAdjust")}
        </button>
      </AccountingHero>

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

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tAdj")}</TableHead>
                  <TableHead>{t("tTx")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead className="text-right">{t("tOriginal")}</TableHead>
                  <TableHead className="text-right">{t("tDelta")}</TableHead>
                  <TableHead className="text-right">{t("tFinal")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{a.id}</p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{a.date}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{a.txId}</TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{a.vendor}</p>
                      <p className="max-w-40 truncate text-xs text-muted-foreground" title={a.reason}>{a.reason}</p>
                    </TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(a.original)}</TableCell>
                    <TableCell className={cn("text-right text-sm font-bold whitespace-nowrap", a.delta >= 0 ? "text-green-600" : "text-destructive")}>
                      {a.delta > 0 ? "+" : ""}{money(a.delta)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(a.final)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", a.status === "approved" ? "bg-green-600/10 text-green-700" : a.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-primary/20 text-[#8a5a00]")}>
                        {t(a.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.status === "pending" ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patchAdjustment(a.id, { status: "approved" });
                              toast.success(t("toastApproved"));
                            }}
                            aria-label={`${t("approved")} ${a.id}`}
                            title={t("approved")}
                          >
                            <Check className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              patchAdjustment(a.id, { status: "rejected" });
                              toast.success(t("toastUpdated"));
                            }}
                            aria-label={`${t("rejected")} ${a.id}`}
                            title={t("rejected")}
                          >
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : null}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("addAdjust")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tTx")}>
                <Select value={formTx} onValueChange={(v) => setFormTx(v ?? "")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {txs.map((x) => (
                      <SelectItem key={x.id} value={x.id}>{x.id} · {money(x.commission)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("adjType")}>
                <Select value={formKind} onValueChange={(v) => setFormKind((v as "increase" | "decrease") ?? "increase")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">{t("optIncrease")}</SelectItem>
                    <SelectItem value="decrease">{t("optDecrease")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tDelta")}>
                <Input
                  type="number"
                  min={0}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                />
              </Field>
              <Field label={t("tReason")}>
                <Input value={formReason} onChange={(e) => setFormReason(e.target.value)} className="bg-card" placeholder="Bonus correction" />
              </Field>
            </div>
            <Field label={t("adminNote")}>
              <Input value={formNote} onChange={(e) => setFormNote(e.target.value)} className="bg-card" />
            </Field>
            {selectedTx ? (
              <div className="flex flex-col items-stretch border border-dashed border-secondary/40 bg-secondary/5 p-3">
                {[`${t("tOriginal")}: ${money(selectedTx.commission)}`, `${formKind === "increase" ? "+" : "-"}${money(formAmount)}`, `${t("tFinal")}: ${money(liveFinal)}`].map((s, i, arr) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className={i === arr.length - 1 ? "w-full py-1 text-center text-sm font-bold text-secondary" : "w-full py-1 text-center text-sm"}>
                      {s}
                    </span>
                    {i < arr.length - 1 ? <ArrowDown className="size-3.5 text-secondary" aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
