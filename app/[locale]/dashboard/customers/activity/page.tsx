"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { Eye } from "lucide-react";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { CommissionTimeline } from "@/components/admin/commission/shared";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { useCustomerDirectory } from "@/components/admin/customers/useCustomerDirectory";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { activityForCustomer } from "@/features/admin/customer-mgmt";

export default function CustomerActivityPage() {
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const directory = useCustomerDirectory();
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const feed = useMemo(() => {
    const list = directory.flatMap((c) =>
      activityForCustomer(c.email, c.name, orders).map((a) => ({ ...a, customer: c.name, email: c.email }))
    );
    return list.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 60);
  }, [directory, orders]);

  const types = useMemo(() => [...new Set(feed.map((a) => a.type))], [feed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter(
      (a) =>
        (typeFilter === "all" || a.type === typeFilter) &&
        (!q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.customer.toLowerCase().includes(q))
    );
  }, [feed, query, typeFilter]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={tm("acTitle")}
        subtitle={tm("acSubtitle", { count: filtered.length })}
        highlightLabel={tm("tabActivity")}
        highlightValue={String(feed.length)}
        highlightIcon={Activity}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tm("acSearch")} className="bg-card pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tm("all")}</SelectItem>
            {types.map((ty) => (
              <SelectItem key={ty} value={ty}>{ty.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="border-border bg-card lg:col-span-3">
          <CardContent className="p-5">
            {filtered.length > 0 ? (
              <CommissionTimeline
                events={filtered.map((a) => ({
                  event: a.title,
                  date: a.date,
                  time: a.time,
                  user: a.customer,
                  description: a.description,
                }))}
              />
            ) : (
              <EmptyState icon={Eye} title={tm("emptyTitle")} description={tm("emptyActivity")} />
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card lg:col-span-2">
          <CardContent className="flex max-h-[560px] flex-col gap-1 overflow-y-auto p-2">
            {filtered.slice(0, 20).map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted">
                <CustomerAvatar name={a.customer} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.customer} · {a.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
