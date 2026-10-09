"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Check, Eye, Pencil, Play, Plus, Search, Trash2, Users, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import { ConfirmDialog, SettingToggle } from "@/components/admin/settings/shared";
import type { AdminUser } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const admins = useSettingsStore((s) => s.admins);
  const roles = useSettingsStore((s) => s.roles);
  const store = useSettingsStore();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fFirst, setFFirst] = useState("");
  const [fLast, setFLast] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fRole, setFRole] = useState("");
  const [fWelcome, setFWelcome] = useState(true);
  const [fRequirePwd, setFRequirePwd] = useState(false);
  const [f2fa, setF2fa] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return admins.filter(
      (a) =>
        (roleFilter === "all" || a.role === roleFilter) &&
        (!q || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    );
  }, [admins, query, roleFilter]);
  const activeSelected = useMemo(
    () => [...selected].filter((id) => admins.some((a) => a.id === id)),
    [selected, admins]
  );

  const openAdd = () => {
    setEditId(null);
    setFFirst(""); setFLast(""); setFEmail(""); setFPhone("");
    setFRole(roles[0]?.name ?? "Admin");
    setFWelcome(true); setFRequirePwd(false); setF2fa(false);
    setDialogOpen(true);
  };

  const openEdit = (a: AdminUser) => {
    setEditId(a.id);
    setFFirst(a.firstName); setFLast(a.lastName); setFEmail(a.email); setFPhone(a.phone);
    setFRole(a.role); setFWelcome(a.welcomeEmail); setFRequirePwd(a.requirePwdChange); setF2fa(a.twoFactor);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fFirst.trim() || !fEmail.trim() || !fEmail.includes("@")) {
      toast.error(t("fEmail"));
      return;
    }
    if (editId) {
      store.patchAdmin(editId, {
        firstName: fFirst.trim(), lastName: fLast.trim(), email: fEmail.trim(), phone: fPhone.trim(),
        role: fRole, welcomeEmail: fWelcome, requirePwdChange: fRequirePwd, twoFactor: f2fa,
      });
      toast.success(t("toastUpdated"));
    } else {
      if (admins.some((a) => a.email.toLowerCase() === fEmail.trim().toLowerCase())) {
        toast.error(t("fEmail"));
        return;
      }
      store.addAdmin({
        id: `ad-${admins.length + 1}`,
        firstName: fFirst.trim(), lastName: fLast.trim(), email: fEmail.trim(), phone: fPhone.trim(),
        role: fRole, status: "active", lastLogin: "—", created: "2026-09-26",
        twoFactor: f2fa, pwdChanged: "2026-09-26", sessions: 0,
        welcomeEmail: fWelcome, requirePwdChange: fRequirePwd,
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const viewed = viewId ? (admins.find((a) => a.id === viewId) ?? null) : null;
  const viewedPerms = viewed ? (roles.find((r) => r.name === viewed.role)?.permissions ?? {}) : {};

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("adTitle")}
        subtitle={t("adSubtitle", { count: filtered.length })}
        highlightLabel={t("ovAdmins")}
        highlightValue={String(admins.filter((a) => a.status === "active").length)}
        highlightIcon={Users}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addAdmin")}
        </button>
      </AccountingHero>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("fRole")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {activeSelected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label={t("viewAll")}>
              <X className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold">{activeSelected.length} items selected</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" onClick={() => {
                for (const id of activeSelected) store.patchAdmin(id, { status: "active" });
                setSelected(new Set());
                toast.success(t("toastUpdated"));
              }}>
                <Check className="size-3.5" aria-hidden="true" />
                {t("active")}
              </Button>
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
                      checked={filtered.length > 0 && filtered.every((a) => selected.has(a.id))}
                      indeterminate={filtered.some((a) => selected.has(a.id)) && !filtered.every((a) => selected.has(a.id))}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          for (const a of filtered) {
                            if (v === true) next.add(a.id);
                            else next.delete(a.id);
                          }
                          return next;
                        });
                      }}
                      aria-label={t("adTitle")}
                    />
                  </TableHead>
                  <TableHead>{t("tAdmin")}</TableHead>
                  <TableHead>{t("tRole")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tLastLogin")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className={cn(selected.has(a.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(a.id);
                        else next.delete(a.id);
                        return next;
                      })} aria-label={a.email} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CustomerAvatar name={`${a.firstName} ${a.lastName}`} size="sm" />
                        <div>
                          <p className="text-sm font-semibold whitespace-nowrap">{a.firstName} {a.lastName}</p>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/20 font-semibold whitespace-nowrap text-[#8a5a00]">{a.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", a.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(a.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{a.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(a.id)} aria-label={`${t("viewTitle")} ${a.email}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label={`${t("editTitle")} ${a.email}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        {a.status === "active" ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchAdmin(a.id, { status: "inactive" }); toast.success(t("toastUpdated")); }} aria-label={a.email} title={a.email}>
                            <Play className="size-4 rotate-180 text-[#8a5a00]" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => { store.patchAdmin(a.id, { status: "active" }); toast.success(t("toastUpdated")); }} aria-label={a.email} title={a.email}>
                            <Play className="size-4 text-green-600" aria-hidden="true" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmIds([a.id])} aria-label={a.email}>
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

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <CustomerAvatar name={`${viewed.firstName} ${viewed.lastName}`} size="sm" />
                  {viewed.firstName} {viewed.lastName}
                  <Badge className="bg-primary/20 text-[10px] font-bold text-[#8a5a00]">{viewed.role}</Badge>
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="profile">
                <TabsList className="flex w-full flex-wrap">
                  <TabsTrigger value="profile">{t("tabProfile")}</TabsTrigger>
                  <TabsTrigger value="security">{t("tabSecurity")}</TabsTrigger>
                  <TabsTrigger value="activity">{t("tabActivity")}</TabsTrigger>
                  <TabsTrigger value="permissions">{t("tabPermissions")}</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="flex flex-col divide-y divide-border pt-2 text-sm">
                  <ProfileKV label={t("fEmail")} value={viewed.email} />
                  <ProfileKV label={t("fPhone")} value={viewed.phone} />
                  <ProfileKV label={t("tRole")} value={viewed.role} />
                  <ProfileKV label={t("tStatus")} value={viewed.status} />
                  <ProfileKV label={t("tCreated")} value={viewed.created} />
                  <ProfileKV label={t("tLastLogin")} value={viewed.lastLogin} />
                </TabsContent>
                <TabsContent value="security" className="flex flex-col divide-y divide-border pt-2 text-sm">
                  <ProfileKV label={t("f2faUser")} value={viewed.twoFactor ? t("on") : t("off")} />
                  <ProfileKV label={t("pwdChanged")} value={viewed.pwdChanged} />
                  <ProfileKV label={t("activeSessions")} value={String(viewed.sessions)} />
                </TabsContent>
                <TabsContent value="activity" className="pt-2 text-sm text-muted-foreground">
                  {t("tLastLogin")}: {viewed.lastLogin}
                </TabsContent>
                <TabsContent value="permissions" className="flex flex-col gap-1.5 pt-2">
                  {Object.entries(viewedPerms).length > 0 ? (
                    Object.entries(viewedPerms).map(([module, actions]) => (
                      <div key={module} className="border border-border px-3 py-2">
                        <p className="text-xs font-bold">{module}</p>
                        <p className="text-xs text-muted-foreground">{(actions as string[]).join(" · ")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-2 text-center text-sm text-muted-foreground">{t("emptyTitle")}</p>
                  )}
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={() => { setViewId(null); openEdit(viewed); }}>{t("editTitle")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addAdmin")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fFirstName")}>
              <Input value={fFirst} onChange={(e) => setFFirst(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fLastName")}>
              <Input value={fLast} onChange={(e) => setFLast(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fEmail")}>
              <Input value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="bg-card" type="email" />
            </Field>
            <Field label={t("fPhone")}>
              <Input value={fPhone} onChange={(e) => setFPhone(e.target.value)} className="bg-card font-mono" />
            </Field>
            <Field label={t("tRole")}>
              <Select value={fRole} onValueChange={(v) => setFRole(v ?? roles[0]?.name ?? "Admin")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <SettingToggle label={t("fWelcome")} checked={fWelcome} onChange={setFWelcome} />
            <SettingToggle label={t("fRequirePwd")} checked={fRequirePwd} onChange={setFRequirePwd} />
            <SettingToggle label={t("f2faUser")} checked={f2fa} onChange={setF2fa} />
          </div>
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
          if (confirmIds) store.removeAdmins(confirmIds);
          setConfirmIds(null);
          setSelected(new Set());
          toast.success(t("toastDeleted", { count: confirmIds?.length ?? 0 }));
        }}
      />
    </div>
  );
}

function ProfileKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}
