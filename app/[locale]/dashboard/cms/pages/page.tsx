"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  FileText,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CmsStatusBadge } from "@/components/admin/cms/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { PAGE_TEMPLATES, seoScore, type CmsPage } from "@/features/admin/cms";
import { useCmsPages, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PageStatus = CmsPage["status"];

export default function CmsPagesPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const pages = useCmsPages();
  const store = useCmsStore();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PageStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fSlug, setFSlug] = useState("");
  const [fContent, setFContent] = useState("");
  const [fStatus, setFStatus] = useState<PageStatus>("draft");
  const [fAuthor, setFAuthor] = useState("Admin");
  const [fTemplate, setFTemplate] = useState(PAGE_TEMPLATES[0]);
  const [fParent, setFParent] = useState("—");
  const [fDate, setFDate] = useState("2026-09-26");
  const [fSeoTitle, setFSeoTitle] = useState("");
  const [fSeoDesc, setFSeoDesc] = useState("");
  const [fKeyword, setFKeyword] = useState("");
  const [fCanonical, setFCanonical] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter(
      (p) =>
        (statusFilter === "all" || p.status === statusFilter) &&
        (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q))
    );
  }, [pages, query, statusFilter]);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => pages.some((p) => p.id === id)),
    [selected, pages]
  );

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openAdd = () => {
    setEditId(null);
    setFTitle(""); setFSlug(""); setFContent("");
    setFStatus("draft"); setFAuthor("Admin"); setFTemplate(PAGE_TEMPLATES[0]);
    setFParent("—"); setFDate("2026-09-26");
    setFSeoTitle(""); setFSeoDesc(""); setFKeyword(""); setFCanonical("");
    setDialogOpen(true);
  };

  const openEdit = (p: CmsPage) => {
    setEditId(p.id);
    setFTitle(p.title); setFSlug(p.slug); setFContent(p.content);
    setFStatus(p.status); setFAuthor(p.author); setFTemplate(p.template);
    setFParent(p.parent); setFDate(p.publishDate);
    setFSeoTitle(p.seoTitle); setFSeoDesc(p.seoDesc); setFKeyword(p.keyword); setFCanonical(p.canonical);
    setDialogOpen(true);
  };

  const collect = () => ({
    title: fTitle.trim(),
    slug: slugify(fSlug || fTitle),
    content: fContent,
    status: fStatus,
    author: fAuthor.trim() || "Admin",
    template: fTemplate,
    parent: fParent,
    publishDate: fDate,
    seoTitle: fSeoTitle.trim() || `${fTitle.trim()} | Fashion Store`,
    seoDesc: fSeoDesc.trim(),
    keyword: fKeyword.trim(),
    canonical: fCanonical.trim() || `/${slugify(fSlug || fTitle)}`,
  });

  const validate = () => {
    if (!fTitle.trim()) {
      toast.error(t("fPageTitle"));
      return false;
    }
    const slug = slugify(fSlug || fTitle);
    if (!slug) {
      toast.error(t("fSlug"));
      return false;
    }
    if (pages.some((p) => p.slug === slug && p.id !== editId)) {
      toast.error(t("fSlug"));
      return false;
    }
    return true;
  };

  const handleSave = (status: PageStatus) => {
    if (!validate()) return;
    const data = { ...collect(), status };
    if (editId) {
      store.patchPage(editId, { ...data, updated: "2026-09-26" });
      toast.success(t("toastUpdated"));
    } else {
      store.addPage({
        id: `pg-${pages.length + 1}`, ...data,
        excerpt: fContent.replace(/<[^>]*>/g, "").slice(0, 120),
        image: "", created: "2026-09-26", updated: "2026-09-26",
      });
      toast.success(status === "published" ? t("toastPublished") : t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const score = seoScore(fSeoTitle || fTitle, fSeoDesc, fKeyword, slugify(fSlug || fTitle));
  const scorePct = Math.round((score.filter((s) => s.ok).length / score.length) * 100);
  const previewed = previewId ? (pages.find((p) => p.id === previewId) ?? null) : null;

  const seoBadge = (ok: boolean) => (
    <span className={cn("px-1.5 py-0.5 text-[10px] font-bold", ok ? "bg-green-600/10 text-green-700" : "bg-destructive/10 text-destructive")}>
      {ok ? "OK" : "—"}
    </span>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("pgTitle")}
        subtitle={t("pgSubtitle", { count: filtered.length })}
        highlightLabel={t("sPublishedPages")}
        highlightValue={String(pages.filter((p) => p.status === "published").length)}
        highlightIcon={FileText}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addPage")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as PageStatus | "all") ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {(["draft", "published", "scheduled", "archived"] as PageStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive" onClick={() => {
                store.removePages(activeSelected);
                setSelected(new Set());
                toast.success(t("toastDeleted", { count: activeSelected.length }));
              }}>
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_td:has([role=checkbox])]:px-4 [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:has([role=checkbox])]:px-4 [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
                      indeterminate={filtered.some((p) => selected.has(p.id)) && !filtered.every((p) => selected.has(p.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const p of filtered) {
                            if (v === true) next.add(p.id);
                            else next.delete(p.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("pgTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tPage")}</TableHead>
                  <TableHead>{t("tAuthor")}</TableHead>
                  <TableHead>{t("tCreated")}</TableHead>
                  <TableHead>{t("tSeo")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={cn(selected.has(p.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(p.id);
                        else next.delete(p.id);
                        return next;
                      })} aria-label={p.title} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{p.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">/{p.slug} · {p.template}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{p.author}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.updated}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {seoBadge(p.seoTitle.length > 0)}
                        {seoBadge(p.seoDesc.length > 0)}
                        {seoBadge(p.keyword.length > 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <CmsStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setPreviewId(p.id)} aria-label={`${t("previewPage")} ${p.title}`} title={t("previewPage")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label={`${t("editTitle")} ${p.title}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.addPage({ ...p, id: `pg-${pages.length + 1}`, title: `${p.title} (Copy)`, slug: `${p.slug}-copy`, status: "draft" });
                          toast.success(t("duplicate"));
                        }} aria-label={p.title} title={t("duplicate")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        {p.status === "published" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPage(p.id, { status: "draft" }); toast.success(t("toastUnpublished")); }} aria-label={p.title} title={t("unpublish")}>
                            <Play className="size-4 rotate-180 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPage(p.id, { status: "published" }); toast.success(t("toastPublished")); }} aria-label={p.title} title={t("publish")}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(p.id)} aria-label={p.title}>
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
              <EmptyState icon={FileText} title={t("emptyTitle")} description={t("emptyPages")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewed} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("previewPage")} · {previewed.title}
                </DialogTitle>
              </DialogHeader>
              <div className="border border-border bg-white p-5 text-[#1a0d00]">
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{previewed.template}</p>
                <p className="font-heading pt-1 text-2xl font-bold">{previewed.title}</p>
                <div className="prose-sm pt-2 text-sm" dangerouslySetInnerHTML={{ __html: previewed.content }} />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setPreviewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addPage")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid items-start gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <Field label={t("fPageTitle")}>
                <Input
                  value={fTitle}
                  onChange={(e) => {
                    setFTitle(e.target.value);
                    if (!editId) setFSlug(slugify(e.target.value));
                  }}
                  className="bg-card"
                  placeholder="About Us"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("fSlug")}>
                  <Input value={fSlug} onChange={(e) => setFSlug(slugify(e.target.value))} className="bg-card font-mono" placeholder="about-us" />
                </Field>
                <Field label={t("fStatus")}>
                  <Select value={fStatus} onValueChange={(v) => setFStatus((v as PageStatus) ?? "draft")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["draft", "published", "scheduled", "archived"] as PageStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label={t("fContent")}>
                <RichTextEditor value={fContent} onChange={setFContent} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("tAuthor")}>
                  <Input value={fAuthor} onChange={(e) => setFAuthor(e.target.value)} className="bg-card" />
                </Field>
                <Field label={t("fTemplate")}>
                  <Select value={fTemplate} onValueChange={(v) => setFTemplate(v ?? PAGE_TEMPLATES[0])}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_TEMPLATES.map((x) => (
                        <SelectItem key={x} value={x}>{x}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("fPublishDate")}>
                  <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="bg-card" />
                </Field>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <SectionCard title={t("seoSec")}>
                <Field label={t("fSeoTitle")}>
                  <Input value={fSeoTitle} onChange={(e) => setFSeoTitle(e.target.value)} className="bg-card" />
                </Field>
                <Field label={t("fSeoDesc")}>
                  <Input value={fSeoDesc} onChange={(e) => setFSeoDesc(e.target.value)} className="bg-card" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("fKeyword")}>
                    <Input value={fKeyword} onChange={(e) => setFKeyword(e.target.value)} className="bg-card" />
                  </Field>
                  <Field label={t("fCanonical")}>
                    <Input value={fCanonical} onChange={(e) => setFCanonical(e.target.value)} className="bg-card" />
                  </Field>
                </div>
              </SectionCard>
              <SectionCard title={`${t("seoScore")} · ${scorePct}%`}>
                <div className="h-2 w-full bg-muted">
                  <div className={cn("h-full", scorePct >= 75 ? "bg-green-600" : scorePct >= 50 ? "bg-primary" : "bg-destructive")} style={{ width: `${scorePct}%` }} />
                </div>
                {score.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      {s.hint} {seoBadge(s.ok)}
                    </span>
                  </div>
                ))}
              </SectionCard>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => handleSave("draft")}>{t("saveDraft")}</Button>
            <Button size="sm" onClick={() => handleSave(fStatus === "scheduled" ? "scheduled" : "published")}>
              {fStatus === "scheduled" ? t("schedule") : t("publish")}
            </Button>
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
              if (confirmId) store.removePages([confirmId]);
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
