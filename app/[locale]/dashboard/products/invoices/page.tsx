"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Banknote, Download, Package, Search, ShoppingCart } from "lucide-react";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InvoicesTable } from "@/components/admin/products/InvoicesTable";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { productSalesSummary } from "@/features/admin/analytics";
import { toast } from "sonner";

export default function DashboardProductInvoicesPage() {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const rows = useMemo(() => productSalesSummary(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const totals = useMemo(() => {
    return {
      revenue: rows.reduce((n, r) => n + r.revenue, 0),
      qty: rows.reduce((n, r) => n + r.qty, 0),
      orders: rows.reduce((n, r) => n + r.orders, 0),
    };
  }, [rows]);

  const stats = [
    { label: t("pinvoices.colRevenue"), value: money(totals.revenue), icon: Banknote, iconClassName: "bg-secondary/15 text-secondary" },
    { label: t("pinvoices.colQty"), value: String(totals.qty), icon: ShoppingCart, iconClassName: "bg-primary/15 text-secondary" },
    { label: t("pinvoices.colOrders"), value: String(totals.orders), icon: Package, iconClassName: "bg-green-600/10 text-green-700" },
  ];

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error(t("orders.noSelection"));
      return;
    }
    const lines = [
      ["product", "qty", "orders", "revenue"].join(","),
      ...filtered.map((r) => [r.name, r.qty, r.orders, r.revenue].map(csvEscape).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("products.exportSuccess", { count: filtered.length }));
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("pinvoices.title")} description={t("pinvoices.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {s.label}
                </p>
                <p className="font-heading truncate text-2xl font-bold text-foreground">
                  {s.value}
                </p>
              </div>
              <span className={`flex size-11 shrink-0 items-center justify-center ${s.iconClassName}`}>
                <s.icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pinvoices.searchPlaceholder")}
            className="bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) || 10)}>
            <SelectTrigger size="sm" className="h-8 w-24 bg-card" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-card" onClick={handleExport}>
            <Download className="size-3.5 text-secondary" aria-hidden="true" />
            {t("products.exportBtn")}
          </Button>
        </div>
      </div>

      <InvoicesTable rows={filtered} pageSize={pageSize} onPageSizeChange={setPageSize} />
    </div>
  );
}
