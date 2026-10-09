"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Clock3, Eye, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useCmsStore } from "@/store/cms.store";
import type { DayHours } from "@/features/admin/cms";
import { toast } from "sonner";

export default function ContactManagementPage() {
  const t = useTranslations("Dashboard.cms");
  const ts = useTranslations("Dashboard.sidebar");
  const contact = useCmsStore((s) => s.contact);
  const store = useCmsStore();
  const [previewOpen, setPreviewOpen] = useState(false);

  const save = () => toast.success(t("toastSaved"));
  const set = (patch: Partial<typeof contact>) => store.patchContact(patch);

  const setHours = (day: string, patch: Partial<DayHours>) =>
    set({ hours: contact.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)) });

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("cms")}
        title={t("ctTitle")}
        subtitle={t("ctSubtitle")}
        highlightLabel={t("fPhone")}
        highlightValue={contact.phone}
        highlightIcon={Phone}
      >
        <button type="button" onClick={() => setPreviewOpen(true)} className={heroPillClassName}>
          <Eye className="size-3.5" aria-hidden="true" />
          {t("previewContact")}
        </button>
        <button type="button" onClick={save} className={heroPillClassName}>
          {t("saveBtn")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secCompany")}>
          <Field label={t("fCompany")}>
            <Input value={contact.company} onChange={(e) => set({ company: e.target.value })} className="bg-card" />
          </Field>
          <Field label={t("fTagline")}>
            <Input value={contact.tagline} onChange={(e) => set({ tagline: e.target.value })} className="bg-card" />
          </Field>
        </SectionCard>

        <SectionCard title={t("secContact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fPhone")}>
              <Input value={contact.phone} onChange={(e) => set({ phone: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fPhone2")}>
              <Input value={contact.phone2} onChange={(e) => set({ phone2: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fEmail")}>
              <Input value={contact.email} onChange={(e) => set({ email: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fSupportEmail")}>
              <Input value={contact.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} className="bg-card" />
            </Field>
          </div>
          <Field label={t("fWhatsapp")}>
            <Input value={contact.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} className="bg-card font-mono" />
          </Field>
        </SectionCard>

        <SectionCard title={t("secAddress")}>
          <Field label={t("fAddress")}>
            <Input value={contact.address} onChange={(e) => set({ address: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fCity")}>
              <Input value={contact.city} onChange={(e) => set({ city: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fDivision")}>
              <Input value={contact.division} onChange={(e) => set({ division: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fCountry")}>
              <Input value={contact.country} onChange={(e) => set({ country: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fPostal")}>
              <Input value={contact.postal} onChange={(e) => set({ postal: e.target.value })} className="bg-card font-mono" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secHours")}>
          {contact.hours.map((h) => (
            <div key={h.day} className="flex items-center gap-2 border border-border px-3 py-2">
              <span className="w-24 shrink-0 text-sm font-bold">{h.day}</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={h.open}
                  onChange={(e) => setHours(h.day, { open: e.target.checked })}
                  aria-label={`${h.day} ${t("dayOpen")}`}
                  className="size-4 accent-[#ff8000]"
                />
                {t("dayOpen")}
              </label>
              {h.open ? (
                <span className="ml-auto flex items-center gap-1">
                  <input
                    type="time"
                    value={h.from}
                    onChange={(e) => setHours(h.day, { from: e.target.value })}
                    aria-label={`${h.day} from`}
                    className="h-8 w-24 border border-border bg-card px-1 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <input
                    type="time"
                    value={h.to}
                    onChange={(e) => setHours(h.day, { to: e.target.value })}
                    aria-label={`${h.day} to`}
                    className="h-8 w-24 border border-border bg-card px-1 text-xs"
                  />
                </span>
              ) : (
                <span className="ml-auto bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </SectionCard>

        <SectionCard title={t("secSocial")}>
          {contact.socials.map((s) => (
            <div key={s.id} className="grid grid-cols-[110px_1fr] items-center gap-2">
              <span className="text-sm font-bold">{s.network}</span>
              <Input
                value={s.url}
                onChange={(e) =>
                  set({
                    socials: contact.socials.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)),
                  })
                }
                className="bg-card font-mono text-xs"
                aria-label={s.network}
              />
            </div>
          ))}
          <Field label={t("fMapsUrl")}>
            <Input value={contact.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
          <Field label={t("fMapsEmbed")}>
            <Input value={contact.mapsEmbed} onChange={(e) => set({ mapsEmbed: e.target.value })} className="bg-card font-mono text-xs" />
          </Field>
        </SectionCard>

        <div className="flex items-center justify-center border border-dashed border-secondary/40 bg-secondary/5 p-6 text-center text-sm text-muted-foreground lg:col-span-1">
          Map preview uses the embed URL on the storefront contact page.
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>{t("saveBtn")}</Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("previewContact")}</DialogTitle>
          </DialogHeader>
          <div className="border border-border bg-white p-5 text-sm text-[#1a0d00]">
            <p className="font-heading text-xl font-bold">{contact.company}</p>
            <p className="text-muted-foreground">{contact.tagline}</p>
            <div className="flex flex-col gap-1.5 pt-3">
              <p className="flex items-center gap-2"><Phone className="size-4 text-secondary" aria-hidden="true" />{contact.phone} · {contact.phone2}</p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-secondary" aria-hidden="true" />{contact.email}</p>
              <p className="flex items-center gap-2"><MapPin className="size-4 text-secondary" aria-hidden="true" />{contact.address}, {contact.city} {contact.postal}</p>
              <p className="flex items-center gap-2"><Clock3 className="size-4 text-secondary" aria-hidden="true" />Mon–Sat 9AM–9PM</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>{t("cancelBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
