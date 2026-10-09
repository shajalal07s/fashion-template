"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Power,
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
import { PackageSearch, Tags } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { rateLabel, type CategoryCommission, type CommissionType } from "@/features/admin/commission";
import { useCommissionCategories, useCommissionStore } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CategoryCommissionPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const categories = useCommissionCategories();
  const addCategory = useCommissionStore((s) => s.addCategory);
  const patchCategory = useCommissionStore((s) => s.patchCategory);
  const removeCategories = useCommissionStore((s) => s.removeCategories);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCat, setFormCat] = useState("");
  const [formParent, setFormParent] = useState("—");
  const [formType, setFormType] = useState<CommissionType>("percentage");
  const [formRate, setFormRate] = useState(10);
  const [formFixed, setFormFixed] = useState(0);
  const [formPriority, setFormPriority] = useState(3);
  const [formStart, setFormStart] = useState("2026-01-01");
  const [formEnd, setFormEnd] = useState("2026-12-31");
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.category.toLowerCase().includes(q));
  }, [categories, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => categories.some((c) => c.id === id)),
    [selected, categories]
  );

  const openAdd = () => {
    setEditId(null);
    setFormCat("");
    setFormParent("—");
    setFormType("percentage");
    setFormRate(10);
    setFormFixed(0);
    setFormPriority(3);
    setFormStart("2026-01-01");
    setFormEnd("2026-12-31");
    setFormNotes("");
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryCommission) => {
    setEditId(c.id);
    setFormCat(c.category);
    setFormParent(c.parent);
    setFormType(c.type);
    setFormRate(c.rate);
    setFormFixed(c.fixed);
    setFormPriority(c.priority);
    setFormStart(c.effective);
    setFormEnd(c.effective);
    setFormNotes("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formCat.trim()) return;
    if (editId) {
      patchCategory(editId, {
        category: formCat.trim(),
        parent: formParent.trim() || "—",
        type: formType,
        rate: formRate,
        fixed: formFixed,
        priority: formPriority,
        effective: formStart,
      });
      toast.success(t("toastUpdated"));
    } else {
      addCategory({
        id: `c-${Date.now()}`,
        category: formCat.trim(),
        parent: formParent.trim() || "—",
        products: 0,
        vendors: 0,
        type: formType,
        rate: formRate,
        fixed: formFixed,
        priority: formPriority,
        status: "active",
        effective: formStart,
      });
      toast.success(t("toastSaved"));
    }
    setDialogOpen(false);
  };

  const handleExport = () => {
    const list = activeSelected.length > 0 ? categories.filter((c) => selected.has(c.id)) : filtered;
    if (list.length === 0) return;
    const lines = [
      ["category", "rate", "priority", "status"].join(","),
      ...list.map((c) => [c.category, rateLabel(c.type, c.rate, c.fixed), c.priority, c.status].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("cTitle")}
        subtitle={t("cSubtitle", { count: filtered.length })}
        highlightLabel={t("tCategory")}
        highlightValue={String(categories.filter((c) => c.status === "active").length)}
        highlightIcon={Tags}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addCategory")}
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
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{activeSelected.length}</p>
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={() => {
                  removeCategories(activeSelected);
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
                      checked={visible.length > 0 && visible.every((c) => selected.has(c.id))}
                      indeterminate={visible.some((c) => selected.has(c.id)) && !visible.every((c) => selected.has(c.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const c of visible) {
                            if (v === true) next.add(c.id);
                            else next.delete(c.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("cTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tCategory")}</TableHead>
                  <TableHead>{t("tParent")}</TableHead>
                  <TableHead className="text-right">{t("tProducts")}</TableHead>
                  <TableHead className="text-right">{t("tVendors")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tRate")}</TableHead>
                  <TableHead className="text-right">{t("tPriority")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className={cn(selected.has(c.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(c.id);
                            else next.delete(c.id);
                            return next;
                          })
                        }
                        aria-label={c.category}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{c.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.parent}</TableCell>
                    <TableCell className="text-right text-sm">{c.products}</TableCell>
                    <TableCell className="text-right text-sm">{c.vendors}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`opt${c.type[0].toUpperCase()}${c.type.slice(1)}` as "optPercentage")}
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {rateLabel(c.type, c.rate, c.fixed)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {c.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", c.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(c.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`${t("editTitle")} ${c.category}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => patchCategory(c.id, { status: c.status === "active" ? "inactive" : "active" })}
                          aria-label={c.category}
                        >
                          <Power className={cn("size-4", c.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tCategory")}>
                <Input value={formCat} onChange={(e) => setFormCat(e.target.value)} className="bg-card" placeholder="Saree" />
              </Field>
              <Field label={t("tParent")}>
                <Input value={formParent} onChange={(e) => setFormParent(e.target.value)} className="bg-card" placeholder="Women" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("tType")}>
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
                <Input type="number" min={0} value={formRate} onChange={(e) => setFormRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "fixed"} />
              </Field>
              <Field label={t("gFixed")}>
                <Input type="number" min={0} value={formFixed} onChange={(e) => setFormFixed(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "percentage"} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("tPriority")}>
                <Input type="number" min={1} max={4} value={formPriority} onChange={(e) => setFormPriority(Math.max(1, Number(e.target.value) || 3))} className="bg-card" />
              </Field>
              <Field label={t("gStart")}>
                <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("gEnd")}>
                <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
            <Field label={t("cNotes")}>
              <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="bg-card" />
            </Field>
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
