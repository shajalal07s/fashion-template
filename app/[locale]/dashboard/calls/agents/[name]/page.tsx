"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ArrowLeft, Clock3, ListOrdered, PhoneCall, Trophy } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import {
  OutcomeBadge,
  PriorityBadge,
  QueueStatusBadge,
} from "@/components/admin/calls/shared";
import { demoLogs, formatDuration } from "@/features/admin/calls";
import { useQueueItems } from "@/store/call-queue.store";

export default function AgentDetailsPage() {
  const t = useTranslations("Dashboard.calls");
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);

  const queueItems = useQueueItems();

  const assigned = useMemo(() => queueItems.filter((q) => q.agent === name), [queueItems, name]);
  const handled = useMemo(() => demoLogs.filter((l) => l.agent === name), [name]);
  const completed = useMemo(() => handled.filter((l) => l.outcome === "completed"), [handled]);
  const avgSec = useMemo(
    () =>
      completed.length
        ? Math.round(completed.reduce((n, l) => n + l.durationSec, 0) / completed.length)
        : 0,
    [completed]
  );
  const successRate = useMemo(
    () => (handled.length ? Math.round((completed.length / handled.length) * 100) : 0),
    [handled, completed]
  );

  if (assigned.length === 0 && handled.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("agentTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("agentTitle")} · ${name}`}
        actions={
          <Link href="/dashboard/calls/queue">
            <Button variant="outline" size="sm" className="gap-1.5 bg-card">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("back")}
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("agentQueue")}
          value={String(assigned.length)}
          delta={0}
          icon={ListOrdered}
        />
        <StatCard
          label={t("agentCalls")}
          value={String(handled.length)}
          delta={0}
          icon={PhoneCall}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("agentSuccess")}
          value={`${successRate}%`}
          delta={0}
          icon={Trophy}
          iconClassName="bg-green-600/10 text-green-700"
        />
        <StatCard
          label={t("agentAvg")}
          value={formatDuration(avgSec)}
          delta={0}
          icon={Clock3}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">
              {t("agentQueue")} ({assigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:h-12 [&_th]:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableId")}</TableHead>
                  <TableHead>{t("tableCustomer")}</TableHead>
                  <TableHead>{t("tablePriority")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.slice(0, 8).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/queue/${q.id}`}
                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                      >
                        {q.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium whitespace-nowrap text-foreground">
                        {q.customer}
                      </p>
                      <p className="text-xs whitespace-nowrap text-muted-foreground">{q.phone}</p>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={q.priority} />
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

        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">
              {t("agentCalls")} ({handled.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:h-12 [&_th]:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableId")}</TableHead>
                  <TableHead>{t("tableCustomer")}</TableHead>
                  <TableHead className="text-right">{t("tableDuration")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {handled.slice(0, 8).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={`/dashboard/calls/call-log/${l.id}`}
                        className="font-mono text-xs font-semibold text-secondary hover:underline"
                      >
                        {l.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {l.customer}
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">
                      {formatDuration(l.durationSec)}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={l.outcome} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
