"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  LayoutGrid,
  Loader2,
  Printer,
  Search,
  Truck,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InvoiceDoc } from "@/components/admin/orders/InvoiceDoc";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { cn } from "@/lib/utils";
import type { AdminOrder, AdminOrderStatus } from "@/features/admin/analytics";
import { toast } from "sonner";

type Filter = "all" | AdminOrderStatus;

const FILTERS: Array<{ key: Filter; icon: LucideIcon }> = [
  { key: "all", icon: LayoutGrid },
  { key: "pending", icon: Clock },
  { key: "processing", icon: Loader2 },
  { key: "shipped", icon: Truck },
  { key: "delivered", icon: CheckCircle2 },
  { key: "cancelled", icon: XCircle },
];

const STATUSES: AdminOrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENTS: AdminOrder["payment"][] = ["cod", "bkash", "nagad", "card"];

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export default function DashboardOrdersPage() {
  const t = useTranslations("Dashboard.admin");
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminOrderStatus>>({});
  const [paymentOverrides, setPaymentOverrides] = useState<Record<string, AdminOrder["payment"]>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<AdminOrder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkInvoiceOpen, setBulkInvoiceOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const seen = new Set<string>();
    return [...imported, ...orders]
      .map((o) => ({
        ...o,
        status: statusOverrides[o.id] ?? o.status,
        payment: paymentOverrides[o.id] ?? o.payment,
      }))
      .filter((o) => {
        if (deletedIds.has(o.id) || seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
  }, [imported, orders, statusOverrides, paymentOverrides, deletedIds]);

  const queried = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }, [visible, query]);

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", queried.length]]);
    for (const o of queried) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
    }
    return map;
  }, [queried]);

  const filtered = useMemo(
    () => (filter === "all" ? queried : queried.filter((o) => o.status === filter)),
    [queried, filter]
  );

  const selectedOrders = useMemo(
    () => filtered.filter((o) => selected.has(o.id)),
    [filtered, selected]
  );

  const handleStatusChange = (id: string, status: AdminOrderStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    toast.success(t("orders.toastStatusUpdated"));
  };

  const handlePaymentChange = (id: string, payment: AdminOrder["payment"]) => {
    setPaymentOverrides((prev) => ({ ...prev, [id]: payment }));
  };

  const handleBulkStatus = (ids: string[], status: AdminOrderStatus) => {
    setStatusOverrides((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = status;
      return next;
    });
    toast.success(t("orders.toastBulkUpdated", { count: ids.length }));
  };

  const handleBulkDelete = (ids: string[]) => {
    setDeletedIds((prev) => new Set([...prev, ...ids]));
    toast.success(t("orders.toastBulkDeleted", { count: ids.length }));
  };

  const handleExport = () => {
    const rows = selected.size > 0 ? selectedOrders : filtered;
    if (rows.length === 0) {
      toast.error(t("orders.noSelection"));
      return;
    }
    const header = ["id", "date", "customer", "email", "phone", "city", "items", "subtotal", "shipping", "total", "payment", "status"];
    const lines = [
      header.join(","),
      ...rows.map((o) =>
        [
          o.id,
          o.date,
          o.customerName,
          o.customerEmail,
          o.customerPhone,
          o.city,
          o.items.reduce((n, i) => n + i.quantity, 0),
          o.subtotal,
          o.shipping,
          o.total,
          o.payment,
          o.status,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("orders.exportSuccess", { count: rows.length }));
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("empty");
      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const col = (row: string[], ...names: string[]) => {
        for (const name of names) {
          const i = headers.indexOf(name);
          if (i >= 0 && row[i]) return row[i];
        }
        return "";
      };
      const now = new Date().toISOString();
      const parsed: AdminOrder[] = [];
      lines.slice(1).forEach((line, i) => {
        const row = parseCsvLine(line);
        const total = Number(col(row, "total")) || 0;
        const qty = Math.max(1, Number(col(row, "items", "quantity", "qty")) || 1);
        const price = Number(col(row, "price")) || (qty > 0 ? Math.round(total / qty) : total);
        const statusRaw = col(row, "status").toLowerCase();
        const paymentRaw = col(row, "payment").toLowerCase();
        const dateRaw = col(row, "date");
        const name = col(row, "customer", "name") || "Imported Customer";
        parsed.push({
          id: col(row, "id") || `IMP-${Date.now()}-${i + 1}`,
          date: dateRaw && !Number.isNaN(Date.parse(dateRaw)) ? new Date(dateRaw).toISOString() : now,
          customerName: name,
          customerEmail: col(row, "email") || "imported@example.com",
          customerPhone: col(row, "phone") || "",
          city: col(row, "city") || "",
          items: [
            {
              productId: `import-${Date.now()}-${i}`,
              name: col(row, "product") || "Imported Item",
              image: "",
              category: "Women",
              price,
              quantity: qty,
            },
          ],
          payment: (PAYMENTS.includes(paymentRaw as AdminOrder["payment"]) ? paymentRaw : "cod") as AdminOrder["payment"],
          status: (STATUSES.includes(statusRaw as AdminOrderStatus) ? statusRaw : "pending") as AdminOrderStatus,
          subtotal: Number(col(row, "subtotal")) || total,
          shipping: Number(col(row, "shipping")) || 0,
          total,
        });
      });
      if (parsed.length === 0) throw new Error("empty");
      setImported((prev) => [...parsed, ...prev]);
      toast.success(t("orders.importSuccess", { count: parsed.length }));
    } catch {
      toast.error(t("orders.importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const openBulkInvoice = () => {
    if (selectedOrders.length === 0) {
      toast.error(t("orders.noSelection"));
      return;
    }
    setBulkInvoiceOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("orders.title")}
        description={t("orders.subtitle", { count: filtered.length })}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="border-border bg-card pt-5 lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-1 p-3 pt-0">
            <p className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("orders.tableStatus")}
            </p>
            <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {FILTERS.map(({ key, icon: Icon }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 border px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:w-full",
                      active
                        ? "border-secondary bg-secondary font-semibold text-white"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {key === "all" ? t("orders.all") : t(`status.${key}`)}
                    <Badge
                      className={cn(
                        "ml-auto font-bold",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {counts.get(key) ?? 0}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-start">
            <div className="relative w-full xl:max-w-xs">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("orders.searchPlaceholder")}
                className="bg-card pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card" onClick={handleExport}>
                <Download className="size-3.5 text-secondary" aria-hidden="true" />
                {t("orders.exportBtn")}
                {selected.size > 0 ? ` (${selected.size})` : ""}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-card"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3.5 text-secondary" aria-hidden="true" />
                {t("orders.importBtn")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 bg-card" onClick={openBulkInvoice}>
                <FileText className="size-3.5 text-secondary" aria-hidden="true" />
                {t("orders.invoiceBtn")}
                {selected.size > 0 ? ` (${selected.size})` : ""}
              </Button>
            </div>
          </div>

          <OrdersTable
            orders={filtered}
            selected={selected}
            onSelectionChange={setSelected}
            onStatusChange={handleStatusChange}
            onPaymentChange={handlePaymentChange}
            onBulkStatus={handleBulkStatus}
            onBulkDelete={handleBulkDelete}
          />
        </div>
      </div>

      <Dialog open={bulkInvoiceOpen} onOpenChange={setBulkInvoiceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t("orders.bulkInvoiceTitle", { count: selectedOrders.length })}
            </DialogTitle>
          </DialogHeader>
          <div id="invoice-print" className="flex flex-col gap-8">
            {selectedOrders.map((order) => (
              <div key={order.id} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <InvoiceDoc order={order} kind="delivery" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkInvoiceOpen(false)}>
              {t("orders.detailsClose")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="size-3.5" aria-hidden="true" />
              {t("orders.invPrint")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
