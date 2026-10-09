"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { TrackingStatusBadge } from "@/components/admin/returns/shared";
import type { TrackStatus } from "@/features/admin/returns";
import { useShipments } from "@/store/returns.store";

const STATUSES: TrackStatus[] = ["processing", "picked", "transit", "out", "delivered", "delayed", "failed", "returned"];

export default function TrackingHistoryPage() {
  const t = useTranslations("Dashboard.tracking");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const shipments = useShipments();
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TrackStatus>("all");
  const [providerFilter, setProviderFilter] = useState("all");

  const providers = useMemo(() => [...new Set(shipments.map((s) => s.provider))], [shipments]);

  const events = useMemo(
    () =>
      shipments.flatMap((s) =>
        s.events.map((e, i) => ({
          key: `${s.id}-${i}`,
          tracking: s.tracking,
          orderId: s.orderId,
          vendor: s.vendor,
          provider: s.provider,
          status: s.status,
          event: e.status,
          location: e.location,
          date: e.date,
          time: e.time,
          description: e.description,
        }))
      ),
    [shipments]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (statusFilter === "all" || e.status === statusFilter) &&
        (providerFilter === "all" || e.provider === providerFilter) &&
        (!q || e.tracking.toLowerCase().includes(q) || e.orderId.toLowerCase().includes(q) || e.status.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
    );
  }, [events, query, statusFilter, providerFilter]);

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("tracking")}
        title={t("hTitle")}
        subtitle={t("hSubtitle", { count: filtered.length })}
        highlightLabel={t("tEvent")}
        highlightValue={num(events.length)}
        highlightIcon={History}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as TrackStatus | "all") ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label={t("tProvider")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tTracking")}</TableHead>
                  <TableHead>{t("tEvent")}</TableHead>
                  <TableHead>{t("tLocation")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead>{t("tDate")}</TableHead>
                  <TableHead>{t("tProvider")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((e) => (
                  <TableRow key={e.key}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{e.tracking}</p>
                      <p className="font-mono text-xs text-muted-foreground">{e.orderId}</p>
                    </TableCell>
                    <TableCell className="max-w-52 truncate text-sm font-semibold" title={e.description}>
                      {e.event}
                      <span className="block truncate text-xs font-normal text-muted-foreground" title={e.description}>{e.description}</span>
                    </TableCell>
                    <TableCell className="max-w-36 truncate text-xs text-muted-foreground" title={e.location}>{e.location}</TableCell>
                    <TableCell>
                      <TrackingStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{e.date} · {e.time}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{e.provider}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={History} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
