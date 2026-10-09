"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import {
  BlockCustomerDialog,
  CustomerAvatar,
  CustomerStatusBadge,
} from "@/components/admin/customers/shared";
import { useCustomerDirectory } from "@/components/admin/customers/useCustomerDirectory";
import type { BlockInfo } from "@/features/admin/customer-mgmt";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import { EmptyState } from "@/components/common/EmptyState";

export default function BlockedCustomersPage() {
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const directory = useCustomerDirectory();
  const mgmt = useCustomerMgmtStore();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<{ email: string; name: string; mode: "block" | "unblock" } | null>(null);

  const blocked = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.filter(
      (c) =>
        c.status === "blocked" &&
        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  }, [directory, query]);

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={tm("bTitle")}
        subtitle={tm("bSubtitle", { count: blocked.length })}
        highlightLabel={tm("blocked")}
        highlightValue={String(blocked.length)}
        highlightIcon={Ban}
      />

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tm("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      {blocked.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {blocked.map((c) => {
            const info = mgmt.blockInfo[c.email.toLowerCase()];
            return (
              <Card key={c.email} className="overflow-hidden border-border bg-card py-0">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar name={c.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <span className="ml-auto">
                      <CustomerStatusBadge status={c.status} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tm("blockReason")}</span>
                      <span className="font-semibold">{info?.reason ?? "Policy violation"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tm("tLastActive")}</span>
                      <span className="font-medium">{dateOf(c.lastOrder)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tm("lastUpdated")}</span>
                      <span className="font-medium">{info?.date ?? dateOf(c.lastOrder)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setTarget({ email: c.email, name: c.name, mode: "unblock" })}
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    {tm("unblockBtn")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Ban} title={tm("emptyTitle")} description={tm("emptyDescription")} />
          </CardContent>
        </Card>
      )}

      <BlockCustomerDialog
        open={!!target}
        customerName={target?.name ?? ""}
        mode={target?.mode ?? "unblock"}
        onClose={() => setTarget(null)}
        onConfirm={(info?: BlockInfo) => {
          if (!target) return;
          if (target.mode === "unblock") mgmt.setStatus(target.email, "active");
          else mgmt.setStatus(target.email, "blocked", info);
        }}
      />
    </div>
  );
}
