"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductsTable } from "@/components/admin/products/ProductsTable";
import { products } from "@/features/shop/products";
import { Link } from "@/i18n/navigation";
import { useAdminProductsStore } from "@/store/admin-products.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardProductsPage() {
  const t = useTranslations("Dashboard.admin");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"publish" | "draft" | "delete">("publish");
  const [statusTab, setStatusTab] = useState<"all" | "published" | "draft" | "trash">("all");

  const fields = useAdminProductsStore((s) => s.fields);
  const activeMap = useAdminProductsStore((s) => s.active);
  const deleted = useAdminProductsStore((s) => s.deleted);
  const purged = useAdminProductsStore((s) => s.purged);
  const custom = useAdminProductsStore((s) => s.custom);
  const setActiveState = useAdminProductsStore((s) => s.setActiveState);
  const softDelete = useAdminProductsStore((s) => s.softDelete);
  const restore = useAdminProductsStore((s) => s.restore);
  const purge = useAdminProductsStore((s) => s.purge);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category ?? "Women"))],
    []
  );

  const visible = useMemo(() => {
    const seen = new Set<string>();
    return [...custom, ...products]
      .map((p) => ({
        ...p,
        ...(fields[p.id] ?? {}),
        isActive: activeMap[p.id] ?? p.isActive,
      }))
      .filter((p) => {
        if (purged.includes(p.id) || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [custom, fields, activeMap, purged]);

  const counts = useMemo(
    () => ({
      all: visible.filter((p) => !deleted.includes(p.id)).length,
      published: visible.filter((p) => !deleted.includes(p.id) && p.isActive).length,
      draft: visible.filter((p) => !deleted.includes(p.id) && !p.isActive).length,
      trash: visible.filter((p) => deleted.includes(p.id)).length,
    }),
    [visible, deleted]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((p) => {
      const trashed = deleted.includes(p.id);
      if (statusTab === "trash" && !trashed) return false;
      if (statusTab !== "trash" && trashed) return false;
      if (statusTab === "published" && !p.isActive) return false;
      if (statusTab === "draft" && p.isActive) return false;
      if (category !== "all" && (p.category ?? "Women") !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
    });
  }, [visible, query, category, statusTab, deleted]);

  const handleToggleActive = (ids: string[], active: boolean) => {
    setActiveState(ids, active);
    toast.success(
      active
        ? t("products.toastPublished", { count: ids.length })
        : t("products.toastDrafted", { count: ids.length })
    );
  };

  const handleDelete = (ids: string[]) => {
    softDelete(ids);
    toast.success(t("products.toastDeleted", { count: ids.length }));
  };

  const handleRestore = (ids: string[]) => {
    restore(ids);
    toast.success(t("products.toastRestored", { count: ids.length }));
  };

  const handlePurge = (ids: string[]) => {
    purge(ids);
    toast.success(t("products.toastPurged", { count: ids.length }));
  };

  const applyBulkAction = () => {
    const ids = [...selected].filter((id) => filtered.some((p) => p.id === id));
    if (ids.length === 0) {
      toast.error(t("products.toastNoSelection"));
      return;
    }
    if (statusTab === "trash") {
      if (bulkAction === "delete") {
        handlePurge(ids);
      } else {
        const active = bulkAction === "publish";
        restore(ids);
        setActiveState(ids, active);
        toast.success(
          active
            ? t("products.toastPublished", { count: ids.length })
            : t("products.toastDrafted", { count: ids.length })
        );
      }
    } else if (bulkAction === "publish") handleToggleActive(ids, true);
    else if (bulkAction === "draft") handleToggleActive(ids, false);
    else handleDelete(ids);
    setSelected(new Set());
  };

  const tabs = [
    { key: "all", label: t("products.tabAll"), count: counts.all },
    { key: "published", label: t("products.tabPublished"), count: counts.published },
    { key: "draft", label: t("products.tabDraft"), count: counts.draft },
    { key: "trash", label: t("products.tabTrash"), count: counts.trash },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("products.title")}
        description={t("products.subtitle", { count: filtered.length })}
        actions={
          <Link href="/dashboard/products/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" aria-hidden="true" />
              {t("products.addProduct")}
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("products.searchPlaceholder")}
            className="bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={bulkAction}
            onValueChange={(v) => setBulkAction((v ?? "publish") as typeof bulkAction)}
          >
            <SelectTrigger className="w-40 bg-card" aria-label={t("products.bulkAction")}>
              <SelectValue placeholder={t("products.bulkAction")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publish">{t("products.bulkPublish")}</SelectItem>
              <SelectItem value="draft">{t("products.bulkDraft")}</SelectItem>
              <SelectItem value="delete">{t("products.bulkDelete")}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8" onClick={applyBulkAction}>
            {t("products.bulkApply")}
          </Button>
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full bg-card sm:w-48">
            <SelectValue placeholder={t("products.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("products.allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {tabs.map((tab, i) => (
          <span key={tab.key} className="flex items-center gap-1">
            {i > 0 ? <span className="text-border" aria-hidden="true">|</span> : null}
            <button
              type="button"
              onClick={() => {
                setStatusTab(tab.key);
                setSelected(new Set());
              }}
              aria-current={statusTab === tab.key ? "true" : undefined}
              className={cn(
                "px-1 font-medium transition-colors",
                statusTab === tab.key ? "font-bold text-secondary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="text-muted-foreground"> ({tab.count})</span>
            </button>
          </span>
        ))}
      </div>

      <ProductsTable
        items={filtered}
        view={statusTab === "trash" ? "trash" : "active"}
        selected={selected}
        onSelectionChange={setSelected}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onPurge={handlePurge}
      />
    </div>
  );
}
