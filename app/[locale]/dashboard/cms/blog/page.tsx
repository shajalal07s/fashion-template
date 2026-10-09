"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  Newspaper,
  Pencil,
  Play,
  Plus,
  Search,
  Tag,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { seoScore, type BlogCategory, type BlogPost } from "@/features/admin/cms";
import { useCmsCategories, useCmsPosts, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PostStatus = BlogPost["status"];

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Newspaper className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function BlogManagementPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const posts = useCmsPosts();
  const categories = useCmsCategories();
  const store = useCmsStore();

  const [tab, setTab] = useState("posts");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [catDialog, setCatDialog] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fSlug, setFSlug] = useState("");
  const [fExcerpt, setFExcerpt] = useState("");
  const [fContent, setFContent] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fTags, setFTags] = useState("");
  const [fAuthor, setFAuthor] = useState("Admin");
  const [fDate, setFDate] = useState("2026-09-26");
  const [fStatus, setFStatus] = useState<PostStatus>("draft");
  const [fSeoTitle, setFSeoTitle] = useState("");
  const [fSeoDesc, setFSeoDesc] = useState("");
  const [fKeyword, setFKeyword] = useState("");
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cDesc, setCDesc] = useState("");

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (statusFilter === "all" || p.status === statusFilter) &&
        (catFilter === "all" || p.category === catFilter) &&
        (!q || p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q))
    );
  }, [posts, query, statusFilter, catFilter]);

  const byStatus = (s: PostStatus) => posts.filter((p) => p.status === s).length;
  const views = posts.reduce((n, p) => n + p.views, 0);

  const openAdd = () => {
    setEditId(null);
    setFTitle(""); setFSlug(""); setFExcerpt(""); setFContent("");
    setFCategory(categories[0]?.name ?? ""); setFTags("");
    setFAuthor("Admin"); setFDate("2026-09-26"); setFStatus("draft");
    setFSeoTitle(""); setFSeoDesc(""); setFKeyword("");
    setDialogOpen(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditId(p.id);
    setFTitle(p.title); setFSlug(p.slug); setFExcerpt(p.excerpt); setFContent(p.content);
    setFCategory(p.category); setFTags(p.tags.join(", "));
    setFAuthor(p.author); setFDate(p.publishDate); setFStatus(p.status);
    setFSeoTitle(p.seoTitle); setFSeoDesc(p.seoDesc); setFKeyword(p.keyword);
    setDialogOpen(true);
  };

  const handleSave = (status: PostStatus) => {
    if (!fTitle.trim()) {
      toast.error(t("fPostTitle"));
      return;
    }
    const slug = slugify(fSlug || fTitle);
    if (posts.some((p) => p.slug === slug && p.id !== editId)) {
      toast.error(t("fSlug"));
      return;
    }
    const data = {
      title: fTitle.trim(), slug, excerpt: fExcerpt.trim(), content: fContent,
      category: fCategory, tags: fTags.split(",").map((x) => x.trim()).filter(Boolean),
      author: fAuthor.trim() || "Admin", publishDate: fDate, status,
      seoTitle: fSeoTitle.trim() || `${fTitle.trim()} | Fashion Store`,
      seoDesc: fSeoDesc.trim(), keyword: fKeyword.trim(),
    };
    if (editId) {
      store.patchPost(editId, { ...data, updated: "2026-09-26" });
      toast.success(t("toastUpdated"));
    } else {
      store.addPost({
        id: `bp-${posts.length + 1}`, ...data,
        image: "/images/women/women-1.jpg", views: 0, updated: "2026-09-26",
      });
      toast.success(status === "published" ? t("toastPublished") : t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const openCatAdd = () => {
    setCatEditId(null);
    setCName(""); setCSlug(""); setCDesc("");
    setCatDialog(true);
  };

  const openCatEdit = (c: BlogCategory) => {
    setCatEditId(c.id);
    setCName(c.name); setCSlug(c.slug); setCDesc(c.description);
    setCatDialog(true);
  };

  const saveCategory = () => {
    if (!cName.trim()) return;
    const slug = slugify(cSlug || cName);
    if (catEditId) {
      store.patchCategory(catEditId, { name: cName.trim(), slug, description: cDesc.trim(), updated: "2026-09-26" });
      toast.success(t("toastUpdated"));
    } else {
      store.addCategory({
        id: `bc-${categories.length + 1}`, name: cName.trim(), slug,
        description: cDesc.trim(), parent: "—", posts: 0, status: "active", updated: "2026-09-26",
      });
      toast.success(t("toastCreated"));
    }
    setCatDialog(false);
  };

  const score = seoScore(fSeoTitle || fTitle, fSeoDesc, fKeyword, slugify(fSlug || fTitle));
  const scorePct = Math.round((score.filter((s) => s.ok).length / score.length) * 100);
  const previewed = previewId ? (posts.find((p) => p.id === previewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("bpTitle")}
        subtitle={t("bpSubtitle", { count: filtered.length })}
        highlightLabel={t("sViews")}
        highlightValue={String(views)}
        highlightIcon={Newspaper}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addPost")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Mini label={t("sTotalPosts")} value={String(posts.length)} tile="bg-secondary/15 text-secondary" />
        <Mini label={t("sPublished")} value={String(byStatus("published"))} tile="bg-green-600/10 text-green-700" />
        <Mini label={t("sDrafts")} value={String(byStatus("draft"))} tile="bg-muted text-muted-foreground" />
        <Mini label={t("sScheduled")} value={String(byStatus("scheduled"))} tile="bg-primary/20 text-[#8a5a00]" />
        <Mini label={t("sArchived")} value={String(byStatus("archived"))} tile="bg-muted text-muted-foreground" />
        <Mini label={t("sViews")} value={String(views)} tile="bg-primary/15 text-secondary" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="posts">{t("tabPosts")} ({posts.length})</TabsTrigger>
          <TabsTrigger value="categories">{t("tabCategories")} ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as PostStatus | "all") ?? "all")}>
              <SelectTrigger size="sm" className="h-8 w-36 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {(["draft", "published", "scheduled", "archived"] as PostStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
              <SelectTrigger size="sm" className="h-8 w-44 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              {filtered.length > 0 ? (
                <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead>{t("tPost")}</TableHead>
                      <TableHead>{t("tCategory")}</TableHead>
                      <TableHead>{t("tAuthor")}</TableHead>
                      <TableHead className="text-right">{t("tViews")}</TableHead>
                      <TableHead>{t("tPublishDate")}</TableHead>
                      <TableHead>{t("tStatus")}</TableHead>
                      <TableHead className="w-36">{t("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="max-w-52 truncate text-sm font-semibold" title={p.title}>{p.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">/{p.slug}</p>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{p.category}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{p.author}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{p.views.toLocaleString()}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.publishDate}</TableCell>
                        <TableCell>
                          <CmsStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => setPreviewId(p.id)} aria-label={`${t("preview")} ${p.title}`} title={t("preview")}>
                              <Eye className="size-4" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label={`${t("editTitle")} ${p.title}`} title={t("editTitle")}>
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => {
                              store.addPost({ ...p, id: `bp-${posts.length + 1}`, title: `${p.title} (Copy)`, slug: `${p.slug}-copy`, status: "draft", views: 0 });
                              toast.success(t("duplicate"));
                            }} aria-label={p.title} title={t("duplicate")}>
                              <Copy className="size-4" aria-hidden="true" />
                            </Button>
                            {p.status === "published" ? (
                              <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPost(p.id, { status: "draft" }); toast.success(t("toastUnpublished")); }} aria-label={p.title} title={t("unpublish")}>
                                <Play className="size-4 rotate-180 text-[#8a5a00]" aria-hidden="true" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon-sm" onClick={() => { store.patchPost(p.id, { status: "published" }); toast.success(t("toastPublished")); }} aria-label={p.title} title={t("publish")}>
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
                  <EmptyState icon={Newspaper} title={t("emptyTitle")} description={t("emptyPosts")} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="flex flex-col gap-4 pt-2">
          <div className="flex justify-end">
            <Button size="sm" className="h-8 gap-1.5" onClick={openCatAdd}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("addCategory")}
            </Button>
          </div>
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tCatName")}</TableHead>
                    <TableHead>{t("tSlug")}</TableHead>
                    <TableHead className="text-right">{t("tCatPosts")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-28">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
                          <Tag className="size-3.5 text-secondary" aria-hidden="true" />
                          {c.name}
                        </p>
                        <p className="max-w-52 truncate text-xs text-muted-foreground" title={c.description}>{c.description}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">/{c.slug}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{c.posts}</TableCell>
                      <TableCell>
                        <CmsStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openCatEdit(c)} aria-label={`${t("editTitle")} ${c.name}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              store.patchCategory(c.id, { status: c.status === "active" ? "inactive" : "active" });
                              toast.success(t("toastUpdated"));
                            }}
                            aria-label={c.name}
                          >
                            <Play className={cn("size-4", c.status === "active" ? "rotate-180 text-[#8a5a00]" : "text-green-600")} aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => {
                            store.removeCategories([c.id]);
                            toast.success(t("toastDeleted", { count: 1 }));
                          }} aria-label={c.name}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewed} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("preview")} · {previewed.title}
                </DialogTitle>
              </DialogHeader>
              <div className="border border-border bg-white p-5 text-[#1a0d00]">
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{previewed.category}</p>
                <p className="font-heading pt-1 text-2xl font-bold">{previewed.title}</p>
                <p className="pt-1 text-sm text-muted-foreground">{previewed.excerpt}</p>
                <div className="prose-sm pt-2 text-sm" dangerouslySetInnerHTML={{ __html: previewed.content }} />
                <p className="pt-3 text-xs text-muted-foreground">{previewed.author} · {previewed.publishDate}</p>
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
              {editId ? t("editTitle") : t("addPost")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid items-start gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <Field label={t("fPostTitle")}>
                <Input value={fTitle} onChange={(e) => { setFTitle(e.target.value); if (!editId) setFSlug(slugify(e.target.value)); }} className="bg-card" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("fSlug")}>
                  <Input value={fSlug} onChange={(e) => setFSlug(slugify(e.target.value))} className="bg-card font-mono" />
                </Field>
                <Field label={t("fStatus")}>
                  <Select value={fStatus} onValueChange={(v) => setFStatus((v as PostStatus) ?? "draft")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["draft", "published", "scheduled", "archived"] as PostStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label={t("fExcerpt")}>
                <Input value={fExcerpt} onChange={(e) => setFExcerpt(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fContent")}>
                <RichTextEditor value={fContent} onChange={setFContent} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("tCategory")}>
                  <Select value={fCategory} onValueChange={(v) => setFCategory(v ?? "")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("fTags")}>
                  <Input value={fTags} onChange={(e) => setFTags(e.target.value)} className="bg-card" placeholder="kurti, style" />
                </Field>
                <Field label={t("tAuthor")}>
                  <Input value={fAuthor} onChange={(e) => setFAuthor(e.target.value)} className="bg-card" />
                </Field>
              </div>
              <Field label={t("fPublishDate")}>
                <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="bg-card" />
              </Field>
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <SectionCard title={t("seoSec")}>
                <Field label={t("fSeoTitle")}>
                  <Input value={fSeoTitle} onChange={(e) => setFSeoTitle(e.target.value)} className="bg-card" />
                </Field>
                <Field label={t("fSeoDesc")}>
                  <Input value={fSeoDesc} onChange={(e) => setFSeoDesc(e.target.value)} className="bg-card" />
                </Field>
                <Field label={t("fKeyword")}>
                  <Input value={fKeyword} onChange={(e) => setFKeyword(e.target.value)} className="bg-card" />
                </Field>
              </SectionCard>
              <SectionCard title={`${t("seoScore")} · ${scorePct}%`}>
                <div className="h-2 w-full bg-muted">
                  <div className={cn("h-full", scorePct >= 75 ? "bg-green-600" : scorePct >= 50 ? "bg-primary" : "bg-destructive")} style={{ width: `${scorePct}%` }} />
                </div>
                {score.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{s.hint}</span>
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

      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {catEditId ? t("editTitle") : t("addCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("fCatName")}>
              <Input value={cName} onChange={(e) => { setCName(e.target.value); if (!catEditId) setCSlug(slugify(e.target.value)); }} className="bg-card" />
            </Field>
            <Field label={t("fSlug")}>
              <Input value={cSlug} onChange={(e) => setCSlug(slugify(e.target.value))} className="bg-card font-mono" />
            </Field>
            <Field label={t("fCatDesc")}>
              <Input value={cDesc} onChange={(e) => setCDesc(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCatDialog(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={saveCategory}>{t("saveBtn")}</Button>
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
              if (confirmId) store.removePosts([confirmId]);
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
