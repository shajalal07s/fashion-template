"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { enrichPayout } from "@/features/vendor/payouts";
import { useVendorPayouts, useVendorStore } from "@/store/vendor.store";
import { PayoutTabs, PoStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

export default function VendorPendingPayoutsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const payouts = useVendorPayouts();
  const store = useVendorStore();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo(
    () => payouts.map(enrichPayout).filter((p) => p.status === "pending" || p.status === "processing"),
    [payouts]
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poPending")}
        subtitle={`${num(rows.length)} · ${money(rows.reduce((n, p) => n + p.amount, 0))}`}
        highlightLabel={t("poPendingCount")}
        highlightValue={num(rows.length)}
        highlightIcon={Clock}
      />

      <PayoutTabs />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("poPending")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tPayout")}</TableHead>
                  <TableHead className="text-right">{t("tAmount")}</TableHead>
                  <TableHead className="text-right">{t("poNet")}</TableHead>
                  <TableHead>{t("poMethod")}</TableHead>
                  <TableHead>{t("poExpected")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-40">{t("eActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Link href={`/vendor/payouts/${p.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{p.id}</Link></TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">{money(p.amount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-green-700">{money(p.net)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{p.method}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.expected}</TableCell>
                    <TableCell><PoStatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Link href={`/vendor/payouts/${p.id}`}><Button size="sm" variant="outline" className="h-7 bg-card text-[11px]">{t("viewDetails")}</Button></Link>
                        {p.status === "pending" ? (
                          <Button size="sm" variant="outline" className="h-7 bg-card text-[11px] text-destructive" onClick={() => setCancelId(p.id)}>
                            {t("poCancel")}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={Clock} title={t("poEmpty")} description={t("poEmptyDesc")} />
              <Link href="/vendor/payouts/request"><Button size="sm">{t("poRequest")}</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!cancelId} onOpenChange={(o: boolean) => !o && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poCancelConfirm")}</DialogTitle>
            <DialogDescription className="font-mono">{cancelId}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelId(null)}>{t("cancel")}</Button>
            <Button
              size="sm"
              onClick={() => {
                if (cancelId) {
                  store.patchPayout(cancelId, { status: "failed" });
                  store.notifyVendor(`Payout ${cancelId} cancelled.`, "payout");
                  toast.success(t("toastSaved"));
                }
                setCancelId(null);
              }}
            >
              {t("poCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
