"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Eye, EyeOff, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { StoreAddressEntry } from "@/features/vendor/store-mgmt";
import { useStoreAddresses, useVendorStore } from "@/store/vendor.store";
import { StoreTabs } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EMPTY: StoreAddressEntry = {
  id: "", kind: "store", line1: "", line2: "", area: "", city: "",
  division: "Dhaka", postal: "", country: "Bangladesh", isDefault: false, isPublic: true,
};

export default function VendorStoreAddressPage() {
  const t = useTranslations("Dashboard.Vendor");
  const addresses = useStoreAddresses();
  const store = useVendorStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StoreAddressEntry>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);

  const pub = addresses.find((a) => a.isDefault) ?? addresses[0];

  const openNew = () => {
    setForm({ ...EMPTY, id: `addr-${Date.now()}` });
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (a: StoreAddressEntry) => {
    setForm({ ...a });
    setEditing(a.id);
    setOpen(true);
  };

  const save = () => {
    if (!form.line1.trim() || !form.city.trim() || !form.postal.trim()) {
      toast.error(t("errRequired"));
      return;
    }
    if (editing) {
      store.patchStoreAddress(editing, { ...form });
      store.logStoreActivity("Store address updated");
    } else {
      store.addStoreAddress({ ...form, isDefault: addresses.length === 0 ? true : form.isDefault });
      store.logStoreActivity("Store address added");
    }
    store.notifyVendor("Store address saved.", "info");
    setOpen(false);
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_store")} title={t("smAddress")} subtitle={pub ? `${pub.city}, ${pub.country}` : ""}
        highlightLabel={t("smAddress")} highlightValue={String(addresses.length)} highlightIcon={MapPin}
      />

      <StoreTabs />

      {pub ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-secondary/50 bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("smPublicLoc")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="font-heading text-lg font-bold">{pub.city}, {pub.country}</p>
              <p className="text-xs text-muted-foreground">{pub.division} · {pub.postal}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("smPrivateAddr")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm">
              <p className="font-semibold">{pub.line1}{pub.line2 ? `, ${pub.line2}` : ""}</p>
              <p className="text-muted-foreground">{pub.area}, {pub.city} {pub.postal}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" aria-hidden="true" />
          {t("smAddAddress")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <Card key={a.id} className={cn("border-border bg-card", a.isDefault && "border-secondary/60")}>
            <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold capitalize">{a.kind} · {a.city}</CardTitle>
              {a.isDefault ? <span className="bg-secondary px-2 py-0.5 text-[11px] font-bold text-white">{t("poDefault")}</span> : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-1 px-4 pb-4 text-sm">
              <p className="font-semibold">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p className="text-muted-foreground">{a.area}, {a.city}, {a.division} {a.postal}, {a.country}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {a.isPublic ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
                {a.isPublic ? t("smPublicLoc") : t("smPrivateAddr")}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {!a.isDefault ? (
                  <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { store.setDefaultStoreAddress(a.id); toast.success(t("toastSaved")); }}>
                    {t("smSetDefault")}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => store.patchStoreAddress(a.id, { isPublic: !a.isPublic })}>
                  {a.isPublic ? <EyeOff className="size-3" aria-hidden="true" /> : <Eye className="size-3" aria-hidden="true" />}
                  {a.isPublic ? t("smClosed") : t("smOpen")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => openEdit(a)}>
                  <Pencil className="size-3" aria-hidden="true" />
                  {t("poEdit")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 bg-card text-[11px] text-destructive" onClick={() => { store.removeStoreAddress(a.id); store.logStoreActivity("Store address removed"); toast.success(t("toastSaved")); }}>
                  <Trash2 className="size-3" aria-hidden="true" />
                  {t("poDelete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("smAddAddress")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("smKind")}>
              <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: (v as typeof f.kind) ?? "store" }))}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["store", "warehouse", "return", "pickup"] as const).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("smCountry")}>
              <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="bg-card" />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("smLine1")}><Input value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} className="bg-card" /></Field>
            </div>
            <Field label={t("smLine2")}><Input value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} className="bg-card" /></Field>
            <Field label={t("smArea")}><Input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className="bg-card" /></Field>
            <Field label={t("smCity")}><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="bg-card" /></Field>
            <Field label={t("smDivision")}><Input value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))} className="bg-card" /></Field>
            <Field label={t("smPostal")}><Input value={form.postal} onChange={(e) => setForm((f) => ({ ...f, postal: e.target.value }))} className="bg-card" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={save}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
