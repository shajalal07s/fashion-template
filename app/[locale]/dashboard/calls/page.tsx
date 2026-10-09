"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  Clock3,
  Copy,
  Eye,
  ListOrdered,
  MapPin,
  Pencil,
  PhoneCall,
  PhoneIncoming,
  Printer,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { MapDialog } from "@/components/admin/MapDialog";
import { OutcomeBadge, QueueStatusBadge, useCallFormat } from "@/components/admin/calls/shared";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { CALL_AGENTS, demoLogs, demoQueue, formatDuration, type CallLog } from "@/features/admin/calls";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import { encodeCustomerKey } from "@/features/admin/customer-key";
import { toast } from "sonner";

function CustomerCellLink({
  customer,
  phone,
  email,
  copied,
  onCopy,
}: {
  customer: string;
  phone: string;
  email?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const body = (
    <>
      <span className="text-sm font-medium whitespace-nowrap text-foreground">{customer}</span>
      <span className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
        {phone}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCopy();
          }}
          aria-label={phone}
          title={phone}
          className="flex size-5 items-center justify-center transition-colors hover:bg-muted hover:text-secondary"
        >
          {copied ? (
            <Check className="size-3 text-green-600" aria-hidden="true" />
          ) : (
            <Copy className="size-3" aria-hidden="true" />
          )}
        </button>
      </span>
    </>
  );
  if (!email) return <span className="flex flex-col items-start text-left">{body}</span>;
  return (
    <Link
      href={`/dashboard/customers/${encodeCustomerKey(email)}`}
      className="flex flex-col items-start text-left hover:underline"
    >
      {body}
    </Link>
  );
}

