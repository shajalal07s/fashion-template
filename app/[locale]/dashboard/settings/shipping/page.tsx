"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Pencil, Play, Plus, Power, Trash2, Truck } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { ConfirmDialog, SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import type { ShipMethodRow } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShippingSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const shipping = useSettingsStore((s) => s.shipping);
  const patch = useSettingsStore((s) => s.patchShipping);
  const store = useSettingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fPrice, setFPrice] = useState(60);
  const [fEta, setFEta] = useState("2–5 Days");
  const [cCountry, setCCountry] = useState("Bangladesh");
  const [cDivision, setCDivision] = useState("Dhaka");
  const [cWeight, setCWeight] = useState(2);
  const [cValue, setCValue] = useState(1500);

  const save = () => toast.success(t("toastSaved"));

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFDesc(""); setFPrice(60); setFEta("2–5 Days");
    setDialogOpen(true);
  };

  const openEdit = (m: ShipMethodRow) => {
    setEditId(m.id);
    setFName(m.name); setFDesc(m.description); setFPrice(m.price); setFEta(m.eta);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchShipMethod(editId, { name: fName.trim(), description: fDesc.trim(), price: fPrice, eta: fEta.trim() });
      toast.success(t("toastUpdated"));
    } else {
      store.addShipMethod({
        id: `sm-${shipping.methods.length + 1}`,
        name: fName.trim(), description: fDesc.trim(), price: fPrice, eta: fEta.trim(),
        sort: shipping.methods.length + 1, status: "active",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const calcMethods = shipping.methods.filter((m) => m.status === "active").map((m) => {
    let cost = m.price;
    if (m.name.includes("Free") && cValue >= 2000) cost = 0;
    if (m.name.includes("Express")) cost = cWeight <= 1 ? 80 : 120;
    return { ...m, cost };
  });

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("shTitle")}
        subtitle={t("shSubtitle")}
        highlightLabel={t("fDefaultMethod")}
        highlightValue={shipping.defaultMethod}
        highlightIcon={Truck}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addMethod")}
        </button>
      </AccountingHero>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secGeneralShip")}>
          <SettingToggle label={t("fEnableShip")} checked={shipping.enabled} onChange={(v) => patch({ enabled: v })} />
          <Field label={t("fDefaultMethod")}>
            <Input value={shipping.defaultMethod} onChange={(e) => patch({ defaultMethod: e.target.value })} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fFreeThreshold")}>
              <Input type="number" min={0} value={shipping.freeThreshold} onChange={(e) => patch({ freeThreshold: Math.max(0, Number(e.target.value) || 0) })} className="bg-card" />
            </Field>
            <Field label={t("fCalculation")}>
              <Input value={shipping.calculation} onChange={(e) => patch({ calculation: e.target.value })} className="bg-card" />
            </Field>
          </div>
          <SettingToggle label={t("fShipTax")} checked={shipping.shippingTax} onChange={(v) => patch({ shippingTax: v })} />
          <SettingToggle label={t("fEtaDisplay")} checked={shipping.etaDisplay} onChange={(v) => patch({ etaDisplay: v })} />
          <SettingToggle label={t("fAddrRequired")} checked={shipping.addressRequired} onChange={(v) => patch({ addressRequired: v })} />
        </SectionCard>

        <SectionCard title={t("calcTitle")}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fCountry2")}>
              <Input value={cCountry} onChange={(e) => setCCountry(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fDivision2")}>
              <Input value={cDivision} onChange={(e) => setCDivision(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fWeight")}>
              <Input type="number" min={0} value={cWeight} onChange={(e) => setCWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fValue")}>
              <Input type="number" min={0} value={cValue} onChange={(e) => setCValue(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
          </div>
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{t("calcResult")}</p>
          {calcMethods.map((m) => (
            <div key={m.id} className="flex items-center justify-between border border-border px-3 py-2 text-sm">
              <span>
                <span className="block font-bold">{m.name}</span>
                <span className="block text-xs text-muted-foreground">{m.eta}</span>
              </span>
              <span className="font-heading font-bold text-secondary">
                {m.cost === 0 ? "Free" : `৳${m.cost.toLocaleString()}`}
              </span>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard
        title={t("secMethods")}
        action={
          <Button size="sm" className="h-8 gap-1.5" onClick={openAdd}>
            <Plus className="size-3.5" aria-hidden="true" />
            {t("addMethod")}
          </Button>
        }
      >
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            {shipping.methods.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tMethod")}</TableHead>
                    <TableHead className="text-right">{t("tPrice")}</TableHead>
                    <TableHead>{t("tEta")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipping.methods.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="text-sm font-semibold whitespace-nowrap">{m.name}</p>
                        <p className="max-w-52 truncate text-xs text-muted-foreground" title={m.description}>{m.description}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                        {m.price === 0 ? "Free" : `৳${m.price.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.eta}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", m.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                          {t(m.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} aria-label={`${t("editTitle")} ${m.name}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          {m.status === "active" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchShipMethod(m.id, { status: "inactive" }); toast.success(t("toastUpdated")); }} aria-label={m.name} title={m.name}>
                              <Power className="size-4 text-[#8a5a00]" aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchShipMethod(m.id, { status: "active" }); toast.success(t("toastUpdated")); }} aria-label={m.name} title={m.name}>
                              <Play className="size-4 text-green-600" aria-hidden="true" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(m.id)} aria-label={m.name}>
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
      </SectionCard>

      <SectionCard title={t("secZones")}>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tZone")}</TableHead>
                  <TableHead>{t("tCountry")}</TableHead>
                  <TableHead>{t("tDistrict")}</TableHead>
                  <TableHead>{t("tPostal")}</TableHead>
                  <TableHead>{t("tMethods")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipping.zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{z.name}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{z.country}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{z.district}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{z.postal}</TableCell>
                    <TableCell className="max-w-44 truncate text-xs text-muted-foreground" title={z.methods.join(", ")}>{z.methods.join(", ")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          store.patchShipZone(z.id, { status: z.status === "active" ? "inactive" : "active" });
                          toast.success(t("toastUpdated"));
                        }}
                      >
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold", z.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                          {t(z.status)}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SectionCard>

      <SaveBar onSave={save} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addMethod")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("tMethod")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fDesc")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tPrice")}>
              <Input type="number" min={0} value={fPrice} onChange={(e) => setFPrice(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("tEta")}>
              <Input value={fEta} onChange={(e) => setFEta(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
        confirmLabel={t("confirmBtn")}
        destructive
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) store.removeShipMethods([confirmId]);
          setConfirmId(null);
          toast.success(t("toastDeleted", { count: 1 }));
        }}
      />
    </div>
  );
}
