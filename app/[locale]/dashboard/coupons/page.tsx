"use client";

import { useTranslations } from "next-intl";
import { Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface Coupon {
  code: string;
  discount: string;
  used: number;
  limit: number;
  status: "active" | "scheduled";
  expiry: string;
}

const COUPONS: Coupon[] = [
  { code: "WELCOME10", discount: "10% OFF", used: 342, limit: 500, status: "active", expiry: "31 Dec 2026" },
  { code: "EID20", discount: "20% OFF", used: 518, limit: 1000, status: "active", expiry: "30 Jun 2027" },
  { code: "PUJA15", discount: "15% OFF", used: 129, limit: 400, status: "active", expiry: "15 Oct 2026" },
  { code: "FLAT200", discount: "৳200 OFF", used: 0, limit: 300, status: "scheduled", expiry: "01 Nov 2026" },
  { code: "FREESHIP", discount: "Free Delivery", used: 764, limit: 2000, status: "active", expiry: "31 Dec 2026" },
];

export default function DashboardCouponsPage() {
  const t = useTranslations("Dashboard.admin");

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("coupons.title")}
        description={t("coupons.subtitle", { count: COUPONS.length })}
      />

      <Card className="border-border bg-card">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("coupons.tableCode")}</TableHead>
                <TableHead>{t("coupons.tableDiscount")}</TableHead>
                <TableHead>{t("coupons.tableUsage")}</TableHead>
                <TableHead>{t("coupons.tableStatus")}</TableHead>
                <TableHead className="text-right">{t("coupons.tableExpiry")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COUPONS.map((coupon) => {
                const pct = Math.min(100, Math.round((coupon.used / coupon.limit) * 100));
                return (
                  <TableRow key={coupon.code}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 bg-muted px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-foreground">
                        <Scissors className="size-3.5 text-secondary" aria-hidden="true" />
                        {coupon.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {coupon.discount}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-40 flex-col gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {coupon.used} / {coupon.limit}
                        </p>
                        <div className="h-1.5 w-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          coupon.status === "active"
                            ? "bg-green-600/10 font-semibold text-green-700"
                            : "bg-primary/20 font-semibold text-[#8a5a00]"
                        }
                      >
                        {t(`coupons.${coupon.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      {coupon.expiry}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
