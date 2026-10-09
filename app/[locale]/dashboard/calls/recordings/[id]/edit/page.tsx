"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock3, HardDrive, Save, Trash2, User } from "lucide-react";
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
import { RecordingPlayer } from "@/components/admin/calls/RecordingPlayer";
import { useCallFormat } from "@/components/admin/calls/shared";
import { CALL_AGENTS, formatDuration } from "@/features/admin/calls";
import { useCallRecordingsStore, useRecordings } from "@/store/call-recordings.store";
import { toast } from "sonner";

export default function RecordingEditPage() {
  const t = useTranslations("Dashboard.calls");
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { date, time } = useCallFormat();

  const items = useRecordings();
  const patchItem = useCallRecordingsStore((s) => s.patch);
  const removeItems = useCallRecordingsStore((s) => s.remove);

  const rec = useMemo(() => items.find((r) => r.id === id), [items, id]);

  const [customer, setCustomer] = useState<string | null>(null);
  const [agent, setAgent] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  if (!rec) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("editRecTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const vCustomer = customer ?? rec.customer;
  const vAgent = agent ?? rec.agent;
  const vDuration = duration ?? rec.durationSec;

  const previewRec = { ...rec, customer: vCustomer, agent: vAgent, durationSec: vDuration };

  const save = () => {
    if (!vCustomer.trim()) return;
    patchItem(id, { customer: vCustomer.trim(), agent: vAgent, durationSec: vDuration });
    toast.success(t("toastUpdated"));
  };

  const remove = () => {
    removeItems([id]);
    toast.success(t("toastDeleted", { count: 1 }));
    router.push("/dashboard/calls/recordings");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("editRecTitle")} · ${rec.id}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/calls/recordings">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("back")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("bulkDelete")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={save}>
              <Save className="size-3.5" aria-hidden="true" />
              {t("settings.save")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("tableCustomer")}
          value={vCustomer}
          delta={0}
          icon={User}
        />
        <StatCard
          label={t("tableDuration")}
          value={formatDuration(vDuration)}
          delta={0}
          icon={Clock3}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("tableSize")}
          value={`${rec.sizeMb} MB`}
          delta={0}
          icon={HardDrive}
          iconClassName="bg-green-600/10 text-green-700"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard title={t("editRecTitle")}>
          <Field label={t("tableCustomer")}>
            <Input value={vCustomer} onChange={(e) => setCustomer(e.target.value)} className="bg-card" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("tableAgent")}>
              <Select value={vAgent} onValueChange={(v) => v && setAgent(v)}>
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
            <Field label={`${t("tableDuration")} (s)`}>
              <Input
                type="number"
                min={0}
                value={vDuration}
                onChange={(e) => setDuration(Number(e.target.value) || 0)}
                className="bg-card"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("tableId")}
              </span>
              <span className="font-mono font-semibold">{rec.id}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold tracking-wider text-muted-foreground uppercase">
                {t("tableDate")}
              </span>
              <span className="font-medium">
                {date(rec.date)} {time(rec.date)}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("playerTitle")}>
          <RecordingPlayer key={`${rec.id}-${vDuration}`} recording={previewRec} />
        </SectionCard>
      </div>
    </div>
  );
}
