"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { MediaFile } from "@/features/admin/cms";
import { useCmsMedia, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_FILTERS = ["all", "image", "video", "document", "other"] as const;

function typeIcon(type: MediaFile["type"]) {
  if (type === "video") return Film;
  if (type === "document") return FileText;
  return ImageIcon;
}

export default function MediaLibraryPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const media = useCmsMedia();
  const store = useCmsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState<Array<{ name: string; pct: number; error?: boolean }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fName, setFName] = useState("");
  const [fAlt, setFAlt] = useState("");
  const [fCaption, setFCaption] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return media.filter(
      (m) =>
        (typeFilter === "all" || m.type === typeFilter) &&
        (!q || m.name.toLowerCase().includes(q))
    );
  }, [media, query, typeFilter]);

  const totalBytes = media.reduce((n, m) => n + m.bytes, 0);
  const fmtSize = (bytes: number) =>
    bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  const byType = (ty: MediaFile["type"]) => media.filter((m) => m.type === ty).length;

  const stats = [
    { l: t("sFiles"), v: String(media.length) },
    { l: t("sImages"), v: String(byType("image")) },
    { l: t("sVideos"), v: String(byType("video")) },
    { l: t("sDocs"), v: String(byType("document")) },
    { l: t("sStorage"), v: fmtSize(totalBytes) },
  ];

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const simulateUpload = (files: File[]) => {
    if (files.length === 0) return;
    const batch = files.slice(0, 5).map((f) => ({ name: f.name, pct: 0 }));
    setUploading((p) => [...p, ...batch]);
    batch.forEach((item) => {
      const fail = item.name.includes("fail");
      let pct = 0;
      const id = window.setInterval(() => {
        pct += 25;
        setUploading((prev) => prev.map((u) => (u.name === item.name ? { ...u, pct: Math.min(100, pct) } : u)));
        if (pct >= 100) {
          window.clearInterval(id);
          if (fail) {
            setUploading((prev) => prev.map((u) => (u.name === item.name ? { ...u, error: true } : u)));
            toast.error(t("uploadError"));
          } else {
            const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
            const type: MediaFile["type"] = ["mp4", "mov", "webm"].includes(ext)
              ? "video"
              : ["pdf", "doc", "docx", "xls"].includes(ext)
                ? "document"
                : ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
                  ? "image"
                  : "other";
            store.addMedia([
              {
                id: `md-${media.length + 1}-${item.name.length}`,
                name: item.name, type, size: fmtSize(400000 + item.name.length * 1000),
                bytes: 400000 + item.name.length * 1000, date: "2026-09-26",
                dims: type === "image" ? "1200×800" : "—", by: "Admin", url: "#",
                alt: item.name, caption: "", description: "",
              },
            ]);
            toast.success(t("uploadDone"));
            window.setTimeout(() => setUploading((prev) => prev.filter((u) => u.name !== item.name)), 1200);
          }
        }
      }, 250);
    });
  };

  const detail = detailId ? (media.find((m) => m.id === detailId) ?? null) : null;

  const openDetail = (m: MediaFile) => {
    setDetailId(m.id);
    setEditMode(false);
    setFName(m.name); setFAlt(m.alt); setFCaption(m.caption); setFDesc(m.description);
  };

  const saveDetail = () => {
    if (!detail || !fName.trim()) return;
    store.patchMedia(detail.id, { name: fName.trim(), alt: fAlt.trim(), caption: fCaption.trim(), description: fDesc.trim() });
    setEditMode(false);
    toast.success(t("toastSaved"));
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("mdTitle")}
        subtitle={t("mdSubtitle", { count: media.length, size: fmtSize(totalBytes) })}
        highlightLabel={t("sStorage")}
        highlightValue={fmtSize(totalBytes)}
        highlightIcon={LayoutGrid}
      >
        <button type="button" onClick={() => fileRef.current?.click()} className={heroPillClassName}>
          <Upload className="size-3.5" aria-hidden="true" />
          {t("uploadTitle")}
        </button>
      </AccountingHero>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          simulateUpload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.l} className="overflow-hidden border-border bg-card py-0">
            <CardContent className="p-4">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.l}</p>
              <p className="font-heading truncate text-xl font-bold text-foreground">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          simulateUpload([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragOver ? "border-secondary bg-secondary/5" : "border-border bg-card"
        )}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={t("uploadTitle")}
        onKeyDown={(e) => {
          if (e.key === "Enter") fileRef.current?.click();
        }}
      >
        <Upload className="size-8 text-secondary" aria-hidden="true" />
        <p className="text-sm font-bold">{t("dropFiles")}</p>
        {uploading.length > 0 ? (
          <div className="flex w-full max-w-md flex-col gap-1.5">
            {uploading.map((u) => (
              <div key={u.name} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-left font-medium">{u.name}</span>
                {u.error ? (
                  <span className="font-bold text-destructive">{t("uploadError")}</span>
                ) : u.pct >= 100 ? (
                  <span className="font-bold text-green-600">{t("uploadDone")}</span>
                ) : (
                  <>
                    <span className="h-1.5 w-24 bg-muted">
                      <span className="block h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${u.pct}%` }} />
                    </span>
                    <span className="font-bold">{u.pct}%</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter((v as (typeof TYPE_FILTERS)[number]) ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {TYPE_FILTERS.filter((x) => x !== "all").map((x) => (
              <SelectItem key={x} value={x}>{x}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected.size > 0 ? (
          <div className="flex items-center gap-2 sm:ml-auto">
            <p className="text-sm font-semibold">{selected.size} selected</p>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("deleteMedia")}
            </Button>
          </div>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((m) => {
            const Icon = typeIcon(m.type);
            const isSel = selected.has(m.id);
            return (
              <div
                key={m.id}
                className={cn("group relative border bg-card transition-colors", isSel ? "border-secondary" : "border-border hover:border-secondary")}
              >
                <button
                  type="button"
                  onClick={() => openDetail(m)}
                  className="flex w-full flex-col text-left"
                  aria-label={`${t("viewTitle")}: ${m.name}`}
                >
                  <span className="relative block aspect-square w-full overflow-hidden bg-muted">
                    {m.type === "image" && m.url !== "#" ? (
                      <Image src={m.url} alt={m.alt || m.name} fill sizes="200px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Icon className="size-10 text-secondary" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5 p-2">
                    <span className="truncate text-xs font-bold" title={m.name}>{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">{m.size} · {m.date}</span>
                  </span>
                </button>
                <span className="absolute top-2 left-2">
                  <Checkbox checked={isSel} onCheckedChange={() => toggleOne(m.id)} aria-label={m.name} className="bg-card" />
                </span>
                {isSel ? (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center bg-secondary text-white">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <EmptyState icon={LayoutGrid} title={t("emptyTitle")} description={t("emptyMedia")} />
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("uploadTitle")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading truncate text-base font-bold" title={detail.name}>
                  {detail.name}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 pt-4">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {detail.type === "image" && detail.url !== "#" ? (
                    <Image src={detail.url} alt={detail.alt || detail.name} fill sizes="400px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      {(() => {
                        const Icon = typeIcon(detail.type);
                        return <Icon className="size-14 text-secondary" aria-hidden="true" />;
                      })()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-primary/20 font-bold text-[#8a5a00]">{detail.type}</Badge>
                  <Badge variant="outline" className="font-mono">{detail.size}</Badge>
                  <Badge variant="outline" className="font-mono">{detail.dims}</Badge>
                </div>
                {editMode ? (
                  <>
                    <Field label={t("fFilename")}>
                      <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card font-mono text-xs" />
                    </Field>
                    <Field label={t("fAlt")}>
                      <Input value={fAlt} onChange={(e) => setFAlt(e.target.value)} className="bg-card" />
                    </Field>
                    <Field label={t("fCaption")}>
                      <Input value={fCaption} onChange={(e) => setFCaption(e.target.value)} className="bg-card" />
                    </Field>
                    <Field label={t("fFileDesc")}>
                      <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
                    </Field>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>{t("cancelBtn")}</Button>
                      <Button size="sm" onClick={saveDetail}>{t("saveBtn")}</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col divide-y divide-border text-sm">
                      <MetaRow label={t("tDate")} value={detail.date} />
                      <MetaRow label={t("fAlt")} value={detail.alt || "—"} />
                      <MetaRow label={t("fCaption")} value={detail.caption || "—"} />
                      <MetaRow label={t("fFileDesc")} value={detail.description || "—"} />
                      <MetaRow label={t("fFileUrl")} value={detail.url} mono />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 bg-card" onClick={() => setEditMode(true)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        {t("editTitle")}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 bg-card" onClick={() => void copyUrl(detail.url)}>
                        {copied ? <Check className="size-3.5 text-green-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                        {t("copyUrl")}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 bg-card" onClick={() => toast.success(t("download"))}>
                        <Download className="size-3.5" aria-hidden="true" />
                        {t("download")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 bg-card text-destructive hover:text-destructive"
                        onClick={() => {
                          store.removeMedia([detail.id]);
                          setDetailId(null);
                          toast.success(t("toastDeleted", { count: 1 }));
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        {t("deleteMedia")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmDesc")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>{t("cancelBtn")}</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                store.removeMedia([...selected]);
                setSelected(new Set());
                setConfirmDelete(false);
                toast.success(t("toastDeleted", { count: selected.size }));
              }}
            >
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium break-all", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
