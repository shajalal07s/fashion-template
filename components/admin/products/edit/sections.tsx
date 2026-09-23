"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { GripVertical, ImagePlus, Play, Plus, Sparkles, Star, Trash2, Upload, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { cn } from "@/lib/utils";
import type { ProductSeo } from "@/store/admin-products.store";

export function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card pt-5 pb-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="font-heading flex items-center gap-2 text-lg font-bold">
          {icon}
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
      {children}
    </div>
  );
}

export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-label={`${s} / 5`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "size-6",
              s <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-secondary">{value.toFixed(1)}</span>
    </div>
  );
}

export function GeneralSection({
  idKey,
  name,
  onName,
  sku,
  rating,
  onRating,
  shortDesc,
  onShortDesc,
  description,
  onDescription,
}: {
  idKey: string;
  name: string;
  onName: (v: string) => void;
  sku?: string;
  rating: number;
  onRating: (v: number) => void;
  shortDesc: string;
  onShortDesc: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  return (
    <SectionCard title={t("products.epGeneral")}>
      <Field label={t("products.epName")}>
        <Input value={name} onChange={(e) => onName(e.target.value)} className="bg-card" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("products.epSku")}>
          <Input value={sku ?? ""} readOnly className="bg-muted" />
        </Field>
        <Field label={t("products.epRating")}>
          <RatingInput value={rating} onChange={onRating} />
        </Field>
      </div>
      <Field label={t("products.epShortDesc")}>
        <RichTextEditor
          key={`short-${idKey}`}
          value={shortDesc}
          onChange={onShortDesc}
          minHeight={90}
        />
      </Field>
      <Field label={t("products.epDescription")}>
        <RichTextEditor
          key={`desc-${idKey}`}
          value={description}
          onChange={onDescription}
          minHeight={180}
        />
      </Field>
    </SectionCard>
  );
}

export function PricingSection({
  price,
  onPrice,
  compare,
  onCompare,
  stock,
  onStock,
}: {
  price: number;
  onPrice: (v: number) => void;
  compare: number | null;
  onCompare: (v: number | null) => void;
  stock: number;
  onStock: (v: number) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  return (
    <SectionCard title={t("products.epPricing")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("products.epPrice")}>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => onPrice(Number(e.target.value) || 0)}
            className="bg-card"
          />
        </Field>
        <Field label={t("products.epCompare")}>
          <Input
            type="number"
            min={0}
            value={compare ?? ""}
            onChange={(e) => onCompare(e.target.value === "" ? null : Number(e.target.value) || 0)}
            className="bg-card"
          />
        </Field>
        <Field label={t("products.epStock")}>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => onStock(Number(e.target.value) || 0)}
            className="bg-card"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

const CATEGORY_OPTIONS = ["Women", "Men", "Kids", "Accessories"];

export function CategoriesSection({
  category,
  onCategory,
  subcategory,
  onSubcategory,
  subcategories,
  newSub,
  onNewSub,
  onAddSub,
}: {
  category: string;
  onCategory: (v: string) => void;
  subcategory: string;
  onSubcategory: (v: string) => void;
  subcategories: string[];
  newSub: string;
  onNewSub: (v: string) => void;
  onAddSub: () => void;
}) {
  const t = useTranslations("Dashboard.admin");
  return (
    <SectionCard title={t("products.epCategories")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("products.epCategory")}>
          <Select value={category} onValueChange={(v) => v && onCategory(v)}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("products.epSubcategory")}>
          <Select value={subcategory} onValueChange={(v) => v && onSubcategory(v)}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder={subcategory || "—"} />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("products.epNewSub")}>
          <div className="flex items-center gap-2">
            <Input value={newSub} onChange={(e) => onNewSub(e.target.value)} className="bg-card" />
            <Button size="sm" variant="outline" className="h-8 shrink-0 bg-card" onClick={onAddSub}>
              <Plus className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </Field>
      </div>
    </SectionCard>
  );
}

