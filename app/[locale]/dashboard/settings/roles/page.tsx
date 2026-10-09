"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Check, Pencil, Play, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { ConfirmDialog } from "@/components/admin/settings/shared";
import { PERMISSION_MODULES, type Role } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RolesPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const roles = useSettingsStore((s) => s.roles);
  const store = useSettingsStore();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [perms, setPerms] = useState<Record<string, string[]>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, query]);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => roles.some((r) => r.id === id)),
    [selected, roles]
  );

  const permCount = (r: Role) => Object.values(r.permissions).reduce((n, a) => n + a.length, 0);

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFDesc(""); setPerms({});
    setDialogOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditId(r.id);
    setFName(r.name); setFDesc(r.description);
    setPerms(JSON.parse(JSON.stringify(r.permissions)) as Record<string, string[]>);
    setDialogOpen(true);
  };

  const togglePerm = (module: string, action: string) => {
    setPerms((prev) => {
      const arr = prev[module] ?? [];
      return { ...prev, [module]: arr.includes(action) ? arr.filter((a) => a !== action) : [...arr, action] };
    });
  };

  const toggleModule = (module: string, actions: string[]) => {
    setPerms((prev) => {
      const arr = prev[module] ?? [];
      return { ...prev, [module]: arr.length === actions.length ? [] : [...actions] };
    });
  };

  const selectAll = () => {
    const all: Record<string, string[]> = {};
    for (const m of PERMISSION_MODULES) all[m.module] = [...m.actions];
    setPerms(all);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchRole(editId, { name: fName.trim(), description: fDesc.trim(), permissions: perms, updated: "2026-09-26" });
      toast.success(t("toastUpdated"));
    } else {
      store.addRole({
        id: `rl-${roles.length + 1}`, name: fName.trim(), description: fDesc.trim(),
        users: 0, status: "active", updated: "2026-09-26", permissions: perms,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("rlTitle")}
        subtitle={t("rlSubtitle", { count: roles.length })}
        highlightLabel={t("tPermissions")}
        highlightValue={String(roles.reduce((n, r) => n + permCount(r), 0))}
        highlightIcon={ShieldCheck}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addRole")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-card text-destructive hover:text-destructive" onClick={() => setConfirmIds(activeSelected)}>
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
                      checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))}
                      indeterminate={filtered.some((r) => selected.has(r.id)) && !filtered.every((r) => selected.has(r.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const r of filtered) {
                            if (v === true) next.add(r.id);
                            else next.delete(r.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("rlTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tRole")}</TableHead>
                  <TableHead className="text-center">{t("tUsers")}</TableHead>
                  <TableHead className="text-center">{t("tPermissions")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={cn(selected.has(r.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(r.id);
                        else next.delete(r.id);
                        return next;
                      })} aria-label={r.name} />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{r.name}</p>
                      <p className="max-w-52 truncate text-xs text-muted-foreground" title={r.description}>{r.description}</p>
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold">{r.users}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex size-6 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                        {permCount(r)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(r.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            store.patchRole(r.id, { status: r.status === "active" ? "inactive" : "active" });
                            toast.success(t("toastUpdated"));
                          }}
                          aria-label={r.name}
                        >
                          <Play className={cn("size-4", r.status === "active" ? "rotate-180 text-[#8a5a00]" : "text-green-600")} aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmIds([r.id])} aria-label={r.name}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("emptyTitle")}</div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td:not(:first-child)]:border-l [&_th]:h-10 [&_th]:border-white/25 [&_th]:px-3 [&_th]:text-xs [&_th]:text-white [&_th:not(:first-child)]:border-l">
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>Module</TableHead>
                {["View", "Create", "Edit", "Delete", "Export", "Approve"].map((h) => (
                  <TableHead key={h} className="text-center">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_MODULES.map((m) => (
                <TableRow key={m.module}>
                  <TableCell className="text-xs font-bold whitespace-nowrap">{m.module}</TableCell>
                  {["View", "Create", "Edit", "Delete", "Export", "Approve"].map((h) => {
                    const has = m.actions.some((a) => a.startsWith(h));
                    return (
                      <TableCell key={h} className="text-center">
                        {has ? (
                          <Check className="mx-auto size-4 text-green-600" aria-hidden="true" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addRole")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fRoleName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Manager" />
            </Field>
            <Field label={t("tDesc")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <SectionCard
            title={t("permTitle")}
            action={
              <span className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={selectAll}>{t("selectAll")}</Button>
                <Button variant="outline" size="sm" className="h-7 bg-card text-xs" onClick={() => setPerms({})}>{t("clearAll")}</Button>
              </span>
            }
          >
            {PERMISSION_MODULES.map((m) => {
              const arr = perms[m.module] ?? [];
              const allOn = arr.length === m.actions.length;
              return (
                <div key={m.module} className="border border-border">
                  <button
                    type="button"
                    onClick={() => toggleModule(m.module, m.actions)}
                    aria-pressed={allOn}
                    className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold transition-colors", allOn ? "bg-secondary/10 text-secondary" : "hover:bg-muted")}
                  >
                    <Checkbox checked={allOn} aria-label={m.module} />
                    {m.module}
                    <span className="ml-auto text-[11px] font-semibold text-muted-foreground">{arr.length}/{m.actions.length}</span>
                  </button>
                  <div className="grid gap-1 p-3 sm:grid-cols-2">
                    {m.actions.map((a) => (
                      <label key={a} className="flex cursor-pointer items-center gap-2 text-xs">
                        <Checkbox checked={arr.includes(a)} onCheckedChange={() => togglePerm(m.module, a)} aria-label={`${m.module} ${a}`} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </SectionCard>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmIds}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
        confirmLabel={t("confirmBtn")}
        destructive
        onClose={() => setConfirmIds(null)}
        onConfirm={() => {
          if (confirmIds) store.removeRoles(confirmIds);
          setConfirmIds(null);
          setSelected(new Set());
          toast.success(t("toastDeleted", { count: confirmIds?.length ?? 0 }));
        }}
      />
    </div>
  );
}
