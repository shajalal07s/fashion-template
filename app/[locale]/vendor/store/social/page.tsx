"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { STORE_RULES, socialSchema } from "@/features/vendor/store-mgmt";
import { useStoreSocials, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorStoreSocialPage() {
  const t = useTranslations("Dashboard.Vendor");
  const socials = useStoreSocials();
  const store = useVendorStore();

  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string>(STORE_RULES.socialPlatforms[0]);
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const used = new Set(socials.map((s) => s.platform));
  const options = STORE_RULES.socialPlatforms.filter((p) => !used.has(p) || socials.find((s) => s.id === editing)?.platform === p);

  const save = () => {
    const parsed = socialSchema.safeParse({ platform, url: url.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid social link");
      return;
    }
    setError("");
    if (editing) {
      store.patchSocial(editing, { platform, url: url.trim() });
      store.logStoreActivity(`Social link updated (${platform})`);
    } else {
      store.addSocial({ id: `so-${Date.now()}`, platform, url: url.trim(), enabled: true });
      store.logStoreActivity(`Social link added (${platform})`);
    }
    store.notifyVendor("Social links updated.", "info");
    setOpen(false);
    setEditing(null);
    setUrl("");
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smSocial")} subtitle={`${socials.filter((s) => s.enabled).length}/${socials.length} ${t("smEnabled")}`}
        highlightLabel={t("smSocial")} highlightValue={String(socials.length)} highlightIcon={Link2}
      />

      <StoreTabs />

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setPlatform(options[0] ?? STORE_RULES.socialPlatforms[0]); setUrl(""); setError(""); setOpen(true); }}>
          <Plus className="size-4" aria-hidden="true" />
          {t("smAddSocial")}
        </Button>
      </div>

      {socials.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {socials.map((s) => (
            <Card key={s.id} className={cn("border-border bg-card", !s.enabled && "opacity-70")}>
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{s.platform}</CardTitle>
                <span className={cn("px-2 py-0.5 text-[11px] font-bold", s.enabled ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                  {s.enabled ? t("smEnabled") : t("smDisabled")}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 px-4 pb-4">
                <a href={s.url} target="_blank" rel="noreferrer" className="truncate font-mono text-xs font-bold text-secondary hover:underline">
                  {s.url}
                </a>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { store.patchSocial(s.id, { enabled: !s.enabled }); store.logStoreActivity(`Social link ${s.enabled ? "disabled" : "enabled"} (${s.platform})`); toast.success(t("toastSaved")); }}>
                    <Power className="size-3" aria-hidden="true" />
                    {s.enabled ? t("smDisabled") : t("smEnabled")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { setEditing(s.id); setPlatform(s.platform); setUrl(s.url); setError(""); setOpen(true); }}>
                    <Pencil className="size-3" aria-hidden="true" />
                    {t("poEdit")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px] text-destructive" onClick={() => { store.removeSocial(s.id); store.logStoreActivity(`Social link removed (${s.platform})`); toast.success(t("toastSaved")); }}>
                    <Trash2 className="size-3" aria-hidden="true" />
                    {t("poDelete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <EmptyState icon={Link2} title={t("cpEmpty")} description={t("cpEmptyDesc")} />
            <Button size="sm" onClick={() => setOpen(true)}>{t("smAddSocial")}</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("smAddSocial")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("smPlatform")}>
              <Select value={platform} onValueChange={(v) => setPlatform(v ?? STORE_RULES.socialPlatforms[0])}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("smUrl")}>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/yourstore" inputMode="url" className="bg-card font-mono" />
            </Field>
            {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); setEditing(null); }}>{t("cancel")}</Button>
              <Button size="sm" onClick={save}>{t("saveBtn")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
