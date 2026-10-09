"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Eye,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Search,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { FAQ_CATEGORIES, type FaqItem } from "@/features/admin/cms";
import { useCmsFaqs, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FaqManagementPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const faqs = useCmsFaqs();
  const store = useCmsStore();

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fQuestion, setFQuestion] = useState("");
  const [fAnswer, setFAnswer] = useState("");
  const [fCategory, setFCategory] = useState(FAQ_CATEGORIES[0]);
  const [fStatus, setFStatus] = useState<"published" | "draft">("draft");

  const categories = useMemo(() => {
    const fromData = [...new Set(faqs.map((f) => f.category))];
    return [...new Set([...FAQ_CATEGORIES, ...fromData])];
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter(
      (f) =>
        (catFilter === "all" || f.category === catFilter) &&
        (statusFilter === "all" || f.status === statusFilter) &&
        (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    );
  }, [faqs, query, catFilter, statusFilter]);

  const stats = [
    { l: t("sTotalFaqs"), v: faqs.length },
    { l: t("sPublishedFaqs"), v: faqs.filter((f) => f.status === "published").length },
    { l: t("sDraftFaqs"), v: faqs.filter((f) => f.status === "draft").length },
    { l: t("sFaqCats"), v: categories.length },
  ];

  const openAdd = () => {
    setEditId(null);
    setFQuestion(""); setFAnswer("");
    setFCategory(FAQ_CATEGORIES[0]); setFStatus("draft");
    setDialogOpen(true);
  };

  const openEdit = (f: FaqItem) => {
    setEditId(f.id);
    setFQuestion(f.question); setFAnswer(f.answer);
    setFCategory(f.category); setFStatus(f.status);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fQuestion.trim() || !fAnswer.trim()) return;
    if (editId) {
      store.patchFaq(editId, { question: fQuestion.trim(), answer: fAnswer.trim(), category: fCategory, status: fStatus, updated: "2026-09-26" });
      toast.success(t("toastUpdated"));
    } else {
      const maxOrder = faqs.reduce((n, f) => Math.max(n, f.order), 0);
      store.addFaq({
        id: `fq-${faqs.length + 1}`,
        question: fQuestion.trim(), answer: fAnswer.trim(),
        category: fCategory, status: fStatus, order: maxOrder + 1, updated: "2026-09-26",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const move = (f: FaqItem, dir: -1 | 1) => {
    const ordered = [...faqs].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((x) => x.id === f.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    store.patchFaq(f.id, { order: swap.order });
    store.patchFaq(swap.id, { order: f.order });
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("fqTitle")}
        subtitle={t("fqSubtitle", { count: filtered.length })}
        highlightLabel={t("sPublishedFaqs")}
        highlightValue={String(faqs.filter((f) => f.status === "published").length)}
        highlightIcon={MessageCircleQuestion}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addFaq")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading text-2xl font-bold">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as "all" | "published" | "draft") ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="published">{t("published")}</SelectItem>
            <SelectItem value="draft">{t("draft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((f) => {
            const open = openId === f.id;
            return (
              <Card key={f.id} className={cn("border-border bg-card", f.status === "draft" && "opacity-75")}>
                <CardContent className="flex items-center gap-2 p-3">
                  <span className="flex flex-col">
                    <button type="button" onClick={() => move(f, -1)} aria-label={`${t("moveUp")} ${f.question}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                      <ArrowUp className="size-3" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(f, 1)} aria-label={`${t("moveDown")} ${f.question}`} className="flex size-5 items-center justify-center text-muted-foreground hover:text-secondary">
                      <ArrowDown className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : f.id)}
                    aria-expanded={open}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-sm font-bold">{f.question}</span>
                    <span className="flex items-center gap-1.5 pt-0.5">
                      <Badge className="bg-primary/20 text-[10px] font-bold text-[#8a5a00]">{f.category}</Badge>
                      <Badge className={cn("text-[10px] font-bold", f.status === "published" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(f.status)}
                      </Badge>
                    </span>
                  </button>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
                  <span className="flex shrink-0 items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(f)} aria-label={`${t("editTitle")} ${f.question}`} title={t("editTitle")}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        store.patchFaq(f.id, { status: f.status === "published" ? "draft" : "published" });
                        toast.success(f.status === "published" ? t("toastUnpublished") : t("toastPublished"));
                      }}
                      aria-label={f.question}
                    >
                      <Eye className={cn("size-3.5", f.status === "published" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(f.id)} aria-label={f.question}>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </span>
                </CardContent>
                {open ? (
                  <CardContent className="border-t border-border bg-muted/40 pt-3 text-sm">
                    {f.answer}
                    <p className="pt-2 text-[11px] text-muted-foreground">{t("tOrder")}: {f.order} · {t("tUpdated")}: {f.updated}</p>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={MessageCircleQuestion} title={t("emptyTitle")} description={t("emptyFaqs")} />
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addFaq")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("addFaq")}>
            <Field label={t("fQuestion")}>
              <Input value={fQuestion} onChange={(e) => setFQuestion(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fAnswer")}>
              <Input value={fAnswer} onChange={(e) => setFAnswer(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("fCategory")}>
                <Input value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="bg-card" list="cms-faq-cats" />
                <datalist id="cms-faq-cats">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label={t("fStatus")}>
                <Select value={fStatus} onValueChange={(v) => setFStatus((v as "published" | "draft") ?? "draft")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">{t("published")}</SelectItem>
                    <SelectItem value="draft">{t("draft")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>
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
              if (confirmId) store.removeFaqs([confirmId]);
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
