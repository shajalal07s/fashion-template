"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  LayoutGrid,
  Pencil,
  Power,
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { HomepageSection } from "@/features/admin/cms";
import { useCmsSections, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HomepageManagementPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const sections = useCmsSections();
  const store = useCmsStore();

  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});

  const move = (s: HomepageSection, dir: -1 | 1) => {
    const ids = sections.map((x) => x.id);
    const idx = ids.indexOf(s.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    const next = [...ids];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    store.reorderSections(next);
  };

  const openEdit = (s: HomepageSection) => {
    setEditId(s.id);
    setForm({ ...s.config });
  };

  const handleSave = () => {
    if (!editId) return;
    store.patchSection(editId, { config: form, updated: "2026-09-26" });
    setEditId(null);
    toast.success(t("toastSaved"));
  };

  const handleDuplicate = (s: HomepageSection) => {
    const ids = sections.map((x) => x.id);
    store.reorderSections([...ids, s.id]);
    toast.success(t("duplicate"));
  };

  const set = (k: string, v: string | number | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const editing = editId ? (sections.find((s) => s.id === editId) ?? null) : null;
  const viewing = viewId ? (sections.find((s) => s.id === viewId) ?? null) : null;

  const renderPreview = (s: HomepageSection) => {
    const c = s.config;
    if (s.type === "hero" || s.type === "promo" || s.type === "cta") {
      return (
        <div className="flex flex-col items-center gap-2 bg-gradient-to-r from-[#1a0d00] via-[#b35400] to-secondary px-6 py-8 text-center text-white">
          <p className="font-heading text-2xl font-bold">{String(c.title ?? s.name)}</p>
          <p className="text-sm text-white/80">{String(c.subtitle ?? "")}</p>
          {c.cta ? (
            <span className="mt-1 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#1a0d00] uppercase">
              {String(c.cta)}
            </span>
          ) : null}
        </div>
      );
    }
    if (s.type === "newsletter") {
      return (
        <div className="flex flex-col items-center gap-2 border border-dashed border-secondary/40 bg-secondary/5 px-6 py-8 text-center">
          <p className="font-heading text-xl font-bold">{String(c.title ?? s.name)}</p>
          <p className="text-sm text-muted-foreground">{String(c.subtitle ?? "")}</p>
          <span className="bg-secondary px-4 py-1.5 text-xs font-bold text-white">Subscribe</span>
        </div>
      );
    }
    return (
      <div className="border border-border bg-card p-4">
        <p className="font-heading text-base font-bold">{String(c.title ?? s.name)}</p>
        <p className="text-xs text-muted-foreground">
          {s.type} · {String(c.layout ?? "grid")} · {String(c.count ?? 8)} items · {c.columns ? `${c.columns} cols` : ""}
        </p>
        <div className="grid grid-cols-4 gap-2 pt-3">
          {Array.from({ length: Math.min(4, Number(c.count ?? 4)) }).map((_, i) => (
            <span key={i} className="flex h-14 items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("hTitle")}
        subtitle={t("hSubtitle", { count: sections.length })}
        highlightLabel={t("active")}
        highlightValue={String(sections.filter((s) => s.enabled).length)}
        highlightIcon={LayoutGrid}
      />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="text-center">{t("tOrder")}</TableHead>
                <TableHead>{t("tSection")}</TableHead>
                <TableHead>{t("tType")}</TableHead>
                <TableHead>{t("tStatus")}</TableHead>
                <TableHead>{t("tUpdated")}</TableHead>
                <TableHead className="w-40">{t("colAction")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((s) => (
                <TableRow key={s.id} className={cn(!s.enabled && "opacity-60")}>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-0.5">
                      <button type="button" onClick={() => move(s, -1)} aria-label={`${t("moveUp")} ${s.name}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                        <ArrowUp className="size-3" aria-hidden="true" />
                      </button>
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {s.order}
                      </span>
                      <button type="button" onClick={() => move(s, 1)} aria-label={`${t("moveDown")} ${s.name}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                        <ArrowDown className="size-3" aria-hidden="true" />
                      </button>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-semibold whitespace-nowrap">{s.name}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{s.type}</TableCell>
                  <TableCell>
                    <Badge className={cn("font-semibold", s.enabled ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                      {t(s.enabled ? "active" : "inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{s.updated}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewId(s.id)} aria-label={`${t("preview")} ${s.name}`} title={t("preview")}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label={`${t("editSection")} ${s.name}`} title={t("editSection")}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(s)} aria-label={s.name} title={t("duplicate")}>
                        <Copy className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          store.patchSection(s.id, { enabled: !s.enabled });
                          toast.success(t("toastSaved"));
                        }}
                        aria-label={s.name}
                        title={s.name}
                      >
                        <Power className={cn("size-4", s.enabled ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("preview")} · {viewing.name}
                </DialogTitle>
              </DialogHeader>
              {renderPreview(viewing)}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { setViewId(null); openEdit(viewing); }}>{t("editSection")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("editSection")} · {editing.name}
                </DialogTitle>
              </DialogHeader>
              <SectionCard title={editing.name}>
                {(editing.type === "hero" || editing.type === "promo" || editing.type === "cta") && (
                  <>
                    <Field label={t("fSecTitle")}>
                      <Input value={String(form.title ?? "")} onChange={(e) => set("title", e.target.value)} className="bg-card" />
                    </Field>
                    <Field label={t("fSecSubtitle")}>
                      <Input value={String(form.subtitle ?? "")} onChange={(e) => set("subtitle", e.target.value)} className="bg-card" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t("fCta")}>
                        <Input value={String(form.cta ?? "")} onChange={(e) => set("cta", e.target.value)} className="bg-card" />
                      </Field>
                      <Field label={t("fCtaUrl")}>
                        <Input value={String(form.url ?? "")} onChange={(e) => set("url", e.target.value)} className="bg-card" />
                      </Field>
                    </div>
                    <Field label={t("fAlign")}>
                      <Input value={String(form.align ?? "")} onChange={(e) => set("align", e.target.value)} className="bg-card" placeholder="left / center" />
                    </Field>
                  </>
                )}
                {(editing.type === "products" || editing.type === "flash") && (
                  <>
                    <Field label={t("fSecTitle")}>
                      <Input value={String(form.title ?? "")} onChange={(e) => set("title", e.target.value)} className="bg-card" />
                    </Field>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label={t("fSource")}>
                        <Input value={String(form.source ?? "")} onChange={(e) => set("source", e.target.value)} className="bg-card" />
                      </Field>
                      <Field label={t("fCount")}>
                        <Input type="number" min={1} value={Number(form.count ?? 8)} onChange={(e) => set("count", Math.max(1, Number(e.target.value) || 8))} className="bg-card" />
                      </Field>
                      <Field label={t("fColumns")}>
                        <Input type="number" min={1} max={6} value={Number(form.columns ?? 4)} onChange={(e) => set("columns", Math.max(1, Number(e.target.value) || 4))} className="bg-card" />
                      </Field>
                    </div>
                    <Field label={t("fLayout")}>
                      <Input value={String(form.layout ?? "")} onChange={(e) => set("layout", e.target.value)} className="bg-card" placeholder="grid / carousel" />
                    </Field>
                  </>
                )}
                {(editing.type === "categories" || editing.type === "vendors" || editing.type === "brands") && (
                  <>
                    <Field label={t("fSecTitle")}>
                      <Input value={String(form.title ?? "")} onChange={(e) => set("title", e.target.value)} className="bg-card" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t("fCount")}>
                        <Input type="number" min={1} value={Number(form.count ?? 8)} onChange={(e) => set("count", Math.max(1, Number(e.target.value) || 8))} className="bg-card" />
                      </Field>
                      <Field label={t("fLayout")}>
                        <Input value={String(form.layout ?? "")} onChange={(e) => set("layout", e.target.value)} className="bg-card" />
                      </Field>
                    </div>
                  </>
                )}
                {(editing.type === "newsletter" || editing.type === "testimonials" || editing.type === "blog" || editing.type === "faq") && (
                  <>
                    <Field label={t("fSecTitle")}>
                      <Input value={String(form.title ?? "")} onChange={(e) => set("title", e.target.value)} className="bg-card" />
                    </Field>
                    <Field label={t("fSecSubtitle")}>
                      <Input value={String(form.subtitle ?? "")} onChange={(e) => set("subtitle", e.target.value)} className="bg-card" />
                    </Field>
                    <Field label={t("fCount")}>
                      <Input type="number" min={1} value={Number(form.count ?? 3)} onChange={(e) => set("count", Math.max(1, Number(e.target.value) || 3))} className="bg-card" />
                    </Field>
                  </>
                )}
              </SectionCard>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
