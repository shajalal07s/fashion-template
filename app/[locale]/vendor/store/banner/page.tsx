"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ImagePlus, Images, Trash2, Upload } from "lucide-react";
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

export default function VendorStoreBannerPage() {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const store = useVendorStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const current = preview ?? store.storeBanner;

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!STORE_RULES.bannerTypes.includes(file.type as "image/png")) {
      toast.error("Invalid image type. Use PNG, JPG or WebP.");
      return;
    }
    if (file.size > STORE_RULES.bannerMaxMb * 1024 * 1024) {
      toast.error(`File too large. Max ${STORE_RULES.bannerMaxMb}MB.`);
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const save = () => {
    if (!preview) return;
    store.setStoreDetails({ banner: preview });
    store.logStoreActivity("Store banner updated");
    store.notifyVendor("Store banner updated.", "info");
    setPreview(null);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smBanner")} subtitle={t("smBannerReq")}
        highlightLabel={t("smBanner")} highlightValue={profile.store} highlightIcon={Images}
      />

      <StoreTabs />

      <Card className="border-border bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("smBanner")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-xs text-muted-foreground">{t("smBannerReq")}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
            className={cn("relative flex min-h-44 items-center justify-center overflow-hidden border-2 border-dashed p-2 text-center transition-colors",
              dragging ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary")}
            aria-label={t("smBanner")}
          >
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current} alt="Store banner" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-bold text-secondary">
                <ImagePlus className="size-4" aria-hidden="true" />
                <Upload className="size-4" aria-hidden="true" />
                {t("smUploadLogo")}
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept={STORE_RULES.bannerTypes.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label={t("smBanner")} />
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

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { label: t("smDesktop"), cls: "aspect-[21/6]" },
          { label: t("smTablet"), cls: "aspect-[16/7]" },
          { label: t("smMobile"), cls: "aspect-[16/10]" },
        ].map((v) => (
          <Card key={v.label} className="overflow-hidden border-border bg-card py-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-sm font-bold">{v.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current} alt={`${v.label} banner preview`} className={`w-full object-cover ${v.cls}`} loading="lazy" />
              ) : <p className="p-4 text-sm text-muted-foreground">{t("emptyDescription")}</p>}
            </CardContent>
          </Card>
        ))}
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
                store.setStoreDetails({ banner: "/images/Banner/banner-1.jpg" });
                store.logStoreActivity("Store banner removed");
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
