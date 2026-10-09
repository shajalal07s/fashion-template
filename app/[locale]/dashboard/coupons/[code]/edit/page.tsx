"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { PackageSearch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useCouponsStore, useCoupons, type Coupon } from "@/store/coupons.store";
import { toast } from "sonner";

export default function CouponEditPage() {
  const t = useTranslations("Dashboard.admin");
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code);
  const router = useRouter();

  const coupons = useCoupons();
  const patchCoupon = useCouponsStore((s) => s.patch);
  const coupon = useMemo(() => coupons.find((c) => c.code === code), [coupons, code]);

  const [draftCode, setDraftCode] = useState<string | null>(null);
  const [draftDiscount, setDraftDiscount] = useState<string | null>(null);
  const [draftLimit, setDraftLimit] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<Coupon["status"] | null>(null);
  const [draftExpiry, setDraftExpiry] = useState<string | null>(null);

  if (!coupon) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader
          title={t("coupons.editTitle")}
          description={code}
          actions={
            <Link href="/dashboard/coupons">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("products.epBack")}
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={PackageSearch}
          title={t("orders.emptyTitle")}
          description={t("orders.emptyDescription")}
          action={
            <Link href="/dashboard/coupons">
              <Button size="sm" className="gap-1.5">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("orders.detailsClose")}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleSave = () => {
    patchCoupon(coupon.code, {
      code: (draftCode ?? coupon.code).toUpperCase().replace(/\s+/g, ""),
      discount: draftDiscount ?? coupon.discount,
      limit: draftLimit ?? coupon.limit,
      status: draftStatus ?? coupon.status,
      expiry: draftExpiry ?? coupon.expiry,
    });
    toast.success(t("coupons.toastUpdated"));
    router.push("/dashboard/coupons");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("coupons.editTitle")}
        description={coupon.code}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/coupons">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("products.epBack")}
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("products.editSave")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("coupons.viewTitle")}>
          <Field label={t("coupons.tableCode")}>
            <Input
              value={draftCode ?? coupon.code}
              onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
              className="bg-card font-mono tracking-widest"
            />
          </Field>
          <Field label={t("coupons.tableDiscount")}>
            <Input
              value={draftDiscount ?? coupon.discount}
              onChange={(e) => setDraftDiscount(e.target.value)}
              className="bg-card"
              placeholder="20% OFF"
            />
          </Field>
          <Field label={t("coupons.tableUsage")}>
            <Input
              type="number"
              min={1}
              value={draftLimit ?? coupon.limit}
              onChange={(e) => setDraftLimit(Math.max(1, Number(e.target.value) || 1))}
              className="bg-card"
            />
          </Field>
        </SectionCard>

        <SectionCard title={t("products.epStatus")}>
          <Field label={t("coupons.tableStatus")}>
            <Select
              value={draftStatus ?? coupon.status}
              onValueChange={(v) => setDraftStatus(v as Coupon["status"])}
            >
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("coupons.active")}</SelectItem>
                <SelectItem value="scheduled">{t("coupons.scheduled")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("coupons.tableExpiry")}>
            <Input
              value={draftExpiry ?? coupon.expiry}
              onChange={(e) => setDraftExpiry(e.target.value)}
              className="bg-card"
              placeholder="31 Dec 2026"
            />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("coupons.tableUsage")}</span>
            <span className="font-medium">
              {coupon.used} / {draftLimit ?? coupon.limit}
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              style={{
                width: `${Math.min(100, Math.round((coupon.used / Math.max(1, draftLimit ?? coupon.limit)) * 100))}%`,
              }}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
