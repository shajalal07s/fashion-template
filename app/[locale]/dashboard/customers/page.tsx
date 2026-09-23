"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Search, UserSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";

export default function DashboardCustomersPage() {
  const t = useTranslations("Dashboard.admin");
  const format = useFormatter();
  const orders = useAdminOrders();
  const [query, setQuery] = useState("");

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const date = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("customers.title")}
        description={t("customers.subtitle", { count: filtered.length })}
      />

      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("customers.searchPlaceholder")}
          className="bg-card pl-9"
        />
      </div>

      {filtered.length > 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customers.tableCustomer")}</TableHead>
                  <TableHead>{t("customers.tablePhone")}</TableHead>
                  <TableHead>{t("customers.tableCity")}</TableHead>
                  <TableHead className="text-center">{t("customers.tableOrders")}</TableHead>
                  <TableHead className="text-right">{t("customers.tableSpent")}</TableHead>
                  <TableHead className="text-right">{t("customers.tableLastOrder")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-9 shrink-0 items-center justify-center bg-primary/20 text-sm font-bold text-foreground"
                        >
                          {customer.name[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold whitespace-nowrap text-foreground">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {customer.phone}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {customer.city}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{customer.orders}</TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-secondary">
                      {money(customer.spent)}
                    </TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      {date(customer.lastOrder)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState
              icon={UserSearch}
              title={t("customers.emptyTitle")}
              description={t("customers.emptyDescription")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
