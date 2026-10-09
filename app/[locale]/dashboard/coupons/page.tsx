"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Scissors, Search, TicketPercent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CouponsTable } from "@/components/admin/coupons/CouponsTable";
import { useCouponsStore, useCoupons } from "@/store/coupons.store";
import { toast } from "sonner";

export default function DashboardCouponsPage() {
  const t = useTranslations("Dashboard.admin");
  const coupons = useCoupons();
  const removeCoupons = useCouponsStore((s) => s.remove);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) => c.code.toLowerCase().includes(q) || c.discount.toLowerCase().includes(q)
    );
  }, [coupons, query]);

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.status === "active").length;
    const usage = coupons.reduce((n, c) => n + c.used, 0);
    return [
      { label: t("coupons.statTotal"), value: String(coupons.length), icon: TicketPercent, iconClassName: "bg-primary/15 text-secondary" },
      { label: t("coupons.statActive"), value: String(active), icon: Scissors, iconClassName: "bg-green-600/10 text-green-700" },
      { label: t("coupons.statUsage"), value: usage.toLocaleString(), icon: TicketPercent, iconClassName: "bg-secondary/15 text-secondary" },
    ];
  }, [coupons, t]);

  const handleBulkDelete = (codes: string[]) => {
    removeCoupons(codes);
    toast.success(t("coupons.toastDeleted", { count: codes.length }));
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("coupons.title")}
        description={t("coupons.subtitle", { count: filtered.length })}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className="font-heading truncate text-2xl font-bold text-foreground">
                  {s.value}
                </p>
              </div>
              <span className={`flex size-11 shrink-0 items-center justify-center ${s.iconClassName}`}>
                <s.icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("coupons.searchPlaceholder")}
            className="bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) || 10)}>
            <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CouponsTable
        rows={filtered}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
