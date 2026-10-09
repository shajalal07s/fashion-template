"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Copy,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ListChecks, PackageSearch } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import {
  PRIORITY_ORDER,
  rateLabel,
  type CommissionRule,
  type CommissionType,
  type RuleScope,
} from "@/features/admin/commission";
import { useCommissionRules, useCommissionStore } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SCOPES: RuleScope[] = ["global", "vendor", "category", "product"];

export default function CommissionRulesPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const rules = useCommissionRules();
  const addRule = useCommissionStore((s) => s.addRule);
  const patchRule = useCommissionStore((s) => s.patchRule);
  const removeRules = useCommissionStore((s) => s.removeRules);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"delete" | "toggle" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formScope, setFormScope] = useState<RuleScope>("vendor");
  const [formType, setFormType] = useState<CommissionType>("percentage");
  const [formRate, setFormRate] = useState(10);
  const [formFixed, setFormFixed] = useState(0);
  const [formPriority, setFormPriority] = useState(2);
  const [formStart, setFormStart] = useState("2026-01-01");
  const [formEnd, setFormEnd] = useState("2026-12-31");

  const sorted = useMemo(() => [...rules].sort((a, b) => a.priority - b.priority), [rules]);

  const openAdd = () => {
    setEditId(null);
    setFormName("");
    setFormScope("vendor");
    setFormType("percentage");
    setFormRate(10);
    setFormFixed(0);
    setFormPriority(2);
    setFormStart("2026-01-01");
    setFormEnd("2026-12-31");
    setDialogOpen(true);
  };

  const openEdit = (r: CommissionRule) => {
    setEditId(r.id);
    setFormName(r.name);
    setFormScope(r.scope);
    setFormType(r.type);
    setFormRate(r.rate);
    setFormFixed(r.fixed);
    setFormPriority(r.priority);
    setFormStart(r.start);
    setFormEnd(r.end);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editId) {
      patchRule(editId, {
        name: formName.trim(),
        scope: formScope,
        type: formType,
        rate: formRate,
        fixed: formFixed,
        priority: formPriority,
        start: formStart,
        end: formEnd,
      });
      toast.success(t("toastUpdated"));
    } else {
      addRule({
        id: `r-${Date.now()}`,
        name: formName.trim(),
        scope: formScope,
        type: formType,
        rate: formRate,
        fixed: formFixed,
        priority: formPriority,
        start: formStart,
        end: formEnd,
        status: "active",
      });
      toast.success(t("toastSaved"));
    }
    setDialogOpen(false);
  };

  const askConfirm = (id: string, action: "delete" | "toggle") => {
    setConfirmId(id);
    setConfirmAction(action);
  };

  const handleConfirm = () => {
    if (!confirmId || !confirmAction) return;
    if (confirmAction === "delete") {
      removeRules([confirmId]);
      toast.success(t("toastDeleted", { count: 1 }));
    } else {
      const r = rules.find((x) => x.id === confirmId);
      if (r) {
        const next = r.status === "active" ? "inactive" : "active";
        patchRule(confirmId, { status: next });
        toast.success(t(next === "active" ? "toastEnabled" : "toastDisabled"));
      }
    }
    setConfirmId(null);
    setConfirmAction(null);
  };

  const handleDuplicate = (r: CommissionRule) => {
    addRule({ ...r, id: `r-${Date.now()}`, name: `${r.name} (Copy)`, status: "inactive" });
    toast.success(t("toastDuplicated"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("ruTitle")}
        subtitle={t("ruSubtitle", { count: rules.length })}
        highlightLabel={t("appliedRule")}
        highlightValue={String(rules.filter((r) => r.status === "active").length)}
        highlightIcon={ListChecks}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addRule")}
        </button>
      </AccountingHero>

      <SectionCard title={t("priorityTitle")} icon={null} action={null}>
        <p className="-mt-2 text-xs text-muted-foreground">{t("prioritySub")}</p>
        <div className="flex flex-col items-stretch gap-0">
          {PRIORITY_ORDER.map((p, i) => (
            <div key={p.scope} className="flex flex-col items-center">
              <div className="flex w-full items-center gap-3 border border-border bg-card px-4 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary font-heading text-sm font-bold text-white">
                  {p.level}
                </span>
                <span className="text-sm font-bold">
                  {p.level}. {t(`scope${p.scope[0].toUpperCase()}${p.scope.slice(1)}` as "scopeGlobal")} {t("title").split(" ")[0]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("priorityLabel")}: {p.level}
                </span>
              </div>
              {i < PRIORITY_ORDER.length - 1 ? (
                <ArrowDown className="size-4 shrink-0 text-secondary" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("ruTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {sorted.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tRule")}</TableHead>
                  <TableHead>{t("tScope")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tRate")}</TableHead>
                  <TableHead className="text-right">{t("tPriority")}</TableHead>
                  <TableHead>{t("tStart")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{r.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">
                        {t(`scope${r.scope[0].toUpperCase()}${r.scope.slice(1)}` as "scopeGlobal")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`opt${r.type[0].toUpperCase()}${r.type.slice(1)}` as "optPercentage")}
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {rateLabel(r.type, r.rate, r.fixed)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {r.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {r.start} → {r.end}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", r.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(r)} aria-label={r.name} title={t("toastDuplicated")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => askConfirm(r.id, "toggle")}
                          aria-label={r.name}
                          title={r.status}
                        >
                          <Power className={cn("size-4", r.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => askConfirm(r.id, "delete")}
                          aria-label={r.name}
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addRule")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("tRule")}>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-card" placeholder="Vendor Special 8%" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tScope")}>
                <Select value={formScope} onValueChange={(v) => setFormScope(v as RuleScope)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`scope${s[0].toUpperCase()}${s.slice(1)}` as "scopeGlobal")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
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
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("gRate")}>
                <Input type="number" min={0} value={formRate} onChange={(e) => setFormRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "fixed"} />
              </Field>
              <Field label={t("gFixed")}>
                <Input type="number" min={0} value={formFixed} onChange={(e) => setFormFixed(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "percentage"} />
              </Field>
              <Field label={t("tPriority")}>
                <Input type="number" min={1} max={4} value={formPriority} onChange={(e) => setFormPriority(Math.max(1, Number(e.target.value) || 4))} className="bg-card" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tStart")}>
                <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tEnd")}>
                <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" variant="destructive" onClick={handleConfirm}>{t("confirmBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
