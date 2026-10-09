"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CheckCircle, Copy, Download, Printer } from "lucide-react";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { printInvoiceDoc } from "@/components/admin/print-invoice";
import { enrichPayout } from "@/features/vendor/payouts";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorPayouts } from "@/store/vendor.store";
import { PayoutTabs } from "@/components/vendor/payout-coupon-shared";
import { toast } from "sonner";

export default function VendorCompletedPayoutsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const payouts = useVendorPayouts();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo(
    () => payouts.map(enrichPayout).filter((p) => p.status === "completed"),
    [payouts]
  );

  const receipt = (id: string) => {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    downloadCsv(`payout-${id}.csv`, ["field", "value"],
      [["id", p.id], ["amount", p.amount], ["fee", p.fee], ["net", p.net], ["method", p.method], ["ref", p.reference], ["date", p.completed]]);
    toast.success(t("exported"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_payouts")}
        title={t("poCompleted")}
        subtitle={`${num(rows.length)} · ${money(rows.reduce((n, p) => n + p.amount, 0))}`}
        highlightLabel={t("poPaidOut")}
        highlightValue={money(rows.reduce((n, p) => n + p.amount, 0))}
        highlightIcon={CheckCircle}
      />

      <PayoutTabs />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("poCompleted")}</CardTitle>
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
                  <TableHead>{t("poProcessed")}</TableHead>
                  <TableHead>{t("poRef")}</TableHead>
                  <TableHead className="w-36">{t("eActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Link href={`/vendor/payouts/${p.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{p.id}</Link></TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">{money(p.amount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-green-700">{money(p.net)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{p.method}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.completed}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => receipt(p.id)} aria-label={`${t("poReceipt")} ${p.id}`} title={t("poReceipt")}>
                          <Download className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => window.setTimeout(() => printInvoiceDoc(`Payout ${p.id}`), 50)} aria-label={`${t("ePrint")} ${p.id}`} title={t("ePrint")}>
                          <Printer className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { void navigator.clipboard.writeText(p.reference); toast.success(t("eCopyRef")); }} aria-label={t("eCopyRef")} title={t("eCopyRef")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8"><EmptyState icon={CheckCircle} title={t("poEmpty")} description={t("poEmptyDesc")} /></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
