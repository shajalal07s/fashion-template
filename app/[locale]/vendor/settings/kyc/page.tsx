"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { FileUp, ShieldCheck, Trash2 } from "lucide-react";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { SETTINGS_CONFIG, kycSchema } from "@/features/vendor/settings";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs } from "@/components/vendor/shipping-settings-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorKycPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const kyc = store.kyc;
  const fileRef = useRef<HTMLInputElement>(null);

  const [legal, setLegal] = useState(kyc.legalName);
  const [biz, setBiz] = useState(kyc.businessName);
  const [bizType, setBizType] = useState(kyc.businessType);
  const [country, setCountry] = useState(kyc.country);
  const [reg, setReg] = useState(kyc.regNumber);
  const [tax, setTax] = useState(kyc.taxNumber);
  const [docType, setDocType] = useState(kyc.docType);
  const [docNum, setDocNum] = useState(kyc.docNumber);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const locked = kyc.status === "review" || kyc.status === "submitted";

  const saveDraft = () => {
    store.patchKyc({
      legalName: legal.trim(), businessName: biz.trim(), businessType: bizType,
      country: country.trim(), regNumber: reg.trim(), taxNumber: tax.trim(),
      docType, docNumber: docNum.trim(), status: "incomplete",
    });
    store.notifyVendor("KYC draft saved.", "info");
    toast.success(t("toastSaved"));
  };

  const submit = () => {
    const parsed = kycSchema.safeParse({
      legalName: legal.trim(), businessName: biz.trim(), businessType: bizType,
      country: country.trim(), regNumber: reg.trim(), docType, docNumber: docNum.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid KYC");
      return;
    }
    if (kyc.docs.length === 0) {
      setError(t("errRequired"));
      return;
    }
    setError("");
    store.patchKyc({
      legalName: legal.trim(), businessName: biz.trim(), businessType: bizType,
      country: country.trim(), regNumber: reg.trim(), taxNumber: tax.trim(),
      docType, docNumber: docNum.trim(), status: "review",
      submitted: "2026-09-26", rejectionReason: "",
    });
    store.notifyVendor("KYC submitted for verification.", "info");
    setConfirm(false);
    toast.success(t("toastSaved"));
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!SETTINGS_CONFIG.kycDocTypes.includes(file.type as "image/png")) {
      toast.error("Use PNG, JPG, WebP or PDF.");
      return;
    }
    if (file.size > SETTINGS_CONFIG.kycMaxMb * 1024 * 1024) {
      toast.error(`Max ${SETTINGS_CONFIG.kycMaxMb}MB.`);
      return;
    }
    store.patchKyc({
      docs: [...kyc.docs, {
        id: `kd-${Date.now()}`, kind: "Supporting Document", name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`, uploaded: "2026-09-26",
      }],
    });
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("seKyc")} subtitle={`${t("seKycStatus")}: ${kyc.status}`}
        highlightLabel={t("seKycStatus")} highlightValue={kyc.status} highlightIcon={ShieldCheck}
      />

      <SettingTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t("seKycStatus"), value: kyc.status },
          { label: t("seSubmitted"), value: kyc.submitted || "—" },
          { label: t("seVerifiedDate"), value: kyc.verifiedDate || "—" },
          { label: t("seExpiry"), value: kyc.expiry || "—" },
        ].map((c) => (
          <Card key={c.label} className="border-border bg-card">
            <CardContent className="p-3">
              <p className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{c.label}</p>
              <p className={cn("truncate font-heading text-lg font-bold", kyc.status === "verified" && c.label === t("seKycStatus") && "text-green-700", (kyc.status === "rejected" || kyc.status === "update") && c.label === t("seKycStatus") && "text-destructive")}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(kyc.status === "rejected" || kyc.status === "update") && kyc.rejectionReason ? (
        <div className="border border-destructive/40 bg-destructive/5 p-4" role="alert">
          <p className="font-heading text-base font-bold text-destructive">{t("seRejectReason")}</p>
          <p className="pt-1 text-sm">{kyc.rejectionReason}</p>
          <Button size="sm" className="mt-2" onClick={() => document.getElementById("kyc-docs")?.scrollIntoView({ behavior: "smooth" })}>
            {t("seUpdateDocs")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("seKyc")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
            <Field label={t("seLegalName")}><Input value={legal} onChange={(e) => setLegal(e.target.value)} className="bg-card" disabled={locked} /></Field>
            <Field label={t("seBizName")}><Input value={biz} onChange={(e) => setBiz(e.target.value)} className="bg-card" disabled={locked} /></Field>
            <Field label={t("seBizType")}>
              <Select value={bizType} onValueChange={(v) => setBizType(v ?? bizType)} disabled={locked}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Sole Proprietorship", "Partnership", "Private Limited", "LLC"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("seCountry")}><Input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-card" disabled={locked} /></Field>
            <Field label={t("seRegNum")}><Input value={reg} onChange={(e) => setReg(e.target.value)} className="bg-card" disabled={locked} /></Field>
            <Field label={t("seTaxNum")}><Input value={tax} onChange={(e) => setTax(e.target.value)} className="bg-card" disabled={locked} /></Field>
            <Field label={t("seDocType")}>
              <Select value={docType} onValueChange={(v) => setDocType(v ?? docType)} disabled={locked}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["National ID", "Passport", "Driving License"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("seDocNum")}><Input value={docNum} onChange={(e) => setDocNum(e.target.value)} className="bg-card font-mono" disabled={locked} /></Field>
          </CardContent>
        </Card>

        <Card className="h-fit border-border bg-card" >
          <CardHeader className="px-4 pt-4 pb-2" >
            <CardTitle className="font-heading text-base font-bold" ><span id="kyc-docs">{t("seDocs")}</span></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {kyc.docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 border border-border p-2.5 text-sm">
                <FileUp className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{d.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{d.kind} · {d.size} · {d.uploaded}</span>
                </span>
                {!locked ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => store.patchKyc({ docs: kyc.docs.filter((x) => x.id !== d.id) })} aria-label={`${t("poDelete")} ${d.name}`}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
            {!locked ? (
              <>
                <input ref={fileRef} type="file" accept={SETTINGS_CONFIG.kycDocTypes.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label={t("seDocs")} />
                <Button size="sm" variant="outline" className="bg-card" onClick={() => fileRef.current?.click()}>
                  <FileUp className="size-3.5" aria-hidden="true" />
                  {t("seUpdateDocs")}
                </Button>
                <p className="text-[11px] text-muted-foreground">PNG/JPG/WebP/PDF · max {SETTINGS_CONFIG.kycMaxMb}MB · private storage</p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      {!locked ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="bg-card" onClick={saveDraft}>{t("seSaveDraft")}</Button>
          <Button onClick={() => setConfirm(true)}>{t("seSubmitKyc")}</Button>
        </div>
      ) : (
        <p className="border border-border bg-muted/40 p-3 text-center text-sm font-semibold text-muted-foreground">{t("seKycStatus")}: {kyc.status}</p>
      )}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("seSubmitKyc")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("seConfirmSubmit")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={submit}>{t("seSubmitKyc")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