export function GallerySection({
  productName,
  images,
  onChange,
}: {
  productName: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const [url, setUrl] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          try {
            const max = 1200;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(String(reader.result));
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch {
            resolve(String(reader.result));
          }
        };
        img.onerror = () => reject(new Error("bad image"));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("read error"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error(t("products.epNotImage"));
      return;
    }
    const urls: string[] = [];
    for (const file of list) {
      try {
        urls.push(await fileToDataUrl(file));
      } catch {
        /* skip unreadable file */
      }
    }
    if (urls.length > 0) onChange([...images, ...urls]);
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const endDrag = () => {
    setDragIdx(null);
    setOverIdx(null);
    setDropActive(false);
  };

  return (
    <SectionCard title={t("products.epMedia")}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropActive(false);
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
        className={
          dropActive
            ? "grid grid-cols-3 gap-2 ring-2 ring-secondary ring-offset-2 sm:grid-cols-4"
            : "grid grid-cols-3 gap-2 sm:grid-cols-4"
        }
      >
        {images.map((src, i) => (
          <span
            key={`${src.slice(0, 32)}-${i}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              try {
                e.dataTransfer.setData("text/plain", String(i));
              } catch {
                /* noop */
              }
              setDragIdx(i);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files?.length) {
                void addFiles(e.dataTransfer.files);
              } else if (dragIdx !== null) {
                move(dragIdx, i);
              }
              endDrag();
            }}
            onDragEnd={endDrag}
            className={
              overIdx === i && dragIdx !== null && dragIdx !== i
                ? "group relative block aspect-square cursor-grab overflow-hidden bg-muted ring-2 ring-secondary active:cursor-grabbing"
                : dragIdx === i
                  ? "group relative block aspect-square cursor-grab overflow-hidden bg-muted opacity-50 active:cursor-grabbing"
                  : "group relative block aspect-square cursor-grab overflow-hidden bg-muted active:cursor-grabbing"
            }
          >
            <GripVertical
              className="absolute bottom-1 left-1 z-10 size-4 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
            {src ? (
              <Image
                src={src}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="160px"
                className="object-cover"
                draggable={false}
              />
            ) : null}
            {i === 0 ? (
              <span className="absolute top-1 left-1 bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                {t("products.epPrimary")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}
                className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase opacity-0 transition-opacity group-hover:opacity-100"
              >
                {t("products.epPrimary")}
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              aria-label="Remove image"
              className="absolute top-1 right-1 flex size-6 items-center justify-center bg-black/60 text-white transition-colors hover:bg-destructive"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("products.epDropImages")}</p>
      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("products.epAddImage")}
          className="bg-card"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1 bg-card"
          onClick={() => {
            if (!url.trim()) return;
            onChange([...images, url.trim()]);
            setUrl("");
          }}
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button size="sm" className="h-8 shrink-0 gap-1" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" aria-hidden="true" />
          {t("products.epUpload")}
        </Button>
      </div>
    </SectionCard>
  );
}

export function VideosSection({
  videos,
  onChange,
}: {
  videos: string[];
  onChange: (videos: string[]) => void;
}) {
  const t = useTranslations("Dashboard.admin");
  const [url, setUrl] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 10 * 1024 * 1024;

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read error"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("video/"));
    if (list.length === 0) {
      toast.error(t("products.epNotImage"));
      return;
    }
    const urls: string[] = [];
    for (const file of list) {
      if (file.size > MAX_SIZE) {
        toast.error(t("products.epTooLarge"));
        continue;
      }
      try {
        urls.push(await readFile(file));
      } catch {
        /* skip unreadable file */
      }
    }
    if (urls.length > 0) onChange([...videos, ...urls]);
  };

  const playable = (src: string) =>
    src.startsWith("data:video") || /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(src);

  const addDroppedUrl = (e: React.DragEvent): boolean => {
    const raw =
      e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    const url = raw.trim().split("\n")[0]?.trim() ?? "";
    if (/^https?:\/\//i.test(url)) {
      onChange([...videos, url]);
      return true;
    }
    return false;
  };

  const youtubeEmbed = (src: string): string | null => {
    const m = src.match(
      /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
    );
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        const types = e.dataTransfer.types;
        if (
          types.includes("Files") ||
          types.includes("text/uri-list") ||
          types.includes("text/plain")
        ) {
          setDropActive(true);
        }
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropActive(false);
        if (e.dataTransfer.files?.length) {
          void addFiles(e.dataTransfer.files);
        } else {
          addDroppedUrl(e);
        }
      }}
      className={dropActive ? "ring-2 ring-secondary ring-offset-2" : undefined}
    >
    <SectionCard
      title={t("products.epVideos")}
      icon={<Video className="size-4 text-secondary" aria-hidden="true" />}
    >
      <div className="flex flex-col gap-2">
        {videos.length > 0 ? (
          <div className="flex flex-col gap-2">
            {videos.map((item, i) => {
              const embed = !playable(item) ? youtubeEmbed(item) : null;
              return (
              <div
                key={`${item.slice(0, 32)}-${i}`}
                className="flex items-center gap-2 border border-border bg-card px-3 py-2"
              >
                {playable(item) ? (
                  <video
                    src={item}
                    preload="metadata"
                    playsInline
                    className="h-12 w-20 shrink-0 bg-black object-cover"
                  />
                ) : embed ? (
                  <iframe
                    src={embed}
                    title={`Video ${i + 1}`}
                    loading="lazy"
                    className="pointer-events-none h-12 w-20 shrink-0 bg-black"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center bg-secondary/15">
                    <Play className="size-4 text-secondary" aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {item.startsWith("data:") ? `Uploaded video ${i + 1}` : item}
                </span>
                {playable(item) || embed ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Open video"
                  >
                    <Play className="size-4" aria-hidden="true" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(videos.filter((_, j) => j !== i))}
                  aria-label="Remove video"
                  className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("products.epDropVideos")}</p>
      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("products.epAddVideo")}
          className="bg-card"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1 bg-card"
          onClick={() => {
            if (!url.trim()) return;
            onChange([...videos, url.trim()]);
            setUrl("");
          }}
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button size="sm" className="h-8 shrink-0 gap-1" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" aria-hidden="true" />
          {t("products.epUpload")}
        </Button>
      </div>
    </SectionCard>
    </div>
  );
}

export function SeoSection({
  seo,
  onChange,
  onAuto,
}: {
  seo: ProductSeo;
  onChange: (seo: ProductSeo) => void;
  onAuto: () => void;
}) {
  const t = useTranslations("Dashboard.admin");
  return (
    <SectionCard
      title={t("products.epSeo")}
      action={
        <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card" onClick={onAuto}>
          <Sparkles className="size-3.5 text-secondary" aria-hidden="true" />
          {t("products.epSeoAuto")}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("products.epSlug")}>
          <Input
            value={seo.slug}
            onChange={(e) => onChange({ ...seo, slug: e.target.value })}
            className="bg-card font-mono text-xs"
          />
        </Field>
        <Field label={t("products.epKeywords")}>
          <Input
            value={seo.keywords}
            onChange={(e) => onChange({ ...seo, keywords: e.target.value })}
            className="bg-card font-mono text-xs"
          />
        </Field>
      </div>
      <Field label={t("products.epMetaTitle")}>
        <Input
          value={seo.metaTitle}
          onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
          className="bg-card"
        />
      </Field>
      <Field label={t("products.epMetaDesc")}>
        <Input
          value={seo.metaDescription}
          onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
          className="bg-card"
        />
      </Field>
      <div className="border border-dashed border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold text-secondary">{seo.metaTitle}</p>
        <p className="font-mono text-[11px] text-muted-foreground">fashionstore.com.bd/{seo.slug}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{seo.metaDescription}</p>
      </div>
    </SectionCard>
  );
}
