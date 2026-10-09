"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Package,
  Pencil,
  Power,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { PackageSearch } from "lucide-react";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { rateLabel, type CommissionType, type ProductCommission } from "@/features/admin/commission";
import { useCommissionProducts, useCommissionStore } from "@/store/commission.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductCommissionPage() {
  const t = useTranslations("Dashboard.commission");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const products = useCommissionProducts();
  const patchProduct = useCommissionStore((s) => s.patchProduct);
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<CommissionType>("percentage");
  const [formRate, setFormRate] = useState(10);
  const [formFixed, setFormFixed] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.product.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
    );
  }, [products, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const openEdit = (p: ProductCommission) => {
    setFormType(p.type);
    setFormRate(p.rate);
    setFormFixed(p.type === "fixed" ? p.amount : 0);
    setEditId(p.id);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const amount = formType === "percentage" ? 0 : formFixed;
    patchProduct(editId, { type: formType, rate: formType === "fixed" ? 0 : formRate, amount });
    setEditId(null);
    toast.success(t("toastUpdated"));
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const lines = [
      ["product", "sku", "vendor", "price", "commission"].join(","),
      ...filtered.map((p) => [p.product, p.sku, p.vendor, p.price, rateLabel(p.type, p.rate, p.amount)].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportCsv"));
  };

  const viewed = viewId ? (products.find((p) => p.id === viewId) ?? null) : null;
  const viewedEarning = (p: ProductCommission) =>
    p.type === "percentage" ? Math.round((p.price * p.rate) / 100) : p.amount;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("commission")}
        title={t("pTitle")}
        subtitle={t("pSubtitle", { count: filtered.length })}
        highlightLabel={t("tAmount")}
        highlightValue={money(filtered.reduce((n, p) => n + viewedEarning(p), 0))}
        highlightIcon={Package}
      >
        <button type="button" onClick={handleExport} className={heroPillClassName}>
          <Download className="size-3.5" aria-hidden="true" />
          {t("exportBtn")}
        </button>
      </AccountingHero>

      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t("searchPlaceholder")}
          className="bg-card pl-9"
        />
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardContent className="overflow-x-auto p-0">
          {visible.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>{t("tProduct")}</TableHead>
                  <TableHead>{t("tVendor")}</TableHead>
                  <TableHead className="text-right">{t("tPrice")}</TableHead>
                  <TableHead>{t("tType")}</TableHead>
                  <TableHead>{t("tRate")}</TableHead>
                  <TableHead className="text-right">{t("tAmount")}</TableHead>
                  <TableHead className="text-right">{t("tEarning")}</TableHead>
                  <TableHead>{t("tStatus")}</TableHead>
                  <TableHead className="w-28">{t("colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="max-w-44 truncate text-sm font-semibold" title={p.product}>{p.product}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{p.vendor}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap">{money(p.price)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {t(`opt${p.type[0].toUpperCase()}${p.type.slice(1)}` as "optPercentage")}
                    </TableCell>
                    <TableCell className="text-sm font-bold whitespace-nowrap text-secondary">
                      {rateLabel(p.type, p.rate, p.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                      {money(viewedEarning(p))}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold whitespace-nowrap text-green-600">
                      {money(p.price - viewedEarning(p))}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold", p.status === "active" ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground")}>
                        {t(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewId(p.id)} aria-label={`${t("viewTitle")} ${p.product}`} title={t("viewTitle")}>
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label={`${t("editTitle")} ${p.product}`} title={t("editTitle")}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => patchProduct(p.id, { status: p.status === "active" ? "inactive" : "active" })}
                          aria-label={p.product}
                        >
                          <Power className={cn("size-4", p.status === "active" ? "text-green-600" : "text-muted-foreground")} aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState icon={PackageSearch} title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) || 10); setPage(0); }}>
              <SelectTrigger size="sm" className="h-8 w-20 bg-card" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </Button>
            <span className="px-2 text-xs font-medium text-muted-foreground">{safePage + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewed.product}</DialogTitle>
              </DialogHeader>
              <SectionCard title={t("pInfo")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">{t("tProduct")}</span>
                  <span className="text-right font-semibold">{viewed.product}</span>
                  <span className="text-muted-foreground">{t("tSku")}</span>
                  <span className="text-right font-mono font-semibold">{viewed.sku}</span>
                  <span className="text-muted-foreground">{t("tVendor")}</span>
                  <span className="text-right font-medium">{viewed.vendor}</span>
                  <span className="text-muted-foreground">{t("tCategory")}</span>
                  <span className="text-right font-medium">{viewed.category}</span>
                  <span className="text-muted-foreground">{t("tPrice")}</span>
                  <span className="text-right font-bold">{money(viewed.price)}</span>
                </div>
              </SectionCard>
              <SectionCard title={t("tCom")}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">{t("tType")}</span>
                  <span className="text-right font-semibold">{t(`opt${viewed.type[0].toUpperCase()}${viewed.type.slice(1)}` as "optPercentage")}</span>
                  <span className="text-muted-foreground">{t("tRate")}</span>
                  <span className="text-right font-bold text-secondary">{rateLabel(viewed.type, viewed.rate, viewed.amount)}</span>
                  <span className="text-muted-foreground">{t("tAmount")}</span>
                  <span className="text-right font-bold text-secondary">{money(viewedEarning(viewed))}</span>
                  <span className="text-muted-foreground">{t("tEarning")}</span>
                  <span className="text-right font-bold text-green-600">{money(viewed.price - viewedEarning(viewed))}</span>
                  <span className="text-muted-foreground">{t("tPriority")}</span>
                  <span className="text-right font-bold text-secondary">1 · {t("scopeProduct")}</span>
                </div>
              </SectionCard>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setViewId(null);
                    openEdit(viewed);
                  }}
                >
                  {t("editTitle")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("tType")}>
              <Select value={formType} onValueChange={(v) => setFormType(v as CommissionType)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t("optPercentage")}</SelectItem>
                  <SelectItem value="fixed">{t("optFixed")}</SelectItem>
                  <SelectItem value="mixed">{t("optMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("gRate")}>
              <Input type="number" min={0} value={formRate} onChange={(e) => setFormRate(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "fixed"} />
            </Field>
            <Field label={t("gFixed")}>
              <Input type="number" min={0} value={formFixed} onChange={(e) => setFormFixed(Math.max(0, Number(e.target.value) || 0))} className="bg-card" disabled={formType === "percentage"} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditId(null)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSaveEdit}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
