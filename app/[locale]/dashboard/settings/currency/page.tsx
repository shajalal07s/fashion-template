"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Coins, Pencil, Power, Star } from "lucide-react";
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
import { SaveBar } from "@/components/admin/settings/shared";
import { formatCurrencyPreview, type CurrencyRow } from "@/features/admin/settings";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR", "SAR", "AED"];
const SYMBOLS: Record<string, string> = { BDT: "৳", USD: "$", EUR: "€", GBP: "£", INR: "₹", SAR: "﷼", AED: "د.إ" };

export default function CurrencySettingsPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const currency = useSettingsStore((s) => s.currency);
  const patch = useSettingsStore((s) => s.patchCurrency);
  const store = useSettingsStore();

  const [previewValue, setPreviewValue] = useState("12500.50");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [fCode, setFCode] = useState("USD");
  const [fRate, setFRate] = useState(117.5);

  const save = () => toast.success(t("toastSaved"));

  const preview = formatCurrencyPreview(
    currency.code,
    currency.symbol,
    currency.position,
    currency.decimals,
    Number(previewValue) || 0
  );

  const setDefault = (row: CurrencyRow) => {
    patch({ code: row.code, symbol: row.symbol });
    store.patchCurrency({
      currencies: currency.currencies.map((c) => ({ ...c, isDefault: c.id === row.id })),
    });
    toast.success(t("toastSaved"));
  };

  const openEdit = (row: CurrencyRow) => {
    setEditId(row.id);
    setFCode(row.code);
    setFRate(row.rate);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      patch({
        currencies: currency.currencies.map((c) =>
          c.id === editId ? { ...c, code: fCode, symbol: SYMBOLS[fCode] ?? c.symbol, rate: fRate, updated: "2026-09-26" } : c
        ),
      });
      toast.success(t("toastUpdated"));
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("cuTitle")}
        subtitle={t("cuSubtitle")}
        highlightLabel={t("fCode")}
        highlightValue={currency.code}
        highlightIcon={Coins}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("secDefault")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fCurrency")}>
              <Select value={currency.code} onValueChange={(v) => {
                const code = v ?? "BDT";
                patch({ code, symbol: SYMBOLS[code] ?? code });
              }}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fSymbol")}>
              <Input value={currency.symbol} onChange={(e) => patch({ symbol: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fPosition")}>
              <Select value={currency.position} onValueChange={(v) => patch({ position: (v as "before" | "after") ?? "before" })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">{t("posBefore")}</SelectItem>
                  <SelectItem value="after">{t("posAfter")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDecimals")}>
              <Select value={String(currency.decimals)} onValueChange={(v) => patch({ decimals: Number(v) || 0 })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["0", "2", "3"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fDecSep")}>
              <Input value={currency.decimalSep} onChange={(e) => patch({ decimalSep: e.target.value })} className="bg-card" />
            </Field>
            <Field label={t("fThouSep")}>
              <Input value={currency.thousandSep} onChange={(e) => patch({ thousandSep: e.target.value })} className="bg-card" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title={t("previewTitle")}>
          <Field label={t("previewTitle")}>
            <Input value={previewValue} onChange={(e) => setPreviewValue(e.target.value)} className="bg-card font-mono" inputMode="decimal" />
          </Field>
          <div className="border border-dashed border-secondary/40 bg-secondary/5 px-4 py-6 text-center">
            <p className="font-heading text-3xl font-bold text-secondary">{preview}</p>
            <p className="pt-1 text-xs text-muted-foreground">
              {currency.code} · {t(currency.position === "before" ? "posBefore" : "posAfter")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <span className="border border-border px-2 py-1.5">৳1,000</span>
            <span className="border border-border px-2 py-1.5">1,000৳</span>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t("secMulti")}>
        <Card className="overflow-hidden border-border bg-card py-0">
          <CardContent className="overflow-x-auto p-0">
            {currency.currencies.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tCurrency")}</TableHead>
                    <TableHead>{t("fCode")}</TableHead>
                    <TableHead className="text-right">{t("tRate")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="text-center">{t("tDefault")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currency.currencies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-semibold whitespace-nowrap">
                        {c.name} ({c.symbol})
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">{c.code}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.rate}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", c.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                          {t(c.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.isDefault ? (
                          <Star className="mx-auto size-4 fill-primary text-primary" aria-label={t("tDefault")} />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefault(c)}
                            aria-label={`${t("setDefault")} ${c.code}`}
                            title={t("setDefault")}
                            className="mx-auto flex size-6 items-center justify-center text-muted-foreground transition-colors hover:text-secondary"
                          >
                            <Star className="size-4" aria-hidden="true" />
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)} aria-label={`${t("editTitle")} ${c.code}`} title={t("editTitle")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              patch({
                                currencies: currency.currencies.map((x) => (x.id === c.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x)),
                              });
                              toast.success(t("toastUpdated"));
                            }}
                            aria-label={c.code}
                          >
                            <Power className={cn("size-4", c.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fCurrency")}>
              <Select value={fCode} onValueChange={(v) => setFCode(v ?? "USD")}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("tRate")}>
              <Input type="number" min={0} value={fRate} onChange={(e) => setFRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card font-mono" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
