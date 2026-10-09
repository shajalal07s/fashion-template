"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  Tag,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { ReturnReason } from "@/features/admin/returns";
import { useReturnReasons, useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReturnReasonsPage() {
  const t = useTranslations("Dashboard.returns");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const reasons = useReturnReasons();
  const store = useReturnsStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fPriority, setFPriority] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reasons;
    return reasons.filter((r) => r.name.toLowerCase().includes(q));
  }, [reasons, query]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => a.priority - b.priority), [filtered]);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFDesc(""); setFCategory("");
    setFPriority(reasons.length + 1);
    setDialogOpen(true);
  };

  const openEdit = (r: ReturnReason) => {
    setEditId(r.id);
    setFName(r.name); setFDesc(r.description); setFCategory(r.category);
    setFPriority(r.priority);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchReason(editId, { name: fName.trim(), description: fDesc.trim(), category: fCategory.trim(), priority: fPriority });
      toast.success(t("toastUpdated"));
    } else {
      store.addReason({
        id: `rr-${reasons.length + 1}`,
        name: fName.trim(), description: fDesc.trim(), category: fCategory.trim() || "Other",
        usage: 0, rate: 0, amount: 0, status: "active", priority: fPriority,
      });
      toast.success(t("toastSaved"));
    }
    setDialogOpen(false);
  };

  const move = (r: ReturnReason, dir: -1 | 1) => {
    const ordered = [...reasons].sort((a, b) => a.priority - b.priority);
    const idx = ordered.findIndex((x) => x.id === r.id);
    const swapWith = ordered[idx + dir];
    if (!swapWith) return;
    store.patchReason(r.id, { priority: swapWith.priority });
    store.patchReason(swapWith.id, { priority: r.priority });
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("returns")}
        title={t("rrTitle")}
        subtitle={t("rrSubtitle", { count: filtered.length })}
        highlightLabel={t("tUsage")}
        highlightValue={num(reasons.reduce((n, r) => n + r.usage, 0))}
        highlightIcon={Tag}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addReason")}
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
                  <TableHead className="text-center">{t("tPriority")}</TableHead>
                  <TableHead>{t("tReason")}</TableHead>
                  <TableHead>{t("tCategory")}</TableHead>
                  <TableHead className="text-right">{t("tUsage")}</TableHead>
                  <TableHead className="text-right">{t("tRate")}</TableHead>
                  <TableHead className="text-right">{t("tAmount")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-32">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-0.5">
                        <button type="button" onClick={() => move(r, -1)} aria-label={r.name} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowUp className="size-3" aria-hidden="true" />
                        </button>
                        <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                          {r.priority}
                        </span>
                        <button type="button" onClick={() => move(r, 1)} aria-label={r.name} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                          <ArrowDown className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{r.name}</p>
                      <p className="max-w-52 truncate text-xs text-muted-foreground" title={r.description}>{r.description}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{r.category}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{num(r.usage)}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-secondary">{r.rate}%</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(r.amount)}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", r.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {r.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchReason(r.id, { status: "inactive" }); toast.success(t("toastUpdated")); }} aria-label={r.name} title={r.name}>
                            <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchReason(r.id, { status: "active" }); toast.success(t("toastUpdated")); }} aria-label={r.name} title={r.name}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(r.id)} aria-label={r.name}>
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
              <EmptyState icon={Tag} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addReason")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("fReasonName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Wrong Product" />
            </Field>
            <Field label={t("tDesc")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("tCategory")}>
                <Input value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("tPriority")}>
                <Input type="number" min={1} value={fPriority} onChange={(e) => setFPriority(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
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
            <Button size="sm" variant="destructive" onClick={() => {
              if (confirmId) store.removeReasons([confirmId]);
              setConfirmId(null);
              toast.success(t("toastDeleted", { count: 1 }));
            }}>
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
