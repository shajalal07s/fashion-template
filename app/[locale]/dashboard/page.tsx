"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  ArrowRight,
  Banknote,
  Package,
  Receipt,
  ShoppingCart,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { CategoryBarChart } from "@/components/admin/charts/CategoryBarChart";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { StatusPieChart } from "@/components/admin/charts/StatusPieChart";
import { useAdminOrders } from "@/features/admin/useAdminOrders";
import {
  computeKpis,
  lowStockProducts,
  monthlyRevenue,
  ordersByStatus,
  salesByCategory,
  topProducts,
} from "@/features/admin/analytics";

export default function DashboardPage() {
  const t = useTranslations("Dashboard.admin");
  const tSide = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const orders = useAdminOrders();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const kpis = useMemo(() => computeKpis(orders), [orders]);
  const revenue = useMemo(() => monthlyRevenue(orders), [orders]);
  const categories = useMemo(() => salesByCategory(orders), [orders]);
  const statuses = useMemo(() => ordersByStatus(orders), [orders]);
  const top = useMemo(() => topProducts(orders, 5), [orders]);
  const lowStock = useMemo(() => lowStockProducts(5), []);
  const recent = useMemo(() => orders.slice(0, 8), [orders]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("overview.title")}
        description={t("overview.subtitle")}
        actions={
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              {t("overview.viewAllOrders")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("kpi.revenue")}
          value={money(kpis.revenue)}
          delta={kpis.revenueDelta}
          deltaSuffix={t("kpi.vsLastMonth")}
          icon={Banknote}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("kpi.orders")}
          value={String(kpis.orders)}
          delta={kpis.ordersDelta}
          deltaSuffix={t("kpi.vsLastMonth")}
          icon={ShoppingCart}
          iconClassName="bg-primary/15 text-secondary"
        />
        <StatCard
          label={t("kpi.avgOrder")}
          value={money(kpis.avgOrder)}
          delta={kpis.avgOrderDelta}
          deltaSuffix={t("kpi.vsLastMonth")}
          icon={Receipt}
        />
        <StatCard
          label={t("kpi.customers")}
          value={String(kpis.customers)}
          delta={kpis.customersDelta}
          deltaSuffix={t("kpi.vsLastMonth")}
          icon={Users}
          iconClassName="bg-green-600/10 text-green-700"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border bg-card pt-5 xl:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">{t("charts.revenueTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("charts.revenueSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">{t("charts.statusTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("charts.statusSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statuses} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">{t("charts.categoryTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("charts.categorySubtitle")}</p>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={categories} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card pt-5">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading text-lg font-bold">{t("overview.topProducts")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("overview.topProductsSubtitle")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {top.map(({ product, qty, revenue: rev }) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="relative block size-11 shrink-0 overflow-hidden bg-muted">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
                    {product.rating?.toFixed(1) ?? "—"} · {t("overview.sold", { count: qty })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-secondary">{money(rev)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card pt-5 md:col-span-2 xl:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="font-heading flex items-center gap-2 text-lg font-bold">
              <TriangleAlert className="size-4 text-secondary" aria-hidden="true" />
              {t("overview.lowStock")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("overview.lowStockSubtitle")}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {lowStock.map((product) => (
              <div key={product.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <Badge className="shrink-0 bg-destructive/10 font-semibold text-destructive">
                    {t("overview.unitsLeft", { count: product.stock })}
                  </Badge>
                </div>
                <div className="h-1.5 w-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${Math.min(100, (product.stock / 40) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <Link href="/dashboard/products" className="mt-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Package className="size-3.5" aria-hidden="true" />
                {tSide("products")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card pt-5">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
          <div>
            <CardTitle className="font-heading text-lg font-bold">{t("overview.recentOrders")}</CardTitle>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="gap-1 text-secondary hover:text-secondary">
              {t("overview.viewAllOrders")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable orders={recent} mode="compact" />
        </CardContent>
      </Card>
    </div>
  );
}
