"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ImagePlus, Store, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { STORE_RULES } from "@/features/vendor/store-mgmt";
import { useVendorProfile, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorStoreLogoPage() {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const store = useVendorStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const current = preview ?? profile.logo;

  const validate = (file: File): string | null => {
    if (!STORE_RULES.logoTypes.includes(file.type as "image/png")) return "Invalid image type. Use PNG, JPG or WebP.";
    if (file.size > STORE_RULES.logoMaxMb * 1024 * 1024) return `File too large. Max ${STORE_RULES.logoMaxMb}MB.`;
    return null;
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const save = () => {
    if (!preview) return;
    store.patchProfile({ logo: preview });
    store.logStoreActivity("Store logo changed");
    store.notifyVendor("Store logo updated.", "info");
    setPreview(null);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smLogo")} subtitle={t("smLogoReq")}
        highlightLabel={t("smLogo")} highlightValue={profile.store} highlightIcon={Store}
      />

      <StoreTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("smLogo")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pb-4">
            <p className="text-xs text-muted-foreground">{t("smLogoReq")}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
              className={cn("flex min-h-56 flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center transition-colors",
                dragging ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary")}
              aria-label={t("smUploadLogo")}
            >
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current} alt="Store logo preview" className="size-28 object-cover" />
              ) : (
                <ImagePlus className="size-10 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="flex items-center gap-1.5 text-sm font-bold text-secondary">
                <Upload className="size-4" aria-hidden="true" />
                {t("smUploadLogo")}
              </span>
              <span className="text-xs text-muted-foreground">Drag & drop or browse</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={STORE_RULES.logoTypes.join(",")}
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
              aria-label={t("smUploadLogo")}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={save} disabled={!preview}>{t("saveBtn")}</Button>
              {preview ? <Button size="sm" variant="outline" className="bg-card" onClick={() => setPreview(null)}>{t("cancel")}</Button> : null}
              <Button size="sm" variant="outline" className="ml-auto bg-card text-destructive" onClick={() => setConfirmRemove(true)}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t("smRemove")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("smLightPreview")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current} alt="Logo on light" className="size-12 object-cover" />
                <span className="font-heading text-base font-bold text-black">{profile.store}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("smDarkPreview")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3 bg-[#1a0d00] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current} alt="Logo on dark" className="size-12 object-cover" />
                <span className="font-heading text-base font-bold text-white">{profile.store}</span>
              </div>
              <p className="pt-3 text-xs font-semibold text-muted-foreground">{t("smHeaderPreview")}</p>
              <div className="flex items-center gap-2 border border-border bg-card p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current} alt="Header logo" className="size-8 object-cover" />
                <span className="truncate text-sm font-bold">{profile.store}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("smRemoveConfirm")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>{t("cancel")}</Button>
            <Button
              size="sm"
              onClick={() => {
                store.patchProfile({ logo: "/images/women/women-1.jpg" });
                store.logStoreActivity("Store logo removed");
                setConfirmRemove(false);
                setPreview(null);
                toast.success(t("toastSaved"));
              }}
            >
              {t("smRemove")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
