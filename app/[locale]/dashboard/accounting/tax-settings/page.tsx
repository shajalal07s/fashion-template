"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Percent, Plus, Power, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
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
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TaxRate } from "@/features/admin/accounting";
import { useAccountingStore, useTaxRates } from "@/store/accounting.store";

export default function AccountingTaxSettingsPage() {
  const t = useTranslations("Dashboard.accounting");
  const ts = useTranslations("Dashboard.sidebar");
  const taxes = useTaxRates();
  const addTax = useAccountingStore((s) => s.addTax);
  const patchTax = useAccountingStore((s) => s.patchTax);
  const removeTaxes = useAccountingStore((s) => s.removeTaxes);

  const [defaultVat, setDefaultVat] = useState("15");
  const [tin, setTin] = useState("123456789012");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [formName, setFormName] = useState("");
  const [formRate, setFormRate] = useState(0);
  const [formApplied, setFormApplied] = useState("");

  const openAdd = () => {
    setEditId(null);
    setFormName("");
    setFormRate(0);
    setFormApplied("");
    setDialogOpen(true);
  };

  const openEdit = (tax: TaxRate) => {
    setEditId(tax.id);
    setFormName(tax.name);
    setFormRate(tax.rate);
    setFormApplied(tax.appliedTo);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editId) {
      patchTax(editId, { name: formName.trim(), rate: Math.max(0, formRate), appliedTo: formApplied.trim() });
    } else {
      addTax({
        id: `t-${Date.now()}`,
        name: formName.trim(),
        rate: Math.max(0, formRate),
        appliedTo: formApplied.trim(),
        status: "active",
      });
    }
    setDialogOpen(false);
    toast.success(t("toastSaved"));
  };

  const activeCount = taxes.filter((x) => x.status === "active").length;

  const pageCount = Math.max(1, Math.ceil(taxes.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => taxes.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [taxes, safePage, pageSize]
  );
  const activeSelected = useMemo(
    () => [...selected].filter((id) => taxes.some((x) => x.id === id)),
    [selected, taxes]
  );
  const viewed = viewId ? (taxes.find((x) => x.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("accounting")}
        title={t("taxTitle")}
        subtitle={t("taxSubtitle")}
        highlightLabel={t("defaultVat")}
        highlightValue={`${defaultVat}%`}
        highlightIcon={Percent}
      >
        <span className={heroPillClassName}>
          {activeCount} / {taxes.length} {t("active")}
        </span>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addTax")}
        </button>
      </AccountingHero>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("taxIdLabel")}>
          <Field label={t("defaultVat")}>
            <Select value={defaultVat} onValueChange={(v) => setDefaultVat(v ?? "")}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["0", "5", "7.5", "10", "15"].map((r) => (
                  <SelectItem key={r} value={r}>{r}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("companyTin")}>
            <Input value={tin} onChange={(e) => setTin(e.target.value)} className="bg-card font-mono" />
          </Field>
          <Button size="sm" className="w-fit" onClick={() => toast.success(t("toastSaved"))}>
            {t("saveBtn")}
          </Button>
        </SectionCard>

        <Card className="overflow-hidden border-border bg-card py-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <Percent className="size-4 text-secondary" aria-hidden="true" />
              {t("taxReportTitle")}
            </CardTitle>
          </CardHeader>
          {activeSelected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/5 px-4 py-3">
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
                    removeTaxes(activeSelected);
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
                      checked={visible.length > 0 && visible.every((x) => selected.has(x.id))}
                      indeterminate={visible.some((x) => selected.has(x.id)) && !visible.every((x) => selected.has(x.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const x of visible) {
                            if (v === true) next.add(x.id);
                            else next.delete(x.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("taxReportTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tableName")}</TableHead>
                  <TableHead className="text-right">{t("tableRate")}</TableHead>
                  <TableHead>{t("tableApplied")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((tax) => (
                  <TableRow key={tax.id} className={cn(selected.has(tax.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(tax.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(tax.id);
                            else next.delete(tax.id);
                            return next;
                          })
                        }
                        aria-label={tax.name}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{tax.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-secondary">
                      {tax.rate}%
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={tax.appliedTo}>
                      {tax.appliedTo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-semibold",
                          tax.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t(tax.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(tax.id)} aria-label={`${t("viewTitle")} ${tax.name}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(tax)} aria-label={`${t("editTitle")} ${tax.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => patchTax(tax.id, { status: tax.status === "active" ? "inactive" : "active" })}
                          aria-label={tax.name}
                          title={tax.name}
                        >
                          <Power className={cn("size-4", tax.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            removeTaxes([tax.id]);
                            toast.success(t("toastDeleted", { count: 1 }));
                          }}
                          aria-label={tax.name}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addTax")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tableName")}>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-card" placeholder="VAT" />
              </Field>
              <Field label={t("tableRate")}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formRate}
                  onChange={(e) => setFormRate(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-card"
                />
              </Field>
            </div>
            <Field label={t("tableApplied")}>
              <Input value={formApplied} onChange={(e) => setFormApplied(e.target.value)} className="bg-card" placeholder="All taxable sales" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-sm">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <Percent className="size-4 text-secondary" aria-hidden="true" />
                  {t("viewTitle")} · {viewed.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center border border-dashed border-secondary/40 bg-secondary/5 px-4 py-6">
                <span className="font-heading text-4xl font-bold text-secondary">{viewed.rate}%</span>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableName")}</span>
                  <span className="font-semibold">{viewed.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableApplied")}</span>
                  <span className="font-medium">{viewed.appliedTo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("tableStatus")}</span>
                  <Badge
                    className={cn(
                      "font-semibold",
                      viewed.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t(viewed.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>
                  {t("cancelBtn")}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setViewId(null);
                    openEdit(viewed);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {t("editTitle")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
