"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Eye, Mail, Pencil, Power, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { SaveBar } from "@/components/admin/settings/shared";
import { EMAIL_VARIABLES, type EmailTemplate } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EmailSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const email = useSettingsStore((s) => s.email);
  const patch = useSettingsStore((s) => s.patchEmail);
  const store = useSettingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fSubject, setFSubject] = useState("");
  const [fPreview, setFPreview] = useState("");
  const [fContent, setFContent] = useState("");

  const save = () => toast.success(t("toastSaved"));

  const openEdit = (tpl: EmailTemplate) => {
    setEditId(tpl.id);
    setFSubject(tpl.subject);
    setFPreview(tpl.preview);
    setFContent(tpl.content);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editId || !fSubject.trim()) return;
    store.patchTemplate(editId, { subject: fSubject.trim(), preview: fPreview.trim(), content: fContent });
    setDialogOpen(false);
    toast.success(t("toastUpdated"));
  };

  const insertVar = (v: string) => setFContent((p) => `${p}${v}`);

  const renderContent = (html: string) => {
    let out = html;
    const sample: Record<string, string> = {
      customer_name: "Ayesha Rahman",
      order_id: "ORD-1042",
      order_total: "৳4,410",
      store_name: "Fashion Store",
      support_email: email.supportEmail,
      vendor_name: "Ayesha Boutique",
      tracking_number: "TRK-20260928-001",
    };
    for (const [k, v] of Object.entries(sample)) {
      out = out.replaceAll(`{{${k}}}`, v);
    }
    return out;
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("emTitle")}
        subtitle={t("emSubtitle")}
        highlightLabel={t("secTemplates")}
        highlightValue={String(email.templates.filter((x) => x.status === "active").length)}
        highlightIcon={Mail}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secSender")}>
          <Field label={t("fSenderName")}>
            <Input value={email.senderName} onChange={(e) => patch({ senderName: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fSenderEmail")}>
              <Input value={email.senderEmail} onChange={(e) => patch({ senderEmail: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fReplyTo")}>
              <Input value={email.replyTo} onChange={(e) => patch({ replyTo: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fSupportEmail")}>
              <Input value={email.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fAdminEmail")}>
              <Input value={email.adminEmail} onChange={(e) => patch({ adminEmail: e.target.value })} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title={t("secProvider")}
          action={
            <Button size="sm" className="h-8 gap-1.5" onClick={() => toast.success(t("testSent"))}>
              <Send className="size-3.5" aria-hidden="true" />
              {t("testEmail")}
            </Button>
          }
        >
          <Field label={t("fProvider")}>
            <Select value={email.provider} onValueChange={(v) => patch({ provider: v ?? "smtp" })}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["smtp", "custom", "mock"].map((x) => (
                  <SelectItem key={x} value={x}>{x.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fSmtpHost")}>
              <Input value={email.smtpHost} onChange={(e) => patch({ smtpHost: e.target.value })} className="bg-card font-mono text-xs" />
            </Field>
            <Field label={t("fSmtpPort")}>
              <Input type="number" min={1} value={email.smtpPort} onChange={(e) => patch({ smtpPort: Math.max(1, Number(e.target.value) || 587) })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fEncryption")}>
              <Select value={email.encryption} onValueChange={(v) => patch({ encryption: v ?? "TLS" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["TLS", "SSL", "None"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fUsername")}>
              <Input value={email.username} onChange={(e) => setUsername(e.target.value)} className="bg-card font-mono text-xs" />
            </Field>
          </div>
          <Field label={t("fPassword")}>
            <Input type="password" value="••••••••" readOnly className="bg-muted font-mono" aria-label={t("fPassword")} />
          </Field>
        </SectionCard>
      </div>

      <SectionCard title={t("secTemplates")}>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            {email.templates.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tTemplate")}</TableHead>
                    <TableHead>{t("tTrigger")}</TableHead>
                    <TableHead>{t("tLastUpdated")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {email.templates.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>
                        <p className="text-sm font-semibold whitespace-nowrap">{x.name}</p>
                        <p className="max-w-64 truncate text-xs text-muted-foreground" title={x.subject}>{x.subject}</p>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{x.trigger}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{x.updated}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", x.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                          {t(x.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setPreviewId(x.id)} aria-label={`${t("emailPreview")} ${x.name}`} title={t("emailPreview")}>
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(x)} aria-label={`${t("editTitle")} ${x.name}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              store.patchTemplate(x.id, { status: x.status === "active" ? "inactive" : "active" });
                              toast.success(t("toastUpdated"));
                            }}
                            aria-label={x.name}
                          >
                            <Power className={cn("size-4", x.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
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
      </SectionCard>

      <SaveBar onSave={save} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("tplEditor")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fSubject")}>
              <Input value={fSubject} onChange={(e) => setFSubject(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fPreviewText")}>
              <Input value={fPreview} onChange={(e) => setFPreview(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <Field label={t("varPicker")}>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="border border-border bg-card px-2 py-1 font-mono text-[11px] transition-colors hover:border-secondary hover:text-secondary"
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t("fContent")}>
            <RichTextEditor value={fContent} onChange={setFContent} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="sm:max-w-lg">
          {(() => {
            const x = email.templates.find((y) => y.id === previewId);
            if (!x) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-base font-bold">
                    {t("emailPreview")} · {x.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="border border-border bg-white p-5 text-sm text-[#1a0d00]">
                  <p className="text-[11px] text-muted-foreground">{email.senderName} · {email.senderEmail}</p>
                  <p className="font-heading pt-1 text-lg font-bold">{renderContent(x.subject)}</p>
                  <div className="prose-sm pt-2" dangerouslySetInnerHTML={{ __html: renderContent(x.content) }} />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setPreviewId(null)}>{t("cancelBtn")}</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );

  function setUsername(v: string) {
    patch({ username: v });
  }
}
