"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Pencil, Percent, Plus, Power, Trash2 } from "lucide-react";
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
import { ConfirmDialog, SaveBar, SettingToggle } from "@/components/admin/settings/shared";
import { taxPreview, type TaxRateRow } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TaxSettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const tax = useSettingsStore((s) => s.tax);
  const patch = useSettingsStore((s) => s.patchTax);
  const store = useSettingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fCountry, setFCountry] = useState("Bangladesh");
  const [fState, setFState] = useState("All");
  const [fCity, setFCity] = useState("All");
  const [fPostal, setFPostal] = useState("All");
  const [fRate, setFRate] = useState(7.5);
  const [fType, setFType] = useState<"percentage" | "fixed">("percentage");
  const [fPriority, setFPriority] = useState(1);
  const [pvPrice, setPvPrice] = useState(1000);

  const save = () => toast.success(t("toastSaved"));

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFCountry("Bangladesh"); setFState("All");
    setFCity("All"); setFPostal("All"); setFRate(7.5);
    setFType("percentage"); setFPriority(tax.rates.length + 1);
    setDialogOpen(true);
  };

  const openEdit = (r: TaxRateRow) => {
    setEditId(r.id);
    setFName(r.name); setFCountry(r.country); setFState(r.state);
    setFCity(r.city); setFPostal(r.postal); setFRate(r.rate);
    setFType(r.type); setFPriority(r.priority);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim() || fRate < 0) return;
    if (editId) {
      store.patchTaxRate(editId, {
        name: fName.trim(), country: fCountry.trim(), state: fState.trim(),
        city: fCity.trim(), postal: fPostal.trim(), rate: fRate, type: fType, priority: fPriority,
      });
      toast.success(t("toastUpdated"));
    } else {
      store.addTaxRate({
        id: `tx-${tax.rates.length + 1}`,
        name: fName.trim(), country: fCountry.trim(), state: fState.trim(),
        city: fCity.trim(), postal: fPostal.trim(), rate: fRate, type: fType,
        priority: fPriority, status: "active", updated: "2026-09-26",
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const activeRate = tax.rates.find((r) => r.status === "active");
  const preview = taxPreview(pvPrice, activeRate?.rate ?? 0, activeRate?.type ?? "percentage");

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("txTitle")}
        subtitle={t("txSubtitle")}
        highlightLabel={t("tRate")}
        highlightValue={activeRate ? `${activeRate.rate}${activeRate.type === "percentage" ? "%" : "৳"}` : "—"}
        highlightIcon={Percent}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secGeneralTax")}>
          <SettingToggle label={t("fEnableTax")} checked={tax.enabled} onChange={(v) => patch({ enabled: v })} />
          <SettingToggle label={t("fInPrice")} checked={tax.inPrice} onChange={(v) => patch({ inPrice: v })} />
          <SettingToggle label={t("fInShipping")} checked={tax.inShipping} onChange={(v) => patch({ inShipping: v })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fBasedOn")}>
              <Select value={tax.basedOn} onValueChange={(v) => patch({ basedOn: v ?? "Shipping Address" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Shipping Address", "Billing Address", "Store Address"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDisplay")}>
              <Select value={tax.display} onValueChange={(v) => patch({ display: v ?? "Including Tax" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Including Tax", "Excluding Tax"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fPriceMode")}>
              <Select value={tax.priceMode} onValueChange={(v) => patch({ priceMode: v ?? "Excluding Tax" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Including Tax", "Excluding Tax"].map((x) => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("taxPreview")}>
          <Field label={t("pvPrice")}>
            <Input type="number" min={0} value={pvPrice} onChange={(e) => setPvPrice(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
          </Field>
          <div className="flex flex-col divide-y divide-border border-y border-border text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("pvPrice")}</span>
              <span className="font-semibold">৳{pvPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{t("pvTax")} ({activeRate?.rate ?? 0}{activeRate?.type === "percentage" ? "%" : "৳"})</span>
              <span className="font-semibold">৳{preview.tax.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-secondary/15 px-4 py-3">
              <span className="font-bold">{t("pvTotal")}</span>
              <span className="font-heading text-lg font-bold text-secondary">৳{preview.total.toLocaleString()}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("secRates")}
        action={
          <Button size="sm" className="h-8 gap-1.5" onClick={openAdd}>
            <Plus className="size-3.5" aria-hidden="true" />
            {t("addRate")}
          </Button>
        }
      >
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            {tax.rates.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tTaxName")}</TableHead>
                    <TableHead>{t("tCountry")}</TableHead>
                    <TableHead>{t("tState")}</TableHead>
                    <TableHead className="text-right">{t("tRate")}</TableHead>
                    <TableHead>{t("tType")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-28">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tax.rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-semibold whitespace-nowrap">{r.name}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{r.country}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{r.state}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-secondary">
                        {r.rate}{r.type === "percentage" ? "%" : "৳"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{r.type}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                          {t(r.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} aria-label={`${t("editTitle")} ${r.name}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              store.patchTaxRate(r.id, { status: r.status === "active" ? "inactive" : "active" });
                              toast.success(t("toastUpdated"));
                            }}
                            aria-label={r.name}
                          >
                            <Power className={cn("size-4", r.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(r.id)} aria-label={r.name}>
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

      <SaveBar onSave={save} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addRate")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fTaxName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Standard VAT" />
            </Field>
            <Field label={t("tType")}>
              <Select value={fType} onValueChange={(v) => setFType((v as "percentage" | "fixed") ?? "percentage")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("tCountry")}>
              <Input value={fCountry} onChange={(e) => setFCountry(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("tState")}>
              <Input value={fState} onChange={(e) => setFState(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("fRate")}>
              <Input type="number" min={0} value={fRate} onChange={(e) => setFRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("fPriority")}>
              <Input type="number" min={1} value={fPriority} onChange={(e) => setFPriority(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
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
          if (confirmId) store.removeTaxRates([confirmId]);
          setConfirmId(null);
          toast.success(t("toastDeleted", { count: 1 }));
        }}
      />
    </div>
  );
}
