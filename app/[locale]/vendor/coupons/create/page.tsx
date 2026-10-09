"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Dices, Ticket } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { COUPON_TYPES, couponSchema, generateCouponCode, type CouponType } from "@/features/vendor/coupons";
import { useVendorStore } from "@/store/vendor.store";
import { CouponTabs } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

export default function VendorCouponCreatePage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const router = useRouter();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [code, setCode] = useState(generateCouponCode("SAVE"));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState(20);
  const [minOrder, setMinOrder] = useState(1500);
  const [maxDiscount, setMaxDiscount] = useState(1000);
  const [usageLimit, setUsageLimit] = useState(500);
  const [perCustomer, setPerCustomer] = useState(2);
  const [start, setStart] = useState("2026-09-26");
  const [expiry, setExpiry] = useState("2026-10-31");
  const [audience, setAudience] = useState<"all" | "new" | "existing">("all");
  const [stackable, setStackable] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const previewText = useMemo(() => {
    if (type === "percent") return `${value}% ${t("cpOff")}`;
    if (type === "shipping") return t("shipping");
    return `৳${value} ${t("cpOff")}`;
  }, [type, value, t]);

  const review = () => {
    const parsed = couponSchema.safeParse({
      code: code.trim().toUpperCase(), name: name.trim(), description,
      type, value, minOrder, maxDiscount, usageLimit, perCustomer, start, expiry, audience, stackable,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid coupon");
      return;
    }
    if (new Date(expiry) <= new Date(start)) {
      setError("Expiry must be after start date.");
      return;
    }
    setError("");
    setConfirm(true);
  };

  const create = () => {
    const id = `vc-${Date.now()}`;
    store.addCoupon({
      id, code: code.trim().toUpperCase(), name: name.trim(), description,
      type, value, minOrder, maxDiscount, usageLimit, perCustomer,
      used: 0, start, expiry, scope: t("cpAllProducts"), products: [], categories: [],
      audience, stackable, status: "scheduled",
      revenue: 0, discountGiven: 0, orders: 0, updated: "2026-09-26",
    });
    store.notifyVendor(`Coupon ${code} created.`, "info");
    setConfirm(false);
    toast.success(t("toastSaved"));
    router.push(`/vendor/coupons/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={t("cpCreate")} subtitle={t("cpSubtitle")}
        highlightLabel={t("cpCode")} highlightValue={code} highlightIcon={Ticket}
      >
        <Link href="/vendor/coupons/list" className="flex items-center gap-1.5 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("cpList")}
        </Link>
      </AccountingHero>

      <CouponTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("cpName")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <Field label={t("cpCode")}>
                <div className="flex gap-1.5">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="bg-card font-mono" maxLength={20} />
                  <Button variant="outline" size="icon" className="shrink-0 bg-card" onClick={() => setCode(generateCouponCode("SAVE"))} aria-label={t("cpGenerate")} title={t("cpGenerate")}>
                    <Dices className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </Field>
              <Field label={t("cpName")}>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Festive 10% Off" className="bg-card" maxLength={60} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("cpDesc")}>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-card" maxLength={200} />
                </Field>
              </div>
              <Field label={t("cpType")}>
                <Select value={type} onValueChange={(v) => setType((v as CouponType) ?? "percent")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUPON_TYPES.map((ct) => <SelectItem key={ct.value} value={ct.value}>{ct.value} · {ct.hint}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("cpValue")}>
                <Input type="number" min={1} value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("cpRestrictions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
              <Field label={t("cpMinOrder")}><Input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={t("cpMaxDisc")}><Input type="number" min={0} value={maxDiscount} onChange={(e) => setMaxDiscount(Math.max(0, Number(e.target.value) || 0))} className="bg-card" /></Field>
              <Field label={t("cpLimit")}><Input type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(Math.max(1, Number(e.target.value) || 1))} className="bg-card" /></Field>
              <Field label={t("cpPerCustomer")}><Input type="number" min={1} value={perCustomer} onChange={(e) => setPerCustomer(Math.max(1, Number(e.target.value) || 1))} className="bg-card" /></Field>
              <Field label={t("cpStart")}><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-card" /></Field>
              <Field label={t("cpExpiry")}><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-card" /></Field>
              <Field label={t("cpAudience")}>
                <Select value={audience} onValueChange={(v) => setAudience((v as typeof audience) ?? "all")}>
                  <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("cpEveryone")}</SelectItem>
                    <SelectItem value="new">{t("cpNewOnly")}</SelectItem>
                    <SelectItem value="existing">{t("cpExistingOnly")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <Checkbox checked={stackable} onCheckedChange={(v) => setStackable(v === true)} aria-label={t("cpStack")} />
                {t("cpStack")}
              </label>
            </CardContent>
          </Card>

          {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Link href="/vendor/coupons/list"><Button variant="outline" className="bg-card">{t("cancel")}</Button></Link>
            <Button onClick={review}>{t("cpCreate")}</Button>
          </div>
        </div>

        <Card className="h-fit border-secondary/50 bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpPreview")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-col items-center gap-1 border-2 border-dashed border-secondary/50 bg-secondary/5 p-6 text-center">
              <p className="font-mono text-2xl font-bold tracking-widest text-secondary">{code || "SAVE20"}</p>
              <p className="font-heading text-xl font-bold">{previewText}</p>
              <p className="max-w-56 truncate text-xs text-muted-foreground">{name || t("cpName")}</p>
              <p className="text-xs text-muted-foreground">{t("cpMaxDisc")} {money(maxDiscount)}</p>
              <p className="text-xs text-muted-foreground">{t("cpValidUntil")}: {expiry}</p>
              <Button size="sm" variant="outline" className="mt-2 bg-card" onClick={() => { void navigator.clipboard.writeText(code); toast.success(t("cpCopy")); }}>
                <Copy className="size-3.5" aria-hidden="true" />
                {t("cpCopy")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{code} · {previewText}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-border text-sm">
            <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpMinOrder")}</span><span className="font-bold">{money(minOrder)}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpLimit")}</span><span className="font-bold">{usageLimit}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpExpiry")}</span><span className="font-semibold">{start} → {expiry}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpAudience")}</span><span className="font-semibold">{audience}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={create}>{t("cpCreate")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
