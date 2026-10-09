"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import {
  commissionRevenueRanges,
  type CommissionTx,
} from "@/features/admin/commission";
import { useCommissionAdjustments, useCommissionTxs } from "@/store/commission.store";
import { toast } from "sonner";

function SumCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <div className={`h-1 w-full ${accent ? "bg-gradient-to-r from-primary to-secondary" : "bg-muted"}`} />
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className={`font-heading truncate text-xl font-bold ${accent ? "text-secondary" : "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function groupBy(txs: CommissionTx[], key: (x: CommissionTx) => string) {
  const map = new Map<string, { sales: number; com: number; earn: number; count: number }>();
  for (const x of txs) {
    const k = key(x);
    const e = map.get(k) ?? { sales: 0, com: 0, earn: 0, count: 0 };
    e.sales += x.commissionable;
    e.com += x.commission;
    e.earn += x.earning;
    e.count += 1;
    map.set(k, e);
  }
  return [...map.entries()].map(([name, v]) => ({ name, ...v }));
}

export default function CommissionReportsPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const txs = useCommissionTxs();
  const adjustments = useCommissionAdjustments();
  const [tab, setTab] = useState("overview");
  const ranges = useMemo(() => commissionRevenueRanges(), []);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const gross = txs.reduce((n, x) => n + x.gross, 0);
  const commSales = txs.reduce((n, x) => n + x.commissionable, 0);
  const totalCom = txs.reduce((n, x) => n + x.commission, 0);
  const earning = txs.reduce((n, x) => n + x.earning, 0);
  const refunds = txs.filter((x) => x.status === "refunded").reduce((n, x) => n + x.commission, 0);
  const adjust = adjustments.reduce((n, a) => n + a.delta, 0);

  const vendorRows = useMemo(() => groupBy(txs, (x) => x.vendor), [txs]);
  const categoryRows = useMemo(() => groupBy(txs, (x) => x.category), [txs]);
  const productRows = useMemo(() => groupBy(txs, (x) => x.product), [txs]);
  const dateRows = useMemo(() => groupBy(txs, (x) => x.date), [txs]);

  const exportLater = () => toast(t("exportLater"));

  const groupTable = (rows: Array<{ name: string; sales: number; com: number; earn: number; count: number }>) => (
    <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead>{t("tVendor")}</TableHead>
          <TableHead className="text-right">{t("rCommSales")}</TableHead>
          <TableHead className="text-right">{t("rTotalCom")}</TableHead>
          <TableHead className="text-right">{t("rEarning")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell>
              <p className="max-w-52 truncate text-sm font-semibold" title={r.name}>{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.count} txns</p>
            </TableCell>
            <TableCell className="text-right text-sm whitespace-nowrap">{money(r.sales)}</TableCell>
            <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
              {money(r.com)}
            </TableCell>
            <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
              {money(r.earn)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("rTitle")}
        subtitle={t("rSubtitle")}
        highlightLabel={t("rNet")}
        highlightValue={money(totalCom - refunds + adjust)}
        highlightIcon={FileText}
      >
        <button type="button" onClick={exportLater} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportCsv")}
        </button>
        <button type="button" onClick={exportLater} className={heroPillClassName}>
          <FileSpreadsheet className="size-3.5" aria-hidden="true" />
          {t("exportExcel")}
        </button>
        <button type="button" onClick={exportLater} className={heroPillClassName}>
          <FileText className="size-3.5" aria-hidden="true" />
          {t("exportPdf")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <SumCard label={t("rGross")} value={money(gross)} />
        <SumCard label={t("rCommSales")} value={money(commSales)} />
        <SumCard label={t("rTotalCom")} value={money(totalCom)} accent />
        <SumCard label={t("rEarning")} value={money(earning)} />
        <SumCard label={t("rRefunds")} value={money(refunds)} />
        <SumCard label={t("rAdjust")} value={money(adjust)} />
        <SumCard label={t("rNet")} value={money(totalCom - refunds + adjust)} accent />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("rChart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={ranges["30days"]} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="overview">{t("tabRepOverview")}</TabsTrigger>
              <TabsTrigger value="vendor">{t("tabRepVendor")}</TabsTrigger>
              <TabsTrigger value="category">{t("tabRepCategory")}</TabsTrigger>
              <TabsTrigger value="product">{t("tabRepProduct")}</TabsTrigger>
              <TabsTrigger value="date">{t("tabRepDate")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="overflow-x-auto p-0 pt-2">
              {groupTable(vendorRows)}
            </TabsContent>
            <TabsContent value="vendor" className="overflow-x-auto p-0 pt-2">
              {groupTable(vendorRows)}
            </TabsContent>
            <TabsContent value="category" className="overflow-x-auto p-0 pt-2">
              {groupTable(categoryRows)}
            </TabsContent>
            <TabsContent value="product" className="overflow-x-auto p-0 pt-2">
              {groupTable(productRows)}
            </TabsContent>
            <TabsContent value="date" className="overflow-x-auto p-0 pt-2">
              {groupTable(dateRows)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
