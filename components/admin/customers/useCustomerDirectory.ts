"use client";

import { useMemo } from "react";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import { buildCustomers } from "@/features/admin/analytics";
import {
  defaultStatus,
  isVerified,
  reviewsForCustomer,
  walletForCustomer,
} from "@/features/admin/customer-mgmt";
import { useAdminCustomersStore } from "@/store/admin-customers.store";
import { useCustomerMgmtStore } from "@/store/customer-mgmt.store";
import type { EnrichedCustomer } from "@/components/admin/customers/CustomersTable";

export function useCustomerDirectory(): EnrichedCustomer[] {
  const orders = useAdminOrders();
  const overrides = useAdminCustomersStore((s) => s.overrides);
  const deleted = useAdminCustomersStore((s) => s.deleted);
  const manual = useAdminCustomersStore((s) => s.manual);
  const statusOverrides = useCustomerMgmtStore((s) => s.statusOverrides);
  const verifiedOverrides = useCustomerMgmtStore((s) => s.verifiedOverrides);

  return useMemo(() => {
    const seen = new Set<string>();
    const list: EnrichedCustomer[] = [];
    const enrich = (c: {
      name: string;
      email: string;
      phone: string;
      city: string;
      orders: number;
      spent: number;
      lastOrder: string;
    }) => {
      const k = c.email.toLowerCase();
      return {
        ...c,
        address: "",
        status: statusOverrides[k] ?? defaultStatus(c.email),
        verified: verifiedOverrides[k] ?? isVerified(c.email),
        wallet: walletForCustomer(c.email, c.spent, c.orders).balance,
        reviews: reviewsForCustomer(c.email, c.name, orders).length,
        joined: c.lastOrder,
      };
    };
    for (const m of manual) {
      const k = m.email.toLowerCase();
      if (seen.has(k) || deleted.includes(k)) continue;
      seen.add(k);
      list.push(enrich(m));
    }
    for (const c of buildCustomers(orders)) {
      const k = c.email.toLowerCase();
      if (seen.has(k) || deleted.includes(k)) continue;
      seen.add(k);
      const patch = overrides[k] ?? {};
      list.push(
        enrich({ ...c, name: patch.name ?? c.name, phone: patch.phone ?? c.phone, city: patch.city ?? c.city })
      );
    }
    return list;
  }, [manual, orders, overrides, deleted, statusOverrides, verifiedOverrides]);
}
