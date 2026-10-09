"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Megaphone, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { useCampaigns, useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { CouponTabs } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["Application Submitted", "Under Review", "Approved", "Campaign Active", "Campaign Completed"];

export default function VendorCampaignDetailsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const params = useParams<{ campaignId: string }>();
  const id = params.campaignId;
  const campaigns = useCampaigns();
  const products = useVendorProducts();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const campaign = useMemo(() => campaigns.find((c) => c.id === id), [campaigns, id]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [vendorNote, setVendorNote] = useState("");

  if (!campaign) {
    return (
      <div className="flex flex-col gap-6">
        <AccountingHero eyebrow={t("nav_coupons")} title={t("cpCampaigns")} subtitle={id} highlightLabel={t("cpStatus")} highlightValue="—" highlightIcon={Megaphone}>
          <Link href="/vendor/coupons/campaigns" className={heroPillClassName}>
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("cpCampaigns")}
          </Link>
        </AccountingHero>
        <EmptyState icon={Megaphone} title={t("cpEmpty")} description={t("cpEmptyDesc")} />
      </div>
    );
  }

  const eligible = (price: number) => price >= 500;
  const campaignPrice = (price: number) => Math.round(price * (1 - campaign.requiredDiscount / 100));

  const submit = () => {
    if (picked.size === 0) {
      toast.error(t("errRequired"));
      return;
    }
    store.patchCampaign(campaign.id, { status: "applied", products: picked.size, note: vendorNote || "Application submitted." });
    store.notifyVendor(`Campaign application submitted: ${campaign.name}.`, "info");
    toast.success(t("toastSaved"));
  };

  const stepIndex =
    campaign.status === "open" ? 0
    : campaign.status === "applied" || campaign.status === "review" ? 1
    : campaign.status === "approved" ? 2
    : campaign.status === "active" ? 3
    : 4;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")} title={campaign.name} subtitle={`${campaign.start} → ${campaign.end}`}
        highlightLabel={t("cpRequired")} highlightValue={`${campaign.requiredDiscount}%`} highlightIcon={Megaphone}
      >
        <Link href="/vendor/coupons/campaigns" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("cpCampaigns")}
        </Link>
      </AccountingHero>

      <CouponTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpCampaigns")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm">
            <p className="text-muted-foreground">{campaign.description}</p>
            <div className="mt-3 flex flex-col divide-y divide-border">
              <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpDeadline")}</span><span className="font-bold">{campaign.deadline}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpRequired")}</span><span className="font-bold text-secondary">{campaign.requiredDiscount}%</span></div>
              <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("cpStatus")}</span><span className="font-bold">{campaign.status}</span></div>
            </div>
            {campaign.status === "rejected" ? (
              <p className="mt-3 border border-destructive/30 bg-destructive/5 p-2.5 text-sm font-semibold text-destructive" role="alert">
                {t("cpRejectReason")}: {campaign.note || "—"}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("cpAppTimeline")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ol className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    i <= stepIndex ? "bg-green-600 text-white" : "bg-muted text-muted-foreground")}>
                    {i + 1}
                  </span>
                  <span className={cn(i <= stepIndex ? "font-bold" : "text-muted-foreground")}>{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("cpEligible")} · {t("eProduct")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-4">
          {products.slice(0, 6).map((p) => {
            const ok = eligible(p.price);
            const checked = picked.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (!ok) return;
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  });
                }}
                disabled={!ok}
                className={cn("flex items-center gap-3 border p-2.5 text-left transition-colors",
                  checked ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary",
                  !ok && "opacity-60")}
                aria-pressed={checked}
              >
                <Checkbox checked={checked} aria-label={p.name} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="size-10 shrink-0 object-cover" loading="lazy" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {money(p.price)} · {t("cpRequired")}: {campaign.requiredDiscount}% · {t("cpCampaignPrice")}: {money(campaignPrice(p.price))} · {t("cpStock")}: {p.stock}
                  </span>
                </span>
                {ok ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-green-700">
                    <CheckCircle className="size-3.5" aria-hidden="true" />
                    {t("cpEligible")}
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-destructive">
                    <XCircle className="size-3.5" aria-hidden="true" />
                    {t("cpNotEligible")}
                  </span>
                )}
              </button>
            );
          })}
          <Field label={t("cpVendorNote")}>
            <Input value={vendorNote} onChange={(e) => setVendorNote(e.target.value)} className="bg-card" maxLength={200} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="bg-card" onClick={() => setPicked(new Set())}>{t("eReset")}</Button>
            <Button size="sm" onClick={submit} disabled={campaign.status !== "open" && campaign.status !== "applied"}>
              {t("cpSubmitApp")} ({picked.size})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
