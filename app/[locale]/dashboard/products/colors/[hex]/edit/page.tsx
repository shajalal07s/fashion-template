"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, Package, Pipette, Save, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { COLOR_NAMES, PRESET_COLORS } from "@/components/admin/products/ColorsTable";
import { products } from "@/features/shop/products";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { toast } from "sonner";

export default function DashboardColorEditPage() {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const params = useParams<{ hex: string }>();
  const displayHex = decodeURIComponent(params.hex).toLowerCase();
  const router = useRouter();

  const customColors = useAdminProductsStore((s) => s.customColors);
  const metaMap = useAdminProductsStore((s) => s.colorMeta);
  const renameColor = useAdminProductsStore((s) => s.renameColor);
  const removeCustomColor = useAdminProductsStore((s) => s.removeCustomColor);

  const isCustom = customSizesCheck(displayHex, customColors);
  function customSizesCheck(hex: string, list: string[]) {
    return list.some((c) => c.toLowerCase() === hex);
  }

  const list = useMemo(
    () => products.filter((p) => (p.colors ?? []).some((c) => c.toLowerCase() === displayHex)),
    [displayHex]
  );
  const totalStock = useMemo(() => list.reduce((n, p) => n + p.stock, 0), [list]);
  const meta = metaMap[displayHex];
  const metaAuthor = meta?.author ?? t("attributes.systemAuthor");
  const metaDate = (iso: string) =>
    iso
      ? format.dateTime(new Date(iso), {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const [hex, setHex] = useState(displayHex);

  const hexInput = hex.trim();
  const isNameInput = hexInput.length > 0 && !hexInput.startsWith("#") && !/^[0-9a-f]{3,6}$/i.test(hexInput);
  const suggestions = isNameInput
    ? COLOR_NAMES.filter((c) => c.name.includes(hexInput.toLowerCase())).slice(0, 6)
    : [];

  if (list.length === 0 && !isCustom) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("colors.editTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("colors.seNotFound")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const validHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v.trim());

  const save = () => {
    const next = hex.trim().toLowerCase();
    if (!validHex(next)) {
      toast.error(t("colors.invalidHex"));
      return;
    }
    if (next !== displayHex) {
      renameColor(displayHex, next);
      toast.success(t("colors.seSaved"));
      router.push(`/dashboard/products/colors/${encodeURIComponent(next)}/edit`);
    } else {
      toast.success(t("colors.seSaved"));
    }
  };

  const remove = () => {
    removeCustomColor(displayHex);
    toast.success(t("colors.seDeleted"));
    router.push("/dashboard/products/colors");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("colors.editTitle")} · ${displayHex}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/products/colors">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("products.epBack")}
              </Button>
            </Link>
            {isCustom ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-card text-destructive hover:text-destructive"
                onClick={remove}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("colors.seDelete")}
              </Button>
            ) : null}
            <Button size="sm" className="gap-1.5" onClick={save}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("colors.seSave")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("attributes.seProducts")}
          value={String(list.length)}
          delta={0}
          icon={Package}
        />
        <StatCard
          label={t("attributes.seStock")}
          value={String(totalStock)}
          delta={0}
          icon={Package}
          iconClassName="bg-secondary/15 text-secondary"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={t("colors.editTitle")}>
          <Field label={t("colors.seName")}>
            <div className="flex items-center gap-2">
              <label
                className="relative block size-8 shrink-0 cursor-pointer overflow-hidden border border-black/10"
                style={{ backgroundColor: validHex(hex) ? hex : "transparent" }}
                title={t("colors.addColor")}
              >
                <Pipette className="absolute inset-0 m-auto size-4 text-white drop-shadow" aria-hidden="true" />
                <input
                  type="color"
                  value={validHex(hex) ? hex.toLowerCase() : "#ff8000"}
                  onChange={(e) => setHex(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={t("colors.addColor")}
                />
              </label>
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="bg-card font-mono font-bold uppercase"
              />
              <Button size="sm" className="h-8 shrink-0 gap-1.5" onClick={save}>
                <Save className="size-3.5" aria-hidden="true" />
                {t("colors.seSave")}
              </Button>
            </div>
          </Field>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => setHex(s.hex)}
                  className="inline-flex items-center gap-1.5 border border-border bg-card px-2 py-1 text-[11px] font-semibold transition-colors hover:border-secondary"
                >
                  <span
                    className="size-3.5 border border-black/10"
                    style={{ backgroundColor: s.hex }}
                    aria-hidden="true"
                  />
                  {s.name}
                  <span className="font-mono text-muted-foreground">{s.hex}</span>
                </button>
              ))}
            </div>
          ) : null}
          <Field label={t("attributes.seColors")}>
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHex(preset)}
                  aria-label={preset}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  className={`aspect-square border transition-transform hover:scale-110 ${
                    hex.toLowerCase() === preset ? "border-secondary ring-2 ring-secondary" : "border-black/10"
                  }`}
                />
              ))}
            </div>
          </Field>
          <div className="grid gap-3 border-t border-border pt-3 text-xs sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.colAuthor")}
              </span>
              <span className="font-semibold">{metaAuthor}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.metaCreated")}
              </span>
              <span className="font-medium">{metaDate(meta?.createdAt ?? "")}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("attributes.metaUpdated")}
              </span>
              <span className="font-medium">{metaDate(meta?.updatedAt ?? "")}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={`${t("colors.viewTitle")} · ${displayHex}`}
          action={
            <Badge variant="outline" className="font-bold">
              {list.length}
            </Badge>
          }
        >
          <div className="flex flex-col divide-y divide-border border border-border">
            {list.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/products/${p.id}/edit`}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.category}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-secondary">{p.stock}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
