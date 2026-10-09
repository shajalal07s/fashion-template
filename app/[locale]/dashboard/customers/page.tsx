"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Download,
  Search,
  ShieldCheck,
  ShieldX,
  ShoppingBag,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomersTable, type EnrichedCustomer } from "@/components/admin/customers/CustomersTable";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import {
  defaultStatus,
  isVerified,
  reviewsForCustomer,
  walletForCustomer,
  type CustomerStatus,
} from "@/features/admin/customer-mgmt";
import { useAdminCustomersStore } from "@/store/admin-customers.store";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import { toast } from "sonner";

function SummaryCard({ label, value, icon: Icon, tile }: { label: string; value: string; icon: typeof Users; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default function DashboardCustomersPage() {
  const t = useTranslations("Dashboard.admin");
  const tm = useTranslations("Dashboard.customers");
  const ts = useTranslations("Dashboard.sidebar");
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all");
  const [pageSize, setPageSize] = useState(10);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  const overrides = useAdminCustomersStore((s) => s.overrides);
  const deleted = useAdminCustomersStore((s) => s.deleted);
  const manual = useAdminCustomersStore((s) => s.manual);
  const removeCustomer = useAdminCustomersStore((s) => s.removeCustomer);
  const addManual = useAdminCustomersStore((s) => s.addManual);
  const statusOverrides = useCustomerMgmtStore((s) => s.statusOverrides);
  const verifiedOverrides = useCustomerMgmtStore((s) => s.verifiedOverrides);
  const setStatus = useCustomerMgmtStore((s) => s.setStatus);

  const addressByEmail = useMemo(() => {
    const map = new Map<string, { address: string; city: string }>();
    const sorted = [...orders].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    for (const o of sorted) {
      const key = o.customerEmail.toLowerCase();
      if (!map.has(key) && o.address) {
        map.set(key, { address: o.address, city: o.city });
      }
    }
    return map;
  }, [orders]);

  const rows = useMemo<EnrichedCustomer[]>(() => {
    const seen = new Set<string>();
    const list: EnrichedCustomer[] = [];
    const enrich = (c: { name: string; email: string; phone: string; city: string; orders: number; spent: number; lastOrder: string }, address: string) => {
      const k = c.email.toLowerCase();
      const verified = verifiedOverrides[k] ?? isVerified(c.email);
      return {
        ...c,
        address,
        status: statusOverrides[k] ?? defaultStatus(c.email),
        verified,
        wallet: walletForCustomer(c.email, c.spent, c.orders).balance,
        reviews: reviewsForCustomer(c.email, c.name, orders).length,
        joined: c.lastOrder,
      };
    };
    for (const m of manual) {
      const k = m.email.toLowerCase();
      if (seen.has(k) || deleted.includes(k)) continue;
      seen.add(k);
      list.push(enrich(m, m.address));
    }
    for (const c of buildCustomers(orders)) {
      const k = c.email.toLowerCase();
      if (seen.has(k) || deleted.includes(k)) continue;
      seen.add(k);
      const patch = overrides[k] ?? {};
      const ship = addressByEmail.get(k);
      list.push(
        enrich(
          {
            ...c,
            name: patch.name ?? c.name,
            phone: patch.phone ?? c.phone,
            city: patch.city ?? c.city,
          },
          ship?.address ?? ""
        )
      );
    }
    return list;
  }, [manual, orders, overrides, deleted, addressByEmail, statusOverrides, verifiedOverrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (c) =>
        (statusFilter === "all" || c.status === statusFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.phone.includes(q))
    );
  }, [rows, query, statusFilter]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    return [
      { label: tm("sTotal"), value: String(rows.length), icon: Users, tile: "bg-secondary/15 text-secondary" },
      { label: tm("sActive"), value: String(active), icon: UserCheck, tile: "bg-green-600/10 text-green-700" },
      { label: tm("sNew"), value: String(rows.filter((r) => r.orders <= 1).length), icon: UserPlus, tile: "bg-primary/15 text-secondary" },
      { label: tm("sBlocked"), value: String(rows.filter((r) => r.status === "blocked").length), icon: Ban, tile: "bg-destructive/10 text-destructive" },
      { label: tm("sVerified"), value: String(rows.filter((r) => r.verified).length), icon: ShieldCheck, tile: "bg-green-600/10 text-green-700" },
      { label: tm("sUnverified"), value: String(rows.filter((r) => !r.verified).length), icon: ShieldX, tile: "bg-muted text-muted-foreground" },
      { label: tm("sWithOrders"), value: String(rows.filter((r) => r.orders > 0).length), icon: ShoppingBag, tile: "bg-secondary/15 text-secondary" },
      { label: tm("sWithWallet"), value: String(rows.filter((r) => r.wallet > 0).length), icon: Wallet, tile: "bg-primary/15 text-secondary" },
    ];
  }, [rows, tm]);

  const handleDelete = (emails: string[]) => {
    removeCustomer(emails);
    toast.success(t("customers.toastDeleted", { count: emails.length }));
  };

  const handleBulkStatus = (emails: string[], status: CustomerStatus) => {
    for (const email of emails) {
      setStatus(
        email,
        status,
        status === "blocked" ? { reason: "Bulk action", note: "", date: "2026-09-26" } : undefined
      );
    }
    toast.success(status === "blocked" ? tm("toastBlocked") : tm("toastUnblocked"));
  };

  const csvEscape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error(t("customers.noSelection"));
      return;
    }
    const lines = [
      ["name", "email", "phone", "city", "address", "orders", "spent"].join(","),
      ...filtered.map((r) =>
        [r.name, r.email, r.phone, r.city, r.address, r.orders, r.spent].map(csvEscape).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("customers.exportSuccess", { count: filtered.length }));
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("empty");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const col = (row: string[], ...names: string[]) => {
        for (const name of names) {
          const i = headers.indexOf(name);
          if (i >= 0 && row[i]) return row[i].replace(/^"|"$/g, "");
        }
        return "";
      };
      const now = new Date().toISOString();
      const parsed: EnrichedCustomer[] = [];
      lines.slice(1).forEach((line) => {
        const row = line.split(",");
        const email = col(row, "email");
        const name = col(row, "customer", "name");
        if (!email || !name) return;
        parsed.push({
          name,
          email,
          phone: col(row, "phone"),
          city: col(row, "city") || "Dhaka",
          address: col(row, "address"),
          orders: Number(col(row, "orders")) || 0,
          spent: Number(col(row, "spent", "total")) || 0,
          lastOrder: now,
          status: "active",
          verified: false,
          wallet: 0,
          reviews: 0,
          joined: now,
        });
      });
      if (parsed.length === 0) throw new Error("empty");
      addManual(parsed);
      toast.success(t("customers.importSuccess", { count: parsed.length }));
    } catch {
      toast.error(t("customers.importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("customers")}
        title={tm("title")}
        subtitle={tm("subtitle")}
        highlightLabel={tm("sTotal")}
        highlightValue={String(rows.length)}
        highlightIcon={Users}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {tm("exportBtn")}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={heroPillClassName}>
          <Upload className="size-3.5" aria-hidden="true" />
          {t("products.importBtn")}
        </button>
      </AccountingHero>
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

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <SummaryCard key={s.label} {...s} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tm("searchPlaceholder")}
            className="bg-card pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | CustomerStatus)}
        >
          <SelectTrigger size="sm" className="h-8 w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tm("all")}</SelectItem>
            <SelectItem value="active">{tm("active")}</SelectItem>
            <SelectItem value="inactive">{tm("inactive")}</SelectItem>
            <SelectItem value="blocked">{tm("blocked")}</SelectItem>
            <SelectItem value="pending">{tm("pending")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
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
        </div>
      </div>

      {!ready ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <CustomersTable
          rows={filtered}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onDelete={handleDelete}
          onBulkDelete={handleDelete}
          onBulkStatus={handleBulkStatus}
        />
      )}
    </div>
  );
}
