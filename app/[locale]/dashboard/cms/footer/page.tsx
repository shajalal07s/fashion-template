"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Globe,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { FooterColumn, SocialLink } from "@/features/admin/cms";
import { useCmsStore } from "@/store/cms.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NETWORKS = ["Facebook", "Instagram", "YouTube", "TikTok", "LinkedIn", "X/Twitter", "Pinterest"];

export default function FooterManagementPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const footer = useCmsStore((s) => s.footer);
  const store = useCmsStore();

  const [colDialog, setColDialog] = useState<null | { editId?: string }>(null);
  const [cTitle, setCTitle] = useState("");
  const [cLinks, setCLinks] = useState("");
  const [socialDialog, setSocialDialog] = useState<null | { editId?: string }>(null);
  const [sNetwork, setSNetwork] = useState(NETWORKS[0]);
  const [sUrl, setSUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const save = () => toast.success(t("toastSaved"));

  const openColAdd = () => {
    setColDialog({});
    setCTitle(""); setCLinks("");
  };
  const openColEdit = (c: FooterColumn) => {
    setColDialog({ editId: c.id });
    setCTitle(c.title); setCLinks(c.links.join(", "));
  };
  const saveColumn = () => {
    if (!cTitle.trim()) return;
    const links = cLinks.split(",").map((x) => x.trim()).filter(Boolean);
    if (colDialog?.editId) {
      store.patchColumn(colDialog.editId, { title: cTitle.trim(), links });
      toast.success(t("toastUpdated"));
    } else {
      const maxOrder = footer.columns.reduce((n, c) => Math.max(n, c.order), 0);
      store.patchFooter({
        columns: [...footer.columns, { id: `fc-${footer.columns.length + 1}`, title: cTitle.trim(), links, visible: true, order: maxOrder + 1 }],
      });
      toast.success(t("toastCreated"));
    }
    setColDialog(null);
  };

  const moveColumn = (c: FooterColumn, dir: -1 | 1) => {
    const ordered = [...footer.columns].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((x) => x.id === c.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    store.patchColumn(c.id, { order: swap.order });
    store.patchColumn(swap.id, { order: c.order });
  };

  const openSocialAdd = () => {
    setSocialDialog({});
    setSNetwork(NETWORKS[0]); setSUrl("");
  };
  const openSocialEdit = (s: SocialLink) => {
    setSocialDialog({ editId: s.id });
    setSNetwork(s.network); setSUrl(s.url);
  };
  const saveSocial = () => {
    if (socialDialog?.editId) {
      store.patchSocial(socialDialog.editId, { network: sNetwork, url: sUrl.trim() });
      toast.success(t("toastUpdated"));
    } else {
      const maxOrder = footer.socials.reduce((n, s) => Math.max(n, s.order), 0);
      store.patchFooter({
        socials: [...footer.socials, { id: `so-${footer.socials.length + 1}`, network: sNetwork, url: sUrl.trim(), visible: true, order: maxOrder + 1 }],
      });
      toast.success(t("toastCreated"));
    }
    setSocialDialog(null);
  };

  const visibleCols = [...footer.columns].sort((a, b) => a.order - b.order).filter((c) => c.visible);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("ftTitle")}
        subtitle={t("ftSubtitle")}
        highlightLabel={t("ftColumns")}
        highlightValue={String(footer.columns.length)}
        highlightIcon={Globe}
      >
        <button type="button" onClick={() => setPreviewOpen(true)} className={heroPillClassName}>
          <Eye className="size-3.5" aria-hidden="true" />
          {t("preview")}
        </button>
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("ftLogo")}>
          <Field label={t("ftLogo")}>
            <Input value={footer.logo} onChange={(e) => store.patchFooter({ logo: e.target.value })} className="bg-card font-mono" />
          </Field>
          <Field label={t("fAbout")}>
            <Input value={footer.about} onChange={(e) => store.patchFooter({ about: e.target.value })} className="bg-card" />
          </Field>
        </SectionCard>

        <SectionCard title={t("ftContact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fEmail")}>
              <Input value={footer.email} onChange={(e) => store.patchFooter({ email: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fPhone")}>
              <Input value={footer.phone} onChange={(e) => store.patchFooter({ phone: e.target.value })} className="bg-card font-mono" />
            </Field>
          </div>
          <Field label={t("fAddress")}>
            <Input value={footer.address} onChange={(e) => store.patchFooter({ address: e.target.value })} className="bg-card" />
          </Field>
        </SectionCard>

        <SectionCard
          title={t("ftColumns")}
          action={
            <Button size="sm" className="h-8 gap-1.5" onClick={openColAdd}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("addColumn")}
            </Button>
          }
        >
          {footer.columns.map((c) => (
            <div key={c.id} className={cn("border border-border bg-card p-3", !c.visible && "opacity-60")}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.links.join(" · ")}</span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => moveColumn(c, -1)} aria-label={`${t("moveUp")} ${c.title}`} title={t("moveUp")}>
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => moveColumn(c, 1)} aria-label={`${t("moveDown")} ${c.title}`} title={t("moveDown")}>
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openColEdit(c)} aria-label={`${t("editTitle")} ${c.title}`} title={t("editTitle")}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => store.patchColumn(c.id, { visible: !c.visible })} aria-label={c.title}>
                  <Power className={cn("size-3.5", c.visible ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    store.patchFooter({ columns: footer.columns.filter((x) => x.id !== c.id) });
                    toast.success(t("toastDeleted", { count: 1 }));
                  }}
                  aria-label={c.title}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          title={t("ftSocial")}
          action={
            <Button size="sm" className="h-8 gap-1.5" onClick={openSocialAdd}>
              <Plus className="size-3.5" aria-hidden="true" />
              {t("addColumn")}
            </Button>
          }
        >
          {footer.socials.map((s) => (
            <div key={s.id} className={cn("flex items-center gap-2 border border-border bg-card px-3 py-2", !s.visible && "opacity-60")}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.network}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{s.url || "—"}</span>
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => openSocialEdit(s)} aria-label={`${t("editTitle")} ${s.network}`} title={t("editTitle")}>
                <Pencil className="size-3.5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => store.patchSocial(s.id, { visible: !s.visible })} aria-label={s.network}>
                <Power className={cn("size-3.5", s.visible ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
              </Button>
            </div>
          ))}
        </SectionCard>

        <SectionCard title={t("ftPayments")}>
          <label className="flex cursor-pointer items-center justify-between gap-4 border border-border px-3 py-2.5 text-sm font-medium">
            {t("fNewsletter")}
            <Checkbox checked={footer.newsletter} onCheckedChange={(v) => store.patchFooter({ newsletter: v === true })} aria-label={t("fNewsletter")} />
          </label>
          <Field label={t("ftPayments")}>
            <Input
              value={footer.payments.join(", ")}
              onChange={(e) => store.patchFooter({ payments: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              className="bg-card"
            />
          </Field>
        </SectionCard>

        <SectionCard title={t("ftCopyright")}>
          <Field label={t("fCopyright")}>
            <Input value={footer.copyright} onChange={(e) => store.patchFooter({ copyright: e.target.value })} className="bg-card" />
          </Field>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>

      <Dialog open={!!colDialog} onOpenChange={(open) => !open && setColDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {colDialog?.editId ? t("editTitle") : t("addColumn")}
            </DialogTitle>
          </DialogHeader>
          <Field label={t("fColTitle")}>
            <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("fColLinks")}>
            <Input value={cLinks} onChange={(e) => setCLinks(e.target.value)} className="bg-card" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setColDialog(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={saveColumn}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!socialDialog} onOpenChange={(open) => !open && setSocialDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("ftSocial")}</DialogTitle>
          </DialogHeader>
          <Field label={t("tMenu")}>
            <Input value={sNetwork} onChange={(e) => setSNetwork(e.target.value)} className="bg-card" list="cms-networks" />
            <datalist id="cms-networks">
              {NETWORKS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label={t("fUrl")}>
            <Input value={sUrl} onChange={(e) => setSUrl(e.target.value)} className="bg-card font-mono" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSocialDialog(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={saveSocial}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("preview")}</DialogTitle>
          </DialogHeader>
          <footer className="bg-[#1a0d00] p-6 text-sm text-white">
            <p className="font-heading text-lg font-bold">Fashion Store</p>
            <p className="pt-1 text-xs text-white/70">{footer.about}</p>
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {visibleCols.map((c) => (
                <div key={c.id}>
                  <p className="pb-1 text-xs font-bold tracking-widest uppercase">{c.title}</p>
                  {c.links.map((l) => (
                    <p key={l} className="py-0.5 text-xs text-white/70">{l}</p>
                  ))}
                </div>
              ))}
            </div>
            <p className="pt-3 text-[11px] text-white/60">{footer.email} · {footer.phone}</p>
            <p className="border-t border-white/15 pt-3 text-[11px] text-white/60">{footer.copyright}</p>
          </footer>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>{t("cancelBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
