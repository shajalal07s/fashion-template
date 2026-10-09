"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  FlaskConical,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import {
  CALC_TYPE_LABELS,
  SHIPPING_CONFIG,
  deliveryWindowText,
  estimateRate,
  type RateCalcType,
} from "@/features/vendor/shipping";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

export default function VendorShippingRatesPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const store = useVendorStore();
  const rates = store.shippingRates;
  const zones = store.shippingZones;

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [fZone, setFZone] = useState("all");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [testOpen, setTestOpen] = useState(false);
  const [tZone, setTZone] = useState(zones.find((z) => z.active)?.id ?? "");
  const [tAmount, setTAmount] = useState(2500);
  const [tWeight, setTWeight] = useState(1.8);
  const [tQty, setTQty] = useState(3);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...rates];
    if (fZone !== "all") list = list.filter((r) => r.zoneId === fZone);
    if (fType !== "all") list = list.filter((r) => r.calcType === fType);
    if (fStatus !== "all") list = list.filter((r) => (fStatus === "active") === r.active);
    if (needle) list = list.filter((r) => `${r.name} ${zoneName(r.zoneId)}`.toLowerCase().includes(needle));
    return list.sort((a, b) => a.baseRate - b.baseRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates, q, fZone, fType, fStatus, zones]);

  const quote = useMemo(
    () => (tZone ? estimateRate(rates, zones, { zoneId: tZone, amount: tAmount, weight: tWeight, qty: tQty }) : null),
    [rates, zones, tZone, tAmount, tWeight, tQty]
  );

  const condOf = (r: (typeof rates)[number]): string => {
    if (r.calcType === "free") return `${t("shMinOrder")}: ${money(r.minOrder)}`;
    if (r.calcType === "price") return `${money(r.minOrder)}–${r.maxOrder > 0 ? money(r.maxOrder) : "∞"}`;
    if (r.calcType === "weight") return `${r.minWeight}–${r.maxWeight > 0 ? `${r.maxWeight}kg` : "∞"}`;
    if (r.calcType === "perItem") return `${money(r.baseRate)} + ${money(r.perExtra)}/item`;
    return "—";
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shRates")} subtitle={`${num(filtered.length)} · ${t("shSubtitle")}`}
        highlightLabel={t("shActiveRates")} highlightValue={num(rates.filter((r) => r.active).length)} highlightIcon={Truck}
      >
        <Link href="/vendor/shipping/rates/create" className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("shCreateRate")}
        </Link>
        <button type="button" onClick={() => setTestOpen(true)} className={heroPillClassName}>
          <FlaskConical className="size-3.5" aria-hidden="true" />
          {t("shTestRate")}
        </button>
      </AccountingHero>

      <ShipTabs />

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <EarnStatCard label={t("shTotalRates")} value={num(rates.length)} href="/vendor/shipping/rates" accent />
          <EarnStatCard label={t("shActiveRates")} value={num(rates.filter((r) => r.active).length)} href="/vendor/shipping/rates" />
          <EarnStatCard label={t("shFlat")} value={num(rates.filter((r) => r.calcType === "flat").length)} href="/vendor/shipping/rates" />
          <EarnStatCard label={t("shFreeShip")} value={num(rates.filter((r) => r.calcType === "free").length)} href="/vendor/shipping/rates" />
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={fZone} onValueChange={(v) => setFZone(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("shZone")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fType} onValueChange={(v) => setFType(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("shCalcType")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {SHIPPING_CONFIG.calcTypes.map((c) => <SelectItem key={c} value={c}>{CALC_TYPE_LABELS[c as RateCalcType]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-28 bg-card" aria-label={t("tStatus")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              <SelectItem value="active">{t("seOn")}</SelectItem>
              <SelectItem value="inactive">{t("seOff")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("shRateName")}</TableHead>
                  <TableHead>{t("shZone")}</TableHead>
                  <TableHead>{t("shCalcType")}</TableHead>
                  <TableHead className="text-right">{t("shAmount")}</TableHead>
                  <TableHead>{t("shConditions")}</TableHead>
                  <TableHead>{t("shEtaCol")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("cpActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-bold">{r.name}</TableCell>
                    <TableCell>
                      <Link href={`/vendor/shipping/zones/${r.zoneId}`} className="text-xs hover:text-secondary hover:underline">{zoneName(r.zoneId)}</Link>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{CALC_TYPE_LABELS[r.calcType]}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">{r.calcType === "free" ? money(0) : money(r.baseRate)}</TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground">{condOf(r)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{deliveryWindowText(r)}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => { store.patchShippingRate(r.id, { active: !r.active }); toast.success(t("toastSaved")); }}
                        className={r.active ? "bg-green-600/10 px-2 py-0.5 text-[11px] font-bold text-green-700" : "bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground"}
                      >
                        {r.active ? t("seOn") : t("seOff")}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setTestOpen(true)} aria-label={`${t("shTestRate")} ${r.name}`} title={t("shTestRate")}>
                          <Play className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.addShippingRate({ ...r, id: `sr-${Date.now()}`, name: `${r.name} (Copy)`, active: false, updated: "2026-09-26" });
                          toast.success(t("toastSaved"));
                        }} aria-label={`${t("cpDuplicate")} ${r.name}`} title={t("cpDuplicate")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.patchShippingRate(r.id, { active: !r.active }); toast.success(t("toastSaved")); }} aria-label={`${t("poDisable")} ${r.name}`}>
                          <Power className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.removeShippingRate(r.id); toast.success(t("toastSaved")); }} aria-label={`${t("poDelete")} ${r.name}`}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          downloadCsv(`rate-${r.id}.csv`, ["rate", "amount"], [[r.name, r.baseRate]]);
                          toast.success(t("exported"));
                        }} aria-label={`${t("eDownload")} ${r.name}`}>
                          <Download className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <div className="py-8"><EmptyState icon={Truck} title={t("emptyTitle")} description={t("emptyDescription")} /></div>}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {filtered.length > 0 ? filtered.map((r) => (
            <div key={r.id} className="flex flex-col gap-1 border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold">{r.name}</span>
                <span className="font-heading text-base font-bold text-secondary">{r.calcType === "free" ? money(0) : money(r.baseRate)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{zoneName(r.zoneId)} · {CALC_TYPE_LABELS[r.calcType]} · {deliveryWindowText(r)}</p>
              <div className="flex gap-1.5 border-t border-border pt-2">
                <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => { store.patchShippingRate(r.id, { active: !r.active }); toast.success(t("toastSaved")); }}>
                  {r.active ? t("poDisable") : t("cpResume")}
                </Button>
                <Button size="sm" variant="outline" className="h-7 bg-card text-[11px]" onClick={() => setTestOpen(true)}>{t("shTestRate")}</Button>
              </div>
            </div>
          )) : <EmptyState icon={Truck} title={t("emptyTitle")} description={t("emptyDescription")} />}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Pencil className="size-3.5" aria-hidden="true" />
        <Link href="/vendor/shipping/rates/create" className="font-bold text-secondary hover:underline">{t("shCreateRate")}</Link>
      </p>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("shTestRate")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t("shDest")}>
                <Select value={tZone} onValueChange={(v) => setTZone(v ?? "")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {zones.filter((z) => z.active).map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={`${t("shOrderAmt")} (৳)`}>
              <Input type="number" min={0} value={tAmount} onChange={(e) => setTAmount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={`${t("shWeight")} (kg)`}>
              <Input type="number" min={0} value={tWeight} onChange={(e) => setTWeight(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
            </Field>
            <Field label={t("shQty")}>
              <Input type="number" min={1} value={tQty} onChange={(e) => setTQty(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
            </Field>
          </div>
          <div className="border border-border bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t("shPreview")} · {t("shOrderAmt")}: {money(tAmount)} · {tWeight}kg · {tQty}</p>
            {quote ? (
              <>
                <p className="pt-1"><span className="text-muted-foreground">{t("shMatchZone")}: </span><span className="font-bold">{quote.zoneName}</span></p>
                <p><span className="text-muted-foreground">{t("shMatchMethod")}: </span><span className="font-bold">{quote.method}</span></p>
                <p><span className="text-muted-foreground">{t("shFee")}: </span><span className="font-heading text-lg font-bold text-secondary">{money(quote.fee)}</span></p>
                <p><span className="text-muted-foreground">{t("shEtaCol")}: </span><span className="font-bold">{quote.eta}</span></p>
              </>
            ) : (
              <p className="pt-1 font-semibold text-destructive">{t("shNoMatch")}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="bg-card" onClick={() => setTestOpen(false)}>{t("cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
