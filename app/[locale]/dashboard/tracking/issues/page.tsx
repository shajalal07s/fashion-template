"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { DeliveryIssue, IssueKind, IssueStatus } from "@/features/admin/returns";
import { useDeliveryIssues, useReturnsStore } from "@/store/returns.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const issueKey = (i: IssueKind) =>
  i === "delayed" ? "isDelayed" : i === "failed" ? "isFailed" : i === "address" ? "isAddress" : i === "unavailable" ? "isUnavailable" : i === "damaged" ? "isDamaged" : "isException";

const STATUS_CLASS: Record<IssueStatus, string> = {
  open: "bg-destructive/10 text-destructive",
  investigating: "bg-primary/20 text-[#8a5a00]",
  resolved: "bg-green-600/10 text-green-700",
};

export default function DeliveryIssuesPage() {
  const t = useTranslations("Dashboard.tracking");
  const ts = useTranslations("Dashboard.sidebar");
  const issues = useDeliveryIssues();
  const patchIssue = useReturnsStore((s) => s.patchIssue);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IssueStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter(
      (i) =>
        (statusFilter === "all" || i.status === statusFilter) &&
        (!q || i.orderId.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q) || i.tracking.toLowerCase().includes(q))
    );
  }, [issues, query, statusFilter]);

  const openCount = issues.filter((i) => i.status === "open").length;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("tracking")}
        title={t("iTitle")}
        subtitle={t("iSubtitle", { count: openCount })}
        highlightLabel={t("iTitle")}
        highlightValue={String(openCount)}
        highlightIcon={AlertTriangle}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as IssueStatus | "all") ?? "all")}>
          <SelectTrigger size="sm" className="h-8 w-44 bg-card" aria-label={t("tStatus")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {(["open", "investigating", "resolved"] as IssueStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{t(s)}</SelectItem>
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
                  <TableHead>{t("tOrder")}</TableHead>
                  <TableHead>{t("tCustomer")}</TableHead>
                  <TableHead>{t("tIssue")}</TableHead>
                  <TableHead>{t("tProvider")}</TableHead>
                  <TableHead>{t("tReported")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-24">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i: DeliveryIssue) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-bold whitespace-nowrap">{i.orderId}</p>
                      <p className="font-mono text-xs text-muted-foreground">{i.tracking}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold whitespace-nowrap">{i.customer}</p>
                      <p className="text-xs text-muted-foreground">{i.vendor}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-destructive/10 font-semibold whitespace-nowrap text-destructive">
                        {t(issueKey(i.issue))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{i.provider}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{i.date}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[i.status])}>
                        {t(i.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i.status !== "resolved" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-green-700 hover:text-green-700"
                          onClick={() => {
                            patchIssue(i.id, { status: "resolved" });
                            toast.success(t("toastSaved"));
                          }}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                          {t("markResolved")}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={AlertTriangle} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