export default function CallsOverviewPage() {
  const t = useTranslations("Dashboard.calls");
  const { date, time } = useCallFormat();
  const [logs, setLogs] = useState<CallLog[]>(demoLogs);
  const orders = useAdminOrders();
  const emailByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of buildCustomers(orders)) {
      if (!map.has(c.name)) map.set(c.name, c.email);
    }
    return map;
  }, [orders]);

  const addressByName = useMemo(() => {
    const map = new Map<string, { address: string; city: string }>();
    const sorted = [...orders].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    for (const o of sorted) {
      if (!map.has(o.customerName) && o.address) {
        map.set(o.customerName, { address: o.address, city: o.city });
      }
    }
    return map;
  }, [orders]);

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      toast.success(t("copied"));
      window.setTimeout(() => setCopiedPhone(null), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  const completed = useMemo(() => logs.filter((l) => l.outcome === "completed"), [logs]);
  const waiting = useMemo(() => demoQueue.filter((q) => q.status === "waiting"), []);
  const avgSec = useMemo(
    () =>
      completed.length
        ? Math.round(completed.reduce((n, l) => n + l.durationSec, 0) / completed.length)
        : 0,
    [completed]
  );
  const slices = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) map.set(l.outcome, (map.get(l.outcome) ?? 0) + 1);
    return [...map.entries()].map(([id, value]) => ({
      id: id[0].toUpperCase() + id.slice(1),
      label: id[0].toUpperCase() + id.slice(1),
      value,
    }));
  }, [logs]);
  const recent = useMemo(() => logs.slice(0, 8), [logs]);
  const queuePreview = useMemo(
    () => demoQueue.filter((q) => q.status !== "done").slice(0, 5),
    []
  );

  type RecentSort = "customer" | "duration" | "date";
  const [recentSort, setRecentSort] = useState<RecentSort>("date");
  const [recentDir, setRecentDir] = useState<"asc" | "desc">("desc");
  const [editId, setEditId] = useState<string | null>(null);
  const [draftAgent, setDraftAgent] = useState("");
  const [draftOutcome, setDraftOutcome] = useState<CallLog["outcome"]>("completed");
  const [draftDuration, setDraftDuration] = useState(0);
  const [printId, setPrintId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [mapQuery, setMapQuery] = useState<{ query: string; title: string } | null>(null);

  const sortedRecent = useMemo(() => {
    const list = [...recent];
    const dir = recentDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (recentSort === "customer") return a.customer.localeCompare(b.customer) * dir;
      if (recentSort === "duration") return (a.durationSec - b.durationSec) * dir;
      return (+new Date(a.startedAt) - +new Date(b.startedAt)) * dir;
    });
    return list;
  }, [recent, recentSort, recentDir]);

  const toggleRecentSort = (key: RecentSort) => {
    if (recentSort === key) setRecentDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setRecentSort(key);
      setRecentDir(key === "customer" ? "asc" : "desc");
    }
  };

  const recentSortIcon = (key: RecentSort) => {
    if (recentSort !== key) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />;
    return recentDir === "asc" ? (
      <ArrowUp className="size-3.5 text-secondary" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3.5 text-secondary" aria-hidden="true" />
    );
  };

  const openEdit = (log: CallLog) => {
    setDraftAgent(log.agent);
    setDraftOutcome(log.outcome);
    setDraftDuration(log.durationSec);
    setEditId(log.id);
  };

  const saveEdit = () => {
    if (!editId) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.id === editId
          ? { ...l, agent: draftAgent, outcome: draftOutcome, durationSec: draftDuration }
          : l
      )
    );
    toast.success(t("toastUpdated"));
    setEditId(null);
  };

  const editLog = editId ? logs.find((l) => l.id === editId) ?? null : null;
  const printLog = printId ? logs.find((l) => l.id === printId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Link href="/dashboard/calls/queue">
            <Button variant="outline" size="sm" className="gap-1.5 bg-card">
              {t("viewAll")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("kpiCalls")}
          value={String(logs.length)}
          delta={12}
          deltaSuffix={t("vsLastWeek")}
          icon={PhoneCall}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("kpiQueued")}
          value={String(waiting.length)}
          delta={8}
          deltaSuffix={t("vsLastWeek")}
          icon={ListOrdered}
          iconClassName="bg-primary/15 text-secondary"
        />
        <StatCard
          label={t("kpiCompleted")}
          value={String(completed.length)}
          delta={15}
          deltaSuffix={t("vsLastWeek")}
          icon={PhoneIncoming}
          iconClassName="bg-green-600/10 text-green-700"
        />
        <StatCard
          label={t("kpiAvgDuration")}
          value={formatDuration(avgSec)}
          delta={-4}
          deltaSuffix={t("vsLastWeek")}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">{t("chartTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("chartSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={slices} unitLabel={t("callsUnit")} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card pt-5 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
            <div>
              <CardTitle className="font-heading text-lg font-bold">{t("recentTitle")}</CardTitle>
            </div>
            <Link href="/dashboard/calls/call-log">
              <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary">
                {t("viewAll")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:h-12 [&_th]:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableId")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleRecentSort("customer")}
                      className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-foreground"
                    >
                      {t("tableCustomer")}
                      {recentSortIcon("customer")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableDirection")}</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleRecentSort("duration")}
                      className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-foreground"
                    >
                      {t("tableDuration")}
                      {recentSortIcon("duration")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleRecentSort("date")}
                      className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-foreground"
                    >
                      {t("tableDate")}
                      {recentSortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">{t("viewAction")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecent.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/call-log/${log.id}`}
                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                      >
                        {log.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CustomerCellLink
                        customer={log.customer}
                        phone={log.phone}
                        email={emailByName.get(log.customer)}
                        copied={copiedPhone === log.phone}
                        onCopy={() => void copyPhone(log.phone)}
                      />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`direction.${log.direction}`)}
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">
                      {formatDuration(log.durationSec)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{date(log.startedAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{time(log.startedAt)}</p>
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={log.outcome} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/calls/call-log/${log.id}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${t("viewAction")} ${log.id}`}
                            title={t("viewAction")}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(log)}
                          aria-label={`${t("editTitle")} ${log.id}`}
                          title={t("editTitle")}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPrintId(log.id)}
                          aria-label={`${t("printBtn")} ${log.id}`}
                          title={t("printBtn")}
                        >
                          <Printer className="size-4 text-secondary" aria-hidden="true" />
                        </Button>
                        {(() => {
                          const ship = addressByName.get(log.customer);
                          if (!ship) return null;
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setMapQuery({
                                  query: `${ship.address}, ${ship.city}, Bangladesh`,
                                  title: log.customer,
                                })
                              }
                              aria-label={`${t("viewOnMap")} ${log.customer}`}
                              title={t("viewOnMap")}
                              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                            >
                              <MapPin className="size-4" aria-hidden="true" />
                            </button>
                          );
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card pt-5">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
          <CardTitle className="font-heading text-lg font-bold">{t("queueTitle")}</CardTitle>
          <Link href="/dashboard/calls/queue">
            <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary">
              {t("viewAll")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:h-12 [&_th]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableId")}</TableHead>
                <TableHead>{t("tableCustomer")}</TableHead>
                <TableHead>{t("tableAgent")}</TableHead>
                <TableHead className="text-right">{t("tableScheduled")}</TableHead>
                <TableHead>{t("tableStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queuePreview.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs font-semibold whitespace-nowrap">
                    {q.id}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium whitespace-nowrap text-foreground">{q.customer}</p>
                    <p className="text-xs whitespace-nowrap text-muted-foreground">
                      {q.phone} · {q.city}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{q.agent}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <p className="text-xs font-medium text-foreground">{date(q.scheduledAt)}</p>
                    <p className="text-[11px] text-muted-foreground">{time(q.scheduledAt)}</p>
                  </TableCell>
                  <TableCell>
                    <QueueStatusBadge status={q.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          {editLog ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("editTitle")} · <span className="font-mono text-secondary">{editLog.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    {t("tableAgent")}
                  </span>
                  <Select value={draftAgent} onValueChange={(v) => v && setDraftAgent(v)}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_AGENTS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {t("tableStatus")}
                    </span>
                    <Select
                      value={draftOutcome}
                      onValueChange={(v) => v && setDraftOutcome(v as CallLog["outcome"])}
                    >
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["completed", "missed", "failed"] as const).map((o) => (
                          <SelectItem key={o} value={o}>
                            {t(`status.${o}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {t("tableDuration")} (s)
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={draftDuration}
                      onChange={(e) => setDraftDuration(Number(e.target.value) || 0)}
                      className="bg-card"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditId(null)}>
                  {t("cancelBtn")}
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  {t("settings.save")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!printLog} onOpenChange={(open) => !open && setPrintId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {printLog ? (
            <>
              <div id="invoice-print">
                <div className="flex flex-col gap-4 bg-white p-2">
                  <div className="flex items-start justify-between gap-4 border-b-2 border-secondary pb-3">
                    <div>
                      <p className="font-heading text-xl font-bold text-foreground">Fashion Store</p>
                      <p className="text-xs text-muted-foreground">Auto Call System</p>
                    </div>
                    <p className="bg-secondary px-3 py-1 text-sm font-bold tracking-wide text-white uppercase">
                      {t("slipTitle")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("tableId")}</span>
                      <span className="font-mono font-bold">{printLog.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("tableCustomer")}</span>
                      <span className="font-semibold">{printLog.customer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("tablePhone")}</span>
                      <span className="font-mono">{printLog.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("tableAgent")}</span>
                      <span className="font-medium">{printLog.agent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("tableDate")}</span>
                      <span className="font-medium">
                        {date(printLog.startedAt)} {time(printLog.startedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="font-semibold">{t("tableDuration")}</span>
                      <span className="font-bold text-secondary">
                        {formatDuration(printLog.durationSec)}
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-xs font-medium text-secondary">
                    {t("subtitle")}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPrintId(null)}>
                  {t("cancelBtn")}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => printInvoiceDoc()}>
                  <Printer className="size-3.5" aria-hidden="true" />
                  {t("printBtn")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <MapDialog
        open={!!mapQuery}
        onOpenChange={(open) => !open && setMapQuery(null)}
        query={mapQuery?.query ?? null}
        title={mapQuery?.title}
      />
    </div>
  );
}
