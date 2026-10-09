"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
import { SlidersHorizontal } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { MarketingStatusBadge } from "@/components/admin/marketing/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { DiscountRule, RuleCondition } from "@/features/admin/marketing";
import { useMarketingStore, useMktRules } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FIELDS = ["condProduct", "condCategory", "condBrand", "condVendor", "condQty", "condSubtotal", "condGroup", "condFirst", "condReturning", "condDate", "condTime"] as const;
const OPERATORS = ["is", "is not", "is greater than", "is less than", "is at least", "contains"];
const TYPES = ["Percentage", "Fixed Amount", "Buy X Get Y", "Buy One Get One", "Tiered Discount", "Quantity Discount", "Free Shipping"];

export default function DiscountRulesPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const rules = useMktRules();
  const store = useMarketingStore();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [builderFor, setBuilderFor] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState(TYPES[0]);
  const [fDiscount, setFDiscount] = useState("10%");
  const [fProducts, setFProducts] = useState(0);
  const [fCustomers, setFCustomers] = useState("All");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-10-26");
  const [fPriority, setFPriority] = useState(5);
  const [conditions, setConditions] = useState<RuleCondition[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => r.name.toLowerCase().includes(q));
  }, [rules, query]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => a.priority - b.priority), [filtered]);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFType(TYPES[0]); setFDiscount("10%");
    setFProducts(0); setFCustomers("All");
    setFStart("2026-09-26"); setFEnd("2026-10-26"); setFPriority(5);
    setConditions([{ id: "c-new", field: "condSubtotal", operator: "is greater than", value: "৳2000", join: "AND" }]);
    setDialogOpen(true);
  };

  const openEdit = (r: DiscountRule) => {
    setEditId(r.id);
    setFName(r.name); setFType(r.type); setFDiscount(r.discount);
    setFProducts(r.products); setFCustomers(r.customers);
    setFStart(r.start); setFEnd(r.end); setFPriority(r.priority);
    setConditions(r.conditions.map((c) => ({ ...c })));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchRule(editId, {
        name: fName.trim(), type: fType, discount: fDiscount,
        products: fProducts, customers: fCustomers,
        start: fStart, end: fEnd, priority: fPriority, conditions,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addRule({
        id: `dr-${Date.now()}`,
        name: fName.trim(), type: fType, discount: fDiscount,
        products: fProducts, customers: fCustomers,
        start: fStart, end: fEnd, priority: fPriority, status: "draft", conditions,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
    setBuilderFor(null);
  };

  const addCondition = () =>
    setConditions((p) => [...p, { id: `c-${p.length}-${conditions.length}`, field: "condSubtotal", operator: "is greater than", value: "৳2000", join: "AND" }]);

  const patchCondition = (id: string, patch: Partial<RuleCondition>) =>
    setConditions((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const movePriority = (r: DiscountRule, dir: -1 | 1) => {
    const next = Math.max(1, r.priority + dir);
    store.patchRule(r.id, { priority: next });
  };

  const builderRule = builderFor ? (rules.find((r) => r.id === builderFor) ?? null) : null;
  const fieldLabel = (f: string) => (f.startsWith("cond") ? t(f as "condProduct") : f);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("rTitle")}
        subtitle={t("rSubtitle", { count: rules.length })}
        highlightLabel={t("tPriority")}
        highlightValue={String(rules.filter((r) => r.status === "active").length)}
        highlightIcon={SlidersHorizontal}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addRule")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {sorted.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tRule")}</TableHead>
                  <TableHead>{t("tConditions")}</TableHead>
                  <TableHead>{t("tDiscount")}</TableHead>
                  <TableHead className="text-right">{t("tPriority")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.type} · {r.start} → {r.end}</p>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <button type="button" onClick={() => setBuilderFor(builderFor === r.id ? null : r.id)} className="text-left text-xs text-secondary hover:underline">
                        {r.conditions.length} conditions — {builderFor === r.id ? t("removeCondition") : t("ruleBuilder")}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">{r.discount}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => movePriority(r, -1)} aria-label="up" className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowUp className="size-3" aria-hidden="true" />
                        </button>
                        <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                          {r.priority}
                        </span>
                        <button type="button" onClick={() => movePriority(r, 1)} aria-label="down" className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowDown className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    </TableCell>
                    <TableCell>
                      <MarketingStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchRule(r.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={r.name} title={t("pause")}>
                            <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchRule(r.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={r.name} title={t("activate")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeRules([r.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={r.name}>
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
              <EmptyState icon={SlidersHorizontal} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>

      {builderRule ? (
        <SectionCard
          title={`${t("ruleBuilder")} · ${builderRule.name}`}
          action={
            <Button variant="outline" size="sm" className="h-8 bg-card" onClick={() => setBuilderFor(null)}>
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          }
        >
          <div className="flex items-center gap-2">
            <span className="bg-[#1a0d00] px-3 py-1 text-xs font-bold tracking-widest text-white uppercase">IF</span>
          </div>
          {builderRule.conditions.map((c, i) => (
            <div key={c.id}>
              {i > 0 ? (
                <div className="flex items-center gap-2 py-1">
                  <span className="bg-secondary px-3 py-0.5 text-xs font-bold text-white">{c.join}</span>
                </div>
              ) : null}
              <div className="grid gap-2 border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <span className="flex items-center px-2 py-1.5 text-sm font-medium">{fieldLabel(c.field)}</span>
                <span className="flex items-center px-2 py-1.5 text-sm text-muted-foreground">{c.operator}</span>
                <span className="flex items-center px-2 py-1.5 font-heading text-sm font-bold text-secondary">{c.value}</span>
                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => {
                  store.patchRule(builderRule.id, { conditions: builderRule.conditions.filter((x) => x.id !== c.id) });
                }} aria-label={c.id}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="bg-secondary px-3 py-1 text-xs font-bold tracking-widest text-white uppercase">{t("thenApply")}</span>
            <span className="font-heading text-lg font-bold text-secondary">{builderRule.discount}</span>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="bg-card" onClick={() => openEdit(builderRule)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              {t("editTitle")}
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addRule")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tRule")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Big Cart 15% Off" />
            </Field>
            <Field label={t("tType")}>
              <Select value={fType} onValueChange={(v) => setFType(v ?? TYPES[0])}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>{ty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label={t("tDiscount")}>
              <Input value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className="bg-card" placeholder="15%" />
            </Field>
            <Field label={t("tProducts")}>
              <Input type="number" min={0} value={fProducts} onChange={(e) => setFProducts(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("tCustomers")}>
              <Input value={fCustomers} onChange={(e) => setFCustomers(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tPriority")}>
              <Input type="number" min={1} value={fPriority} onChange={(e) => setFPriority(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tStart")}>
              <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tExpiry")}>
              <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <div className="flex flex-col gap-3 border border-dashed border-secondary/40 bg-secondary/5 p-3">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{t("ruleBuilder")}</p>
            {conditions.map((c, i) => (
              <div key={c.id} className="flex flex-col gap-2">
                {i > 0 ? (
                  <div className="flex gap-1">
                    {(["AND", "OR"] as const).map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => patchCondition(c.id, { join: j })}
                        className={cn("px-2 py-0.5 text-[11px] font-bold", c.join === j ? "bg-secondary text-white" : "bg-muted text-muted-foreground")}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Select value={c.field} onValueChange={(v) => patchCondition(c.id, { field: v ?? c.field })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((f) => (
                        <SelectItem key={f} value={f}>{t(f)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={c.operator} onValueChange={(v) => patchCondition(c.id, { operator: v ?? c.operator })}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={c.value} onChange={(e) => patchCondition(c.id, { value: e.target.value })} className="bg-card" placeholder="৳2000" />
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setConditions((p) => p.filter((x) => x.id !== c.id))} aria-label={c.id}>
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit bg-card" onClick={addCondition}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("addCondition")}
            </Button>
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
