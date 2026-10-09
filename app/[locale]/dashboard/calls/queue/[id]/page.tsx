"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, MapPin, Pencil, Printer, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { MapDialog } from "@/components/admin/MapDialog";
import { PriorityBadge, QueueStatusBadge, useCallFormat } from "@/components/admin/calls/shared";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { CALL_AGENTS, type CallQueueItem } from "@/features/admin/calls";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { useCallQueueStore, useQueueItems } from "@/store/call-queue.store";
import { Clock3, ListOrdered, User } from "lucide-react";
import { toast } from "sonner";

export default function QueueDetailsPage() {
  const t = useTranslations("Dashboard.calls");
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const items = useQueueItems();
  const patchItem = useCallQueueStore((s) => s.patch);
  const removeItems = useCallQueueStore((s) => s.remove);
  const orders = useAdminOrders();

  const [copied, setCopied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [draftAgent, setDraftAgent] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<CallQueueItem["status"] | null>(null);
  const [draftPriority, setDraftPriority] = useState<CallQueueItem["priority"] | null>(null);
  const [draftAttempts, setDraftAttempts] = useState<number | null>(null);

  const item = useMemo(() => items.find((q) => q.id === id), [items, id]);
  const { date, time } = useCallFormat();

  const shipTo = useMemo(() => {
    if (!item) return null;
    const order = orders.find((o) => o.customerName === item.customer);
    if (order?.address) return { address: order.address, city: order.city };
    return { address: "", city: item.city };
  }, [orders, item]);

  if (!item) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("queueTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(item.phone);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copied"));
    }
  };

  const openEdit = () => {
    document.getElementById("queue-edit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const saveEdit = () => {
    patchItem(id, {
      agent: draftAgent ?? item.agent,
      status: draftStatus ?? item.status,
      priority: draftPriority ?? item.priority,
      attempts: Math.max(0, Math.round(draftAttempts ?? item.attempts)),
    });
    toast.success(t("toastUpdated"));
  };

  const remove = () => {
    removeItems([id]);
    toast.success(t("toastDeleted", { count: 1 }));
    router.push("/dashboard/calls/queue");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("queueTitle")} · ${item.id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/calls/queue">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("back")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card"
              onClick={() => printInvoiceDoc(item.id)}
            >
              <Printer className="size-3.5" aria-hidden="true" />
              {t("printBtn")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("bulkDelete")}
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
          label={t("tableStatus")}
          value={t(`status.${item.status}`)}
          delta={0}
          icon={ListOrdered}
        />
        <StatCard
          label={t("tablePriority")}
          value={t(`priority.${item.priority}`)}
          delta={0}
          icon={Clock3}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("tableCustomer")}
          value={item.customer}
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
                [t("tableId"), <span key="id" className="font-mono font-bold">{item.id}</span>],
                [t("tableCustomer"), <span key="c" className="font-semibold">{item.customer}</span>],
                [
                  t("tablePhone"),
                  <span key="p" className="flex items-center gap-1.5">
                    <span className="font-mono">{item.phone}</span>
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
                [
                  t("tableAgent"),
                  <Link
                    key="a"
                    href={`/dashboard/calls/agents/${encodeURIComponent(item.agent)}`}
                    className="font-medium text-secondary hover:underline"
                  >
                    {item.agent}
                  </Link>,
                ],
                [t("tablePriority"), <PriorityBadge key="pr" priority={item.priority} />],
                [t("tableAttempts"), <span key="at" className="font-bold">{item.attempts}</span>],
                [
                  t("tableScheduled"),
                  <span key="dt">
                    {date(item.scheduledAt)} {time(item.scheduledAt)}
                  </span>,
                ],
                [t("tableStatus"), <QueueStatusBadge key="s" status={item.status} />],
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
                  {shipTo.address ? `${shipTo.address}, ` : ""}{shipTo.city}
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
          <div id="queue-edit-form" className="flex flex-col gap-4">
            <Field label={t("tableAgent")}>
              <Select value={draftAgent || item.agent} onValueChange={(v) => v && setDraftAgent(v)}>
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
            <div className="grid grid-cols-3 gap-3">
              <Field label={t("tableStatus")}>
                <Select
                  value={draftStatus || item.status}
                  onValueChange={(v) => v && setDraftStatus(v as CallQueueItem["status"])}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["waiting", "calling", "done"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tablePriority")}>
                <Select
                  value={draftPriority || item.priority}
                  onValueChange={(v) => v && setDraftPriority(v as CallQueueItem["priority"])}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["high", "normal", "low"] as const).map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`priority.${p}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("tableAttempts")}>
                <Input
                  type="number"
                  min={0}
                  value={draftAttempts || item.attempts}
                  onChange={(e) => setDraftAttempts(Number(e.target.value) || 0)}
                  className="bg-card"
                />
              </Field>
            </div>
            <div className="text-xs text-muted-foreground">
              {t("tableScheduled")}: {date(item.scheduledAt)} {time(item.scheduledAt)}
            </div>
            <Button size="sm" className="w-fit gap-1.5" onClick={saveEdit}>
              {t("settings.save")}
            </Button>
          </div>
        </SectionCard>
      </div>

      <MapDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        query={shipTo ? `${shipTo.address ? `${shipTo.address}, ` : ""}${shipTo.city}, Bangladesh` : null}
        title={item.customer}
      />

      <div id="invoice-print" className="hidden print:block">
        <div className="flex flex-col gap-4 bg-white p-2">
          <div className="flex items-start justify-between gap-4 border-b-2 border-secondary pb-3">
            <div>
              <p className="font-heading text-xl font-bold text-foreground">Fashion Store</p>
              <p className="text-xs text-muted-foreground">Auto Call System</p>
            </div>
            <p className="bg-secondary px-3 py-1 text-sm font-bold tracking-wide text-white uppercase">
              {t("queueSlipTitle")}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableId")}</span>
              <span className="font-mono font-bold">{item.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableCustomer")}</span>
              <span className="font-semibold">{item.customer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tablePhone")}</span>
              <span className="font-mono">{item.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tableAgent")}</span>
              <span className="font-medium">{item.agent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("tablePriority")}</span>
              <span className="font-medium">{t(`priority.${item.priority}`)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold">{t("tableStatus")}</span>
              <span className="font-bold text-secondary">{t(`status.${item.status}`)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

