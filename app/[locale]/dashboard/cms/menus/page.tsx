"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ChevronDown,
  ListTree,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { MenuItem } from "@/features/admin/cms";
import { useCmsMenus, useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ITEM_TYPES = ["Page", "Category", "Product", "Product Category", "Blog", "Blog Category", "Custom URL"];

let uid = 100;
const nextId = () => `mi-${Date.now().toString(36)}-${uid++}`;

export default function MenusPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const menus = useCmsMenus();
  const store = useCmsStore();

  const [activeMenu, setActiveMenu] = useState(menus[0]?.id ?? "");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["mi2"]));
  const [itemDialog, setItemDialog] = useState<null | { parentId: string | null; editId?: string }>(null);
  const [confirmId, setConfirmId] = useState<{ menuId: string; itemId: string } | null>(null);
  const [fLabel, setFLabel] = useState("");
  const [fUrl, setFUrl] = useState("/");
  const [fType, setFType] = useState(ITEM_TYPES[0]);
  const [fNewTab, setFNewTab] = useState(false);
  const [fIcon, setFIcon] = useState("");
  const [fVisible, setFVisible] = useState(true);
  const [fCss, setFCss] = useState("");

  const menu = menus.find((m) => m.id === activeMenu) ?? menus[0];
  if (!menu) return null;

  const updateItems = (items: MenuItem[]) => store.saveMenu({ ...menu, items, updated: "2026-09-26" });

  const openAdd = (parentId: string | null) => {
    setItemDialog({ parentId });
    setFLabel(""); setFUrl("/"); setFType(ITEM_TYPES[0]);
    setFNewTab(false); setFIcon(""); setFVisible(true); setFCss("");
  };

  const findItem = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      const found = findItem(item.children, id);
      if (found) return found;
    }
    return null;
  };

  const openEdit = (id: string) => {
    const item = findItem(menu.items, id);
    if (!item) return;
    setItemDialog({ parentId: null, editId: id });
    setFLabel(item.label); setFUrl(item.url); setFType(item.type);
    setFNewTab(item.newTab); setFIcon(item.icon); setFVisible(item.visible); setFCss(item.css);
  };

  const saveItem = () => {
    if (!fLabel.trim() || !fUrl.trim()) return;
    if (itemDialog?.editId) {
      const patch = (items: MenuItem[]): MenuItem[] =>
        items.map((x) =>
          x.id === itemDialog.editId
            ? { ...x, label: fLabel.trim(), url: fUrl.trim(), type: fType, newTab: fNewTab, icon: fIcon.trim(), visible: fVisible, css: fCss.trim() }
            : { ...x, children: patch(x.children) }
        );
      updateItems(patch(menu.items));
      toast.success(t("toastUpdated"));
    } else {
      const fresh: MenuItem = {
        id: nextId(), label: fLabel.trim(), url: fUrl.trim(), type: fType,
        newTab: fNewTab, icon: fIcon.trim(), visible: fVisible, css: fCss.trim(), children: [],
      };
      if (!itemDialog?.parentId) {
        updateItems([...menu.items, fresh]);
      } else {
        const add = (items: MenuItem[]): MenuItem[] =>
          items.map((x) => (x.id === itemDialog.parentId ? { ...x, children: [...x.children, fresh] } : { ...x, children: add(x.children) }));
        updateItems(add(menu.items));
      }
      toast.success(t("toastCreated"));
    }
    setItemDialog(null);
  };

  const removeItem = (menuId: string, itemId: string) => {
    const m = menus.find((x) => x.id === menuId);
    if (!m) return;
    const strip = (items: MenuItem[]): MenuItem[] =>
      items.filter((x) => x.id !== itemId).map((x) => ({ ...x, children: strip(x.children) }));
    store.saveMenu({ ...m, items: strip(m.items), updated: "2026-09-26" });
    setConfirmId(null);
    toast.success(t("toastDeleted", { count: 1 }));
  };

  const moveItem = (menuId: string, itemId: string, dir: -1 | 1, siblings: MenuItem[]) => {
    const m = menus.find((x) => x.id === menuId);
    if (!m) return;
    const idx = siblings.findIndex((x) => x.id === itemId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= siblings.length) return;
    const reorder = (items: MenuItem[]): MenuItem[] => {
      const i = items.findIndex((x) => x.id === itemId);
      if (i >= 0) {
        const next = [...items];
        [next[i], next[i + dir]] = [next[i + dir], next[i]];
        return next;
      }
      return items.map((x) => ({ ...x, children: reorder(x.children) }));
    };
    store.saveMenu({ ...m, items: reorder(m.items), updated: "2026-09-26" });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderItems = (items: MenuItem[], depth: number): React.ReactNode => (
    <div className={cn("flex flex-col gap-2", depth > 0 && "ml-4 border-l-2 border-secondary/30 pl-2")}>
      {items.map((item) => {
        const open = expanded.has(item.id);
        return (
          <div key={item.id} className={cn("border border-border bg-card", !item.visible && "opacity-60")}>
            <div className="flex items-center gap-2 px-3 py-2">
              {item.children.length > 0 ? (
                <button type="button" onClick={() => toggleExpand(item.id)} aria-expanded={open} aria-label={item.label} className="flex size-6 items-center justify-center text-muted-foreground hover:text-secondary">
                  <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
                </button>
              ) : (
                <span className="size-6 shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{item.label}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{item.type} · {item.url}{item.newTab ? " · ↗" : ""}</span>
              </span>
              {!item.visible ? (
                <Badge className="bg-muted text-[10px] font-bold text-muted-foreground">{t("inactive")}</Badge>
              ) : null}
              <span className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm" onClick={() => openAdd(item.id)} aria-label={`${t("addItem")} ${item.label}`} title={t("addItem")}>
                  <Plus className="size-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => moveItem(menu.id, item.id, -1, items)} aria-label={`${t("moveUp")} ${item.label}`} title={t("moveUp")}>
                  <span className="text-xs font-bold" aria-hidden="true">↑</span>
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => moveItem(menu.id, item.id, 1, items)} aria-label={`${t("moveDown")} ${item.label}`} title={t("moveDown")}>
                  <span className="text-xs font-bold" aria-hidden="true">↓</span>
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item.id)} aria-label={`${t("editTitle")} ${item.label}`} title={t("editTitle")}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    const patch = (list: MenuItem[]): MenuItem[] =>
                      list.map((x) => (x.id === item.id ? { ...x, visible: !x.visible } : { ...x, children: patch(x.children) }));
                    updateItems(patch(menu.items));
                  }}
                  aria-label={item.label}
                >
                  <Power className={cn("size-3.5", item.visible ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId({ menuId: menu.id, itemId: item.id })} aria-label={item.label}>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </span>
            </div>
            {open && item.children.length > 0 ? renderItems(item.children, depth + 1) : null}
          </div>
        );
      })}
    </div>
  );

  const countItems = (items: MenuItem[]): number =>
    items.reduce((n, x) => n + 1 + countItems(x.children), 0);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("mnTitle")}
        subtitle={t("mnSubtitle", { count: menus.length })}
        highlightLabel={t("tItems")}
        highlightValue={String(menus.reduce((n, m) => n + countItems(m.items), 0))}
        highlightIcon={ListTree}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("tMenu")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {menus.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMenu(m.id)}
                aria-pressed={m.id === menu.id}
                className={cn("flex items-center gap-2 border px-3 py-2.5 text-left text-sm transition-colors", m.id === menu.id ? "border-secondary bg-secondary/10 font-bold text-secondary" : "border-border hover:bg-muted")}
              >
                <ListTree className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{m.name}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">{m.location} · {countItems(m.items)} {t("tItems")}</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">
              {menu.name}
              <span className="pl-2 text-xs font-semibold text-muted-foreground">{menu.location} · {menu.updated}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 gap-1.5" onClick={() => openAdd(null)}>
                <Plus className="size-3.5" aria-hidden="true" />
                {t("addItem")}
              </Button>
              <Button variant="outline" size="sm" className="h-8 bg-card" onClick={() => toast.success(t("toastSaved"))}>
                {t("saveMenu")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {menu.items.length > 0 ? (
              renderItems(menu.items, 0)
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("emptyMenus")}</p>
            )}
            <div className="border border-dashed border-secondary/40 bg-secondary/5 p-4">
              <p className="pb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{t("preview")}</p>
              <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold" aria-label={menu.name}>
                {menu.items.filter((i) => i.visible).map((i) => (
                  <span key={i.id} className="hover:text-secondary hover:underline">{i.label}</span>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!itemDialog} onOpenChange={(open) => !open && setItemDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {itemDialog?.editId ? t("editTitle") : t("addItem")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fLabel")}>
              <Input value={fLabel} onChange={(e) => setFLabel(e.target.value)} className="bg-card" placeholder="Shop" />
            </Field>
            <Field label={t("fUrl")}>
              <Input value={fUrl} onChange={(e) => setFUrl(e.target.value)} className="bg-card font-mono" />
            </Field>
            <Field label={t("fType")}>
              <Select value={fType} onValueChange={(v) => setFType(v ?? ITEM_TYPES[0])}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fIcon")}>
              <Input value={fIcon} onChange={(e) => setFIcon(e.target.value)} className="bg-card" placeholder="home" />
            </Field>
            <Field label={t("fCss")}>
              <Input value={fCss} onChange={(e) => setFCss(e.target.value)} className="bg-card" />
            </Field>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={fNewTab} onCheckedChange={(v) => setFNewTab(v === true)} aria-label={t("fUrl")} />
                ↗
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={fVisible} onCheckedChange={(v) => setFVisible(v === true)} aria-label={t("fVisible")} />
                {t("fVisible")}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setItemDialog(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={saveItem}>{t("saveBtn")}</Button>
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
            <Button size="sm" variant="destructive" onClick={() => confirmId && removeItem(confirmId.menuId, confirmId.itemId)}>
              {t("confirmBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
