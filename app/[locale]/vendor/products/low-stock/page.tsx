"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import type { VendorProduct } from "@/features/vendor/vendor";
import { useVendorProducts, useVendorStore } from "@/store/vendor.store";
import { toast } from "sonner";

export default function LowStockPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const products = useVendorProducts();
  const store = useVendorStore();
  const num = (v: number) => format.number(v);

  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockAmt, setRestockAmt] = useState(20);

  const low = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.lowThreshold),
    [products]
  );

  const restocking = restockId ? (products.find((p) => p.id === restockId) ?? null) : null;

  const handleRestock = () => {
    if (!restocking) return;
    store.adjustStock(restocking.id, Math.max(0, restockAmt), "Quick restock");
    setRestockId(null);
    toast.success(t("toastStock"));
  };

  const openRestock = (p: VendorProduct) => {
    setRestockId(p.id);
    setRestockAmt(20);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_products")}
        title={t("lTitle")}
        subtitle={t("lSubtitle", { count: low.length })}
        highlightLabel={t("sLow")}
        highlightValue={num(low.length)}
        highlightIcon={AlertTriangle}
      />

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {low.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead className="text-right">{t("tCurrent")}</TableHead>
                  <TableHead className="text-right">{t("tThreshold2")}</TableHead>
                  <TableHead className="text-right">{t("tLastSold")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-36">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {low.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.name} className="size-9 shrink-0 object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="max-w-40 truncate text-sm font-semibold" title={p.name}>{p.name}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-[#8a5a00]">{num(p.stock)}</TableCell>
                    <TableCell className="text-right text-sm">{num(p.lowThreshold)}</TableCell>
                    <TableCell className="text-right text-sm">{num(p.sold)}</TableCell>
                    <TableCell>
                      <span className="bg-primary/20 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#8a5a00]">
                        {t("stLow")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => openRestock(p)}>
                          <Plus className="size-3.5" aria-hidden="true" />
                          {t("quickRestock")}
                        </Button>
                        <Link href={`/vendor/products/${p.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" aria-label={`${t("edit")} ${p.name}`} title={t("edit")}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={AlertTriangle} title={t("emptyTitle")} description={t("emptyProducts")} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!restocking} onOpenChange={(open) => !open && setRestockId(null)}>
        <DialogContent className="sm:max-w-sm">
          {restocking ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">
                  {t("quickRestock")} · {restocking.name}
                </DialogTitle>
              </DialogHeader>
              <Field label={t("restockAmt")}>
                <Input type="number" min={0} value={restockAmt} onChange={(e) => setRestockAmt(Math.max(0, Number(e.target.value) || 0))} className="bg-card" />
              </Field>
              <p className="text-xs text-muted-foreground">
                {t("newBalance")}: <strong>{num(restocking.stock + restockAmt)}</strong>
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setRestockId(null)}>{t("cancelBtn")}</Button>
                <Button size="sm" onClick={handleRestock}>{t("saveBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
