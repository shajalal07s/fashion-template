"use client";

import { useMemo } from "react";
import { useOrderStore } from "@/store/order.store";
import { demoOrders, type AdminOrder } from "@/features/admin/analytics";

/** Demo history merged with real orders placed through the storefront. */
export function useAdminOrders(): AdminOrder[] {
  const liveOrders = useOrderStore((s) => s.orders);

  return useMemo(() => {
    const mapped: AdminOrder[] = liveOrders.map((o) => ({
      id: o.id,
      date: o.createdAt,
      customerName: o.customer.fullName,
      customerEmail: o.customer.email,
      customerPhone: o.customer.phone,
      city: o.customer.city,
      items: o.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        image: i.product.images[0] ?? "",
        category: i.product.category ?? "Women",
        price: i.price,
        quantity: i.quantity,
      })),
      payment: o.payment === "bkash" ? "bkash" : "cod",
      status: o.status,
      subtotal: o.subtotal,
      shipping: o.shippingCost,
      total: o.total,
    }));
    return [...mapped, ...demoOrders].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [liveOrders]);
}
