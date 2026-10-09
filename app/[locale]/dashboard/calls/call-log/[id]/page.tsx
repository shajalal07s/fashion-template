"use client";

import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, MapPin, Pencil, Play, Printer } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { OutcomeBadge } from "@/components/admin/calls/shared";
import { RecordingPlayer } from "@/components/admin/calls/RecordingPlayer";
import { MapDialog } from "@/components/admin/MapDialog";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import {
  CALL_AGENTS,
  demoLogs,
  demoRecordings,
  formatDuration,
  type CallLog,
} from "@/features/admin/calls";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Clock3, PhoneCall, User } from "lucide-react";
import { toast } from "sonner";

export default function CallDetailsPage() {
  const t = useTranslations("Dashboard.calls");
  const format = useFormatter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [logs, setLogs] = useState<CallLog[]>(demoLogs);
  const [draftAgent, setDraftAgent] = useState<string | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<CallLog["outcome"] | null>(null);
  const [draftDuration, setDraftDuration] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const orders = useAdminOrders();

  const log = useMemo(() => logs.find((l) => l.id === id), [logs, id]);

  const recording = useMemo(
    () => demoRecordings.find((r) => r.callId === id),
    [id]
  );

  const shipTo = useMemo(() => {
    if (!log) return null;
    const order = orders.find((o) => o.customerName === log.customer);
    if (!order) return null;
    return { address: order.address, city: order.city };
  }, [orders, log]);

  const copyPhone = async () => {
    if (!log) return;
    try {
      await navigator.clipboard.writeText(log.phone);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  void money;

  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });
  const timeOf = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });

  if (!log) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("logTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const openEdit = () => {
    document.getElementById("call-edit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const saveEdit = () => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              agent: draftAgent ?? l.agent,
              outcome: draftOutcome ?? l.outcome,
              durationSec: draftDuration ?? l.durationSec,
            }
          : l
      )
    );
    toast.success(t("toastUpdated"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("logTitle")} · ${log.id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/calls/call-log">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("back")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card"
              onClick={() => printInvoiceDoc(log.id)}
            >
              <Printer className="size-3.5" aria-hidden="true" />
              {t("printBtn")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openEdit}>
              <Pencil className="size-3.5" aria-hidden="true" />
              {t("editTitle")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("tableDuration")}
          value={formatDuration(log.durationSec)}
          delta={0}
          icon={Clock3}
        />
        <StatCard
          label={t("tableDirection")}
          value={t(`direction.${log.direction}`)}
          delta={0}
          icon={PhoneCall}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("tableCustomer")}
          value={log.customer}
          delta={0}
          icon={User}
          iconClassName="bg-green-600/10 text-green-700"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={t("viewAction")}>
          <div className="flex flex-col gap-2 text-sm">
            {(
              [
                [t("tableId"), <span key="id" className="font-mono font-bold">{log.id}</span>],
                [t("tableCustomer"), <span key="c" className="font-semibold">{log.customer}</span>],
                [
                  t("tablePhone"),
                  <span key="p" className="flex items-center gap-1.5">
                    <span className="font-mono">{log.phone}</span>
                    <button
                      type="button"
                      onClick={() => void copyPhone()}
                      aria-label={t("copied")}
                      title={t("copied")}
                      className="flex size-6 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-green-600" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </span>,
                ],
                [t("tableDirection"), <span key="d">{t(`direction.${log.direction}`)}</span>],
                [t("tableAgent"), <span key="a">{log.agent}</span>],
                [t("tableDate"), <span key="dt">{dateOf(log.startedAt)} {timeOf(log.startedAt)}</span>],
                [t("tableStatus"), <OutcomeBadge key="s" outcome={log.outcome} />],
                [
                  t("tableDuration"),
                  <span key="du" className="flex items-center gap-1.5 font-bold text-secondary">
                    {formatDuration(log.durationSec)}
                    {recording ? (
                      <button
                        type="button"
                        onClick={() => setPlayerOpen(true)}
                        aria-label={t("playAction")}
                        title={t("playAction")}
                        className="flex size-6 items-center justify-center rounded-full bg-secondary text-white transition-opacity hover:opacity-90"
                      >
                        <Play className="size-3" aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>,
                ],
              ] as Array<[string, React.ReactNode]>
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                {value}
              </div>
            ))}
            {shipTo ? (
              <div className="flex flex-col gap-1 border border-dashed border-border bg-muted/40 p-3">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("shippingAddress")}
                </span>
                <span className="text-sm font-medium">
                  {shipTo.address}, {shipTo.city}
                </span>
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
                >
                  <MapPin className="size-4" aria-hidden="true" />
                  {t("viewOnMap")}
                </button>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title={t("editTitle")}>
          <div id="call-edit-form" className="flex flex-col gap-4">
          <Field label={t("tableAgent")}>
            <Select value={draftAgent ?? log.agent} onValueChange={(v) => v && setDraftAgent(v)}>
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
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("tableStatus")}>
              <Select
                value={draftOutcome ?? log.outcome}
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
            </Field>
            <Field label={`${t("tableDuration")} (s)`}>
              <Input
                type="number"
                min={0}
                value={draftDuration ?? log.durationSec}
                onChange={(e) => setDraftDuration(Number(e.target.value) || 0)}
                className="bg-card"
              />
            </Field>
          </div>
          <Button size="sm" className="w-fit gap-1.5" onClick={saveEdit}>
            {t("settings.save")}
          </Button>
          </div>
        </SectionCard>
      </div>

      <div id="invoice-print" className="hidden print:block">
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
              <span className="font-mono font-bold">{log.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableCustomer")}</span>
              <span className="font-semibold">{log.customer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tablePhone")}</span>
              <span className="font-mono">{log.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableAgent")}</span>
              <span className="font-medium">{log.agent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableDate")}</span>
              <span className="font-medium">{dateOf(log.startedAt)} {timeOf(log.startedAt)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold">{t("tableDuration")}</span>
              <span className="font-bold text-secondary">{formatDuration(log.durationSec)}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent className="sm:max-w-md">
          {recording ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("playerTitle")} · <span className="font-mono text-secondary">{recording.id}</span>
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {log.customer} · {formatDuration(log.durationSec)}
              </p>
              <RecordingPlayer key={recording.id} recording={recording} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noRecording")}</p>
          )}
        </DialogContent>
      </Dialog>

      <MapDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        query={shipTo ? `${shipTo.address}, ${shipTo.city}, Bangladesh` : null}
        title={log?.customer}
      />
    </div>
  );
}
