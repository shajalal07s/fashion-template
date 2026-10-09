"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { ExportReportButton, ReportKpi, ReportTable, type ReportColumn } from "@/components/admin/reports/shared";
import { DATE_FILTERS, hashStr } from "@/features/admin/reports";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvRow {
  id: string;
  product: string;
  sku: string;
  vendor: string;
  category: string;
  stock: number;
  reserved: number;
  sold: number;
  price: number;
}

export default function InventoryReportPage() {
  const t = useTranslations("Dashboard.reports");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [range, setRange] = useState<(typeof DATE_FILTERS)[number]>("Last 30 Days");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const rows = useMemo<InvRow[]>(() => {
    const map = new Map<string, InvRow>();
    for (const o of orders) {
      for (const item of o.items) {
        const e = map.get(item.name) ?? {
          id: item.name, product: item.name, sku: item.name.slice(0, 8).toUpperCase(),
          vendor: item.category, category: item.category, stock: 0, reserved: 0, sold: 0, price: item.price,
        };
        e.sold += item.quantity;
        map.set(item.name, e);
      }
    }
    return [...map.values()].map((r) => {
      const h = hashStr(`inv:${r.product}`);
      const stock = (h % 120) + (r.sold % 7 === 0 ? 0 : 5);
      return { ...r, stock, reserved: Math.min(stock, h % 9) };
    });
  }, [orders]);

  const totalStock = rows.reduce((n, r) => n + r.stock, 0);
  const value = rows.reduce((n, r) => n + r.stock * r.price, 0);
  const low = rows.filter((r) => r.stock > 0 && r.stock < 10).length;
  const out = rows.filter((r) => r.stock === 0).length;

  const statusOf = (r: InvRow) => (r.stock === 0 ? "outStock" : r.stock < 10 ? "lowStock" : "inStock");

  const columns: Array<ReportColumn<InvRow>> = [
    { key: "product", label: t("cProduct"), sortable: true, sortValue: (r) => r.product, searchValue: (r) => `${r.product} ${r.sku} ${r.vendor}`, render: (r) => <span className="max-w-44 truncate text-sm font-semibold" title={r.product}>{r.product}</span> },
    { key: "sku", label: t("cSku"), render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.sku}</span> },
    { key: "vendor", label: t("cVendor"), sortable: true, sortValue: (r) => r.vendor, searchValue: (r) => r.vendor, render: (r) => <span className="text-xs whitespace-nowrap">{r.vendor}</span> },
    { key: "category", label: t("cCategory"), searchValue: (r) => r.category, render: (r) => <span className="text-xs whitespace-nowrap text-muted-foreground">{r.category}</span> },
    { key: "stock", label: t("cStock"), align: "right", sortable: true, sortValue: (r) => r.stock, render: (r) => <span className={cn("text-sm font-bold", r.stock === 0 ? "text-destructive" : r.stock < 10 ? "text-[#8a5a00]" : "")}>{num(r.stock)}</span> },
    { key: "reserved", label: t("cReserved"), align: "right", render: (r) => <span className="text-sm">{num(r.reserved)}</span> },
    { key: "sold", label: t("cSold"), align: "right", sortable: true, sortValue: (r) => r.sold, render: (r) => <span className="text-sm">{num(r.sold)}</span> },
    { key: "available", label: t("cAvailable"), align: "right", sortable: true, sortValue: (r) => r.stock - r.reserved, render: (r) => <span className="text-sm font-semibold">{num(Math.max(0, r.stock - r.reserved))}</span> },
    { key: "value", label: t("cValue"), align: "right", sortable: true, sortValue: (r) => r.stock * r.price, render: (r) => <span className="text-sm font-bold whitespace-nowrap text-secondary">{money(r.stock * r.price)}</span> },
    { key: "status", label: t("cStatus"), searchValue: (r) => r.stock === 0 ? "out" : r.stock < 10 ? "low" : "in", render: (r) => <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", r.stock === 0 ? "bg-destructive/10 text-destructive" : r.stock < 10 ? "bg-primary/20 text-[#8a5a00]" : "bg-green-600/10 text-green-700")}>{t(statusOf(r))}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("reports")}
        title={t("iTitle")}
        subtitle={range}
        highlightLabel={t("kInventoryValue")}
        highlightValue={money(value)}
        highlightIcon={Boxes}
      >
        <ExportReportButton
          reportType="inventory"
          headers={["product", "sku", "vendor", "stock", "reserved", "sold", "available", "value", "status"]}
          rows={rows.map((r) => [r.product, r.sku, r.vendor, r.stock, r.reserved, r.sold, Math.max(0, r.stock - r.reserved), r.stock * r.price, statusOf(r)])}
          filtersLabel={range}
        />
      </AccountingHero>

      <div className="flex flex-wrap items-center gap-1.5">
        {DATE_FILTERS.map((d) => (
          <Button key={d} variant={range === d ? "default" : "outline"} size="sm" className={range === d ? "h-8 text-xs" : "h-8 bg-card text-xs"} onClick={() => setRange(d)}>
            {d}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ReportKpi label={t("kTotalProducts")} value={num(rows.length)} icon={Boxes} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kTotalStock")} value={num(totalStock)} delta={3} icon={Boxes} tile="bg-secondary/15 text-secondary" />
        <ReportKpi label={t("kInventoryValue")} value={money(value)} delta={5} icon={Boxes} tile="bg-green-600/10 text-green-700" />
        <ReportKpi label={t("kLowStock")} value={num(low)} delta={-8} icon={Boxes} tile="bg-primary/20 text-[#8a5a00]" />
        <ReportKpi label={t("kOutStock")} value={num(out)} delta={-2} icon={Boxes} tile="bg-destructive/10 text-destructive" />
      </div>

      <ReportTable<InvRow>
        rows={rows}
        columns={columns}
        searchPlaceholder={t("searchPlaceholder")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
