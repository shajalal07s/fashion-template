"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, MapPin, Receipt, Save, ShoppingCart, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OutcomeBadge } from "@/components/admin/calls/shared";
import { MapDialog } from "@/components/admin/MapDialog";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import { decodeCustomerKey } from "@/features/admin/customer-key";
import { useAdminCustomersStore } from "@/store/admin-customers.store";
import { demoLogs } from "@/features/admin/calls";
import { toast } from "sonner";

export default function CustomerEditPage() {
  const t = useTranslations("Dashboard.admin");
  const tc = useTranslations("Dashboard.calls");
  const format = useFormatter();
  const params = useParams<{ email: string }>();
  const email = decodeCustomerKey(params.email);
  const router = useRouter();
  const orders = useAdminOrders();

  const overrides = useAdminCustomersStore((s) => s.overrides);
  const deleted = useAdminCustomersStore((s) => s.deleted);
  const manual = useAdminCustomersStore((s) => s.manual);
  const setOverride = useAdminCustomersStore((s) => s.setOverride);
  const removeCustomer = useAdminCustomersStore((s) => s.removeCustomer);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const base = useMemo(() => {
    const key = email.toLowerCase();
    if (deleted.includes(key)) return null;
    const m = manual.find((x) => x.email.toLowerCase() === key);
    if (m) return m;
    const found = buildCustomers(orders).find((c) => c.email.toLowerCase() === key);
    if (!found) return null;
    const patch = overrides[key] ?? {};
    const ship = [...orders]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .find((o) => o.customerEmail.toLowerCase() === key);
    return {
      ...found,
      name: patch.name ?? found.name,
      phone: patch.phone ?? found.phone,
      city: patch.city ?? found.city,
      address: ship?.address ?? "",
    };
  }, [email, orders, overrides, deleted, manual]);

  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const customerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.customerEmail.toLowerCase() === email.toLowerCase())
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [orders, email]
  );

  const customerCalls = useMemo(() => {
    if (!base) return [];
    return demoLogs
      .filter((l) => l.customer === base.name)
      .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
      .slice(0, 5);
  }, [base]);

  if (!base) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("customers.editCustomer")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("customers.emptyTitle")} description={t("customers.emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const vName = name ?? base.name;
  const vPhone = phone ?? base.phone;
  const vCity = city ?? base.city;

  const save = () => {
    if (!vName.trim()) return;
    setOverride(email, { name: vName.trim(), phone: vPhone.trim(), city: vCity.trim() });
    toast.success(t("customers.toastUpdated"));
  };

  const remove = () => {
    removeCustomer([email]);
    toast.success(t("customers.toastDeleted", { count: 1 }));
    router.push("/dashboard/customers");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("customers.editCustomer")} · ${base.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/customers">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {tc("back")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("products.bulkDelete")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={save}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("products.editSave")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("customers.tableOrders")}
          value={String(base.orders)}
          delta={0}
          icon={ShoppingCart}
        />
        <StatCard
          label={t("customers.tableSpent")}
          value={money(base.spent)}
          delta={0}
          icon={Receipt}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("customers.tableLastOrder")}
          value={base.orders > 0 ? dateOf(base.lastOrder) : "—"}
          delta={0}
          icon={Receipt}
          iconClassName="bg-green-600/10 text-green-700"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={t("customers.editCustomer")}>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center bg-secondary text-xl font-bold text-white"
            >
              {vName[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold">{vName || base.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Field label={t("customers.tableCustomer")}>
            <Input value={vName} onChange={(e) => setName(e.target.value)} className="bg-card" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("customers.tablePhone")}>
              <Input value={vPhone} onChange={(e) => setPhone(e.target.value)} className="bg-card" />
            </Field>
            <Field label={t("customers.tableCity")}>
              <Input value={vCity} onChange={(e) => setCity(e.target.value)} className="bg-card" />
            </Field>
          </div>
          <Field label={t("customers.tableAddress")}>
            <div className="flex items-center gap-2 border border-dashed border-border bg-muted/40 px-3 py-2.5">
              <MapPin className="size-4 shrink-0 text-secondary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {base.address ? `${base.address}, ${base.city}` : "—"}
              </span>
              {base.address ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 text-secondary hover:text-secondary"
                  onClick={() => setMapOpen(true)}
                >
                  {tc("viewOnMap")}
                </Button>
              ) : null}
            </div>
          </Field>
        </SectionCard>

        <SectionCard
          title={`${t("orders.title")} (${customerOrders.length})`}
          action={
            <Button size="sm" className="h-8 gap-1.5" onClick={save}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("products.editSave")}
            </Button>
          }
        >
          <div className="flex flex-col divide-y divide-border border border-border">
            {customerOrders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-xs font-bold">{o.id}</span>
                  <span className="text-xs text-muted-foreground">{dateOf(o.date)}</span>
                </span>
                <StatusBadge status={o.status} />
                <span className="shrink-0 text-sm font-bold text-secondary">{money(o.total)}</span>
              </div>
            ))}
            {customerOrders.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{t("customers.emptyDescription")}</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {customerCalls.length > 0 ? (
        <SectionCard title={`${tc("recentTitle")} (${customerCalls.length})`}>
          <div className="flex flex-col divide-y divide-border border border-border">
            {customerCalls.map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/calls/call-log/${l.id}`}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="font-mono text-xs font-bold text-secondary">{l.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{l.agent}</span>
                <OutcomeBadge outcome={l.outcome} />
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <MapDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        query={base.address ? `${base.address}, ${base.city}, Bangladesh` : null}
        title={base.name}
      />
    </div>
  );
}
