"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BadgePercent, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { useProductDiscounts, useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { EarnStatCard } from "@/components/vendor/earnings-shared";
import { CouponTabs } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

export default function VendorProductDiscountPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const discounts = useProductDiscounts();
  const products = useVendorProducts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [dtype, setDtype] = useState<"percent" | "fixed">("percent");
  const [dvalue, setDvalue] = useState(10);

  const stats = useMemo(() => ({
    active: discounts.filter((d) => d.status === "active").length,
    scheduled: discounts.filter((d) => d.status === "scheduled").length,
    expired: discounts.filter((d) => d.status === "expired").length,
    sale: discounts.reduce((n, d) => n + (d.price - d.salePrice), 0),
    units: discounts.reduce((n, d) => n + d.sales, 0),
  }), [discounts]);

  const saleFor = (price: number) =>
    dtype === "percent" ? Math.max(0, Math.round(price * (1 - dvalue / 100))) : Math.max(0, price - dvalue);

  const create = () => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    store.addDiscount({
      id: `pd-${Date.now()}`, productId: p.id, name: p.name, sku: p.sku, image: p.image,
      price: p.price, dtype, dvalue, salePrice: saleFor(p.price),
      start: "2026-09-26", end: "2026-10-10", status: "scheduled", sales: 0,
    });
    store.notifyVendor(`Discount created for ${p.name}.`, "info");
    setCreateOpen(false);
    toast.success(t("toastSaved"));
  };

  const applyBulk = () => {
    for (const id of selected) {
      const d = discounts.find((x) => x.id === id);
      if (!d) continue;
      const sale = dtype === "percent"
        ? Math.max(0, Math.round(d.price * (1 - bulkValue / 100)))
        : Math.max(0, d.price - bulkValue);
      store.patchDiscount(id, { dtype, dvalue: bulkValue, salePrice: sale });
    }
    setBulkOpen(false);
    setSelected(new Set());
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={t("cpDiscount")} subtitle={t("cpSubtitle")}
        highlightLabel={t("cpDiscount")} highlightValue={num(discounts.length)} highlightIcon={BadgePercent}
      >
        <button type="button" onClick={() => setCreateOpen(true)} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("cpCreate")}
        </button>
      </AccountingHero>

      <CouponTabs />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <EarnStatCard label={t("cpActive")} value={num(stats.active)} href="/vendor/coupons/product-discount" accent />
        <EarnStatCard label={t("cpScheduled")} value={num(stats.scheduled)} href="/vendor/coupons/product-discount" />
        <EarnStatCard label={t("cpExpired")} value={num(stats.expired)} href="/vendor/coupons/product-discount" />
        <EarnStatCard label={t("cpDiscountGiven")} value={money(stats.sale)} href="/vendor/coupons/product-discount" />
        <EarnStatCard label={t("cpUnits")} value={num(stats.units)} href="/vendor/coupons/product-discount" />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <p className="text-sm font-semibold">{selected.size} selected</p>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" className="h-8" onClick={() => setBulkOpen(true)}>{t("cpBulk")}: 10% / 20% / 30%</Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive" onClick={() => { store.removeDiscounts([...selected]); setSelected(new Set()); toast.success(t("toastSaved")); }}>
                {t("poDelete")}
              </Button>
            </div>
          </div>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          {discounts.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={discounts.length > 0 && discounts.every((d) => selected.has(d.id))}
                      onCheckedChange={(v) => setSelected(v === true ? new Set(discounts.map((d) => d.id)) : new Set())}
                      aria-label={t("cpDiscount")}
                    />
                  </TableHead>
                  <TableHead>{t("eProduct")}</TableHead>
                  <TableHead className="text-right">{t("cpOrigPrice")}</TableHead>
                  <TableHead className="text-right">{t("cpValue")}</TableHead>
                  <TableHead className="text-right">{t("cpSalePrice")}</TableHead>
                  <TableHead>{t("cpStatus")}</TableHead>
                  <TableHead className="w-28">{t("cpActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(d.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(d.id); else next.delete(d.id);
                        return next;
                      })} aria-label={d.sku} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/vendor/products/${d.productId}`} className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.image} alt={d.name} className="size-9 shrink-0 object-cover" loading="lazy" />
                        <span className="min-w-0">
                          <span className="block max-w-36 truncate text-sm font-bold hover:text-secondary hover:underline">{d.name}</span>
                          <span className="block font-mono text-[11px] text-muted-foreground">{d.sku} · {num(d.sales)} sold</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(d.price)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">{d.dtype === "percent" ? `${d.dvalue}%` : money(d.dvalue)}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(d.salePrice)}</TableCell>
                    <TableCell><span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-[#8a5a00]">{d.status}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => {
                          store.patchDiscount(d.id, { status: d.status === "active" ? "paused" : "active" });
                          toast.success(t("toastSaved"));
                        }} aria-label={d.status === "active" ? t("cpPause") : t("cpResume")}>
                          {d.status === "active" ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                        </Button>
                        <Link href={`/vendor/products/${d.productId}`}>
                          <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${d.name}`}><Pencil className="size-4" aria-hidden="true" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.removeDiscounts([d.id]); toast.success(t("toastSaved")); }} aria-label={`${t("poDelete")} ${d.name}`}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <div className="py-8"><EmptyState icon={BadgePercent} title={t("cpEmpty")} description={t("cpEmptyDesc")} /></div>}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpCreate")}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <Field label={t("eProduct")}>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {money(p.price)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("cpType")}>
                <Select value={dtype} onValueChange={(v) => setDtype((v as typeof dtype) ?? "percent")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="fixed">{money(1).replace(/[\d.,\s]/g, "") || "৳"}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("cpValue")}>
                <Input type="number" min={1} value={dvalue} onChange={(e) => setDvalue(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
            </div>
            {(() => {
              const p = products.find((x) => x.id === productId);
              return p ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("cpOrigPrice")}: </span><span className="font-bold">{money(p.price)}</span>
                  {" → "}
                  <span className="text-muted-foreground">{t("cpSalePrice")}: </span><span className="font-bold text-green-700">{money(saleFor(p.price))}</span>
                </p>
              ) : null;
            })()}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>{t("cancel")}</Button>
              <Button size="sm" onClick={create}>{t("cpCreate")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("cpBulk")} ({selected.size})</DialogTitle>
            <DialogDescription>{t("cpConfirmBulk")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            {[10, 20, 30].map((v) => (
              <Button key={v} variant={bulkValue === v ? "default" : "outline"} size="sm" className={bulkValue === v ? "" : "bg-card"} onClick={() => setBulkValue(v)}>
                {v}%
              </Button>
            ))}
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={applyBulk}>{t("cpConfirmBulk")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
