"use client";

import { useTranslations } from "next-intl";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import { orderNumberPreview } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STORE_TYPES = ["Multi-Vendor", "Single Vendor", "Marketplace", "Boutique"];
const STATUSES = ["open", "closed", "maintenance"] as const;

export default function StoreSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const store = useSettingsStore((s) => s.store);
  const patch = useSettingsStore((s) => s.patchStore);

  const save = () => toast.success(t("toastSaved"));

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("stTitle")}
        subtitle={t("stSubtitle")}
        highlightLabel={t("fStoreStatus")}
        highlightValue={store.status === "open" ? t("stOpen") : store.status === "closed" ? t("stClosed") : t("stMaintenance")}
        highlightIcon={Store}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secStoreInfo")}>
          <Field label={t("fStoreName")}>
            <Input value={store.storeName} onChange={(e) => patch({ storeName: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fStoreType")}>
              <Select value={store.storeType} onValueChange={(v) => patch({ storeType: v ?? STORE_TYPES[0] })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORE_TYPES.map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fStoreStatus")}>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => patch({ status: s })}
                    aria-pressed={store.status === s}
                    className={cn("border px-2 py-2 text-xs font-bold transition-colors", store.status === s ? "border-secondary bg-secondary text-white" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    {t(s === "open" ? "stOpen" : s === "closed" ? "stClosed" : "stMaintenance")}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label={t("fStoreDesc")}>
            <Input value={store.storeDesc} onChange={(e) => patch({ storeDesc: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fStoreEmail")}>
              <Input value={store.storeEmail} onChange={(e) => patch({ storeEmail: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fStorePhone")}>
              <Input value={store.storePhone} onChange={(e) => patch({ storePhone: e.target.value })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fSupportEmail")}>
              <Input value={store.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fSupportPhone")}>
              <Input value={store.supportPhone} onChange={(e) => patch({ supportPhone: e.target.value })} className="bg-card font-mono" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("secOperating")}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fMinOrder")}>
              <Input type="number" min={0} value={store.minOrder} onChange={(e) => patch({ minOrder: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fMaxOrder")}>
              <Input type="number" min={0} value={store.maxOrder} onChange={(e) => patch({ maxOrder: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fMinQty")}>
              <Input type="number" min={1} value={store.minQty} onChange={(e) => patch({ minQty: Math.max(1, Number(e.target.value) || 1) })} className="bg-card" />
            </Field>
            <Field label={t("fMaxQty")}>
              <Input type="number" min={1} value={store.maxQty} onChange={(e) => patch({ maxQty: Math.max(1, Number(e.target.value) || 1) })} className="bg-card" />
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <SettingToggle label={t("fGuest")} checked={store.guestCheckout} onChange={(v) => patch({ guestCheckout: v })} />
            <SettingToggle label={t("fCustomerReg")} checked={store.customerReg} onChange={(v) => patch({ customerReg: v })} />
            <SettingToggle label={t("fVendorReg")} checked={store.vendorReg} onChange={(v) => patch({ vendorReg: v })} />
            <SettingToggle label={t("fReviews")} checked={store.reviews} onChange={(v) => patch({ reviews: v })} />
            <SettingToggle label={t("fRatings")} checked={store.ratings} onChange={(v) => patch({ ratings: v })} />
            <SettingToggle label={t("fWishlist")} checked={store.wishlist} onChange={(v) => patch({ wishlist: v })} />
            <SettingToggle label={t("fCompare")} checked={store.compare} onChange={(v) => patch({ compare: v })} />
          </div>
        </SectionCard>

        <SectionCard title={t("secOrders")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label={t("fOrderPrefix")}>
              <Input value={store.orderPrefix} onChange={(e) => patch({ orderPrefix: e.target.value.toUpperCase() })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fOrderStart")}>
              <Input type="number" min={1} value={store.orderStart} onChange={(e) => patch({ orderStart: Math.max(1, Number(e.target.value) || 1) })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fInvoicePrefix")}>
              <Input value={store.invoicePrefix} onChange={(e) => patch({ invoicePrefix: e.target.value.toUpperCase() })} className="bg-card font-mono" />
            </Field>
            <Field label={t("fCancelLimit")}>
              <Input type="number" min={0} value={store.cancelLimit} onChange={(e) => patch({ cancelLimit: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
          </div>
          <div className="border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-center">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{t("orderPreview")}</p>
            <p className="font-mono font-heading text-xl font-bold text-secondary">
              {orderNumberPreview(store.orderPrefix, store.orderStart)}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <SettingToggle label={t("fAutoCancel")} checked={store.autoCancel} onChange={(v) => patch({ autoCancel: v })} />
            <SettingToggle label={t("fAutoComplete")} checked={store.autoComplete} onChange={(v) => patch({ autoComplete: v })} />
            <SettingToggle label={t("fOrderNotes")} checked={store.orderNotes} onChange={(v) => patch({ orderNotes: v })} />
            <SettingToggle label={t("fCustomerNotes")} checked={store.customerNotes} onChange={(v) => patch({ customerNotes: v })} />
          </div>
          <Button variant="outline" size="sm" className="w-fit bg-card" onClick={save}>
            {t("saveBtn")}
          </Button>
        </SectionCard>
      </div>

      <SaveBar onSave={save} />
    </div>
  );
}
