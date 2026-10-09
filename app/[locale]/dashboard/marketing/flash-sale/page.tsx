"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Eye,
  Flame,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Countdown, MarketingStatusBadge, useCountdown } from "@/components/admin/marketing/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { salePrice, type FlashSale } from "@/features/admin/marketing";
import { useMarketingStore, useMktFlash } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Flame className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function Remaining({ endsAt }: { endsAt: number }) {
  const { over, days, hours, minutes } = useCountdown(endsAt);
  const t = useTranslations("Dashboard.marketing");
  if (over) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="font-mono text-xs font-bold whitespace-nowrap text-secondary">
      {days}{t("days")[0]} : {hours}{t("hours")[0]} : {minutes}{t("minutes")[0]}
    </span>
  );
}

export default function FlashSalePage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const sales = useMktFlash();
  const store = useMarketingStore();
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDiscount, setFDiscount] = useState("Up to 30%");
  const [fStart, setFStart] = useState("2026-09-26");
  const [fEnd, setFEnd] = useState("2026-09-30");
  const [fMax, setFMax] = useState(1000);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.name.toLowerCase().includes(q));
  }, [sales, query]);

  const stats = [
    { label: t("sFlashTotal"), value: num(sales.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sLive"), value: num(sales.filter((s) => s.status === "active").length), tile: "bg-green-600/10 text-green-700" },
    { label: t("sUpcoming"), value: num(sales.filter((s) => s.status === "scheduled").length), tile: "bg-primary/20 text-[#8a5a00]" },
    { label: t("sCompleted"), value: num(sales.filter((s) => s.status === "completed").length), tile: "bg-muted text-muted-foreground" },
    { label: t("sSaleProducts"), value: num(sales.reduce((n, s) => n + s.products.length, 0)), tile: "bg-secondary/15 text-secondary" },
    { label: t("sFlashSales"), value: money(sales.reduce((n, s) => n + s.sales, 0)), tile: "bg-primary/15 text-secondary" },
  ];

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFDesc(""); setFDiscount("Up to 30%");
    setFStart("2026-09-26"); setFEnd("2026-09-30"); setFMax(1000);
    setDialogOpen(true);
  };

  const openEdit = (s: FlashSale) => {
    setEditId(s.id);
    setFName(s.name); setFDesc(s.description); setFDiscount(s.discount);
    setFStart(s.start); setFEnd(s.end); setFMax(s.maxQty);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!fName.trim()) return;
    if (editId) {
      store.patchFlash(editId, { name: fName.trim(), description: fDesc.trim(), discount: fDiscount, start: fStart, end: fEnd, maxQty: fMax });
      toast.success(t("toastUpdated"));
    } else {
      store.addFlash({
        id: `fs-${sales.length + 1}`,
        name: fName.trim(), description: fDesc.trim(), discount: fDiscount,
        start: fStart, end: fEnd, endsAt: Date.now() + 1000 * 60 * 60 * 48,
        maxQty: fMax, sales: 0, status: "scheduled", products: [],
      });
      toast.success(t("toastCreated"));
    }
    setDialogOpen(false);
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const viewed = viewId ? (sales.find((s) => s.id === viewId) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("fTitle")}
        subtitle={t("fSubtitle", { count: filtered.length })}
        highlightLabel={t("sLive")}
        highlightValue={num(sales.filter((s) => s.status === "active").length)}
        highlightIcon={Flame}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addFlash")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((s) => {
            const open = expanded.has(s.id);
            return (
              <Card key={s.id} className="overflow-hidden border-border bg-card py-0">
                <CardContent className="flex flex-col gap-3 p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      aria-expanded={open}
                      aria-label={s.name}
                      className="flex size-7 items-center justify-center border border-border text-muted-foreground hover:text-secondary"
                    >
                      <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-bold">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.discount} · {s.start} → {s.end} · {num(s.sales)} {t("tSales")}
                      </p>
                    </div>
                    <MarketingStatusBadge status={s.status} />
                    <Remaining endsAt={s.endsAt} />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewId(s.id)} aria-label={`${t("viewTitle")} ${s.name}`} title={t("viewTitle")}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label={`${t("editTitle")} ${s.name}`} title={t("editTitle")}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      {s.status === "active" ? (
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.patchFlash(s.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={s.name} title={t("pause")}>
                          <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                        </Button>
                      ) : s.status !== "completed" && s.status !== "expired" ? (
                        <Button variant="ghost" size="icon-sm" onClick={() => { store.patchFlash(s.id, { status: "active" }); toast.success(t("toastActivated")); }} aria-label={s.name} title={t("activate")}>
                          <Play className="size-4 text-green-600" aria-hidden="true" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeFlash([s.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={s.name}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  {open ? (
                    <div className="overflow-x-auto border-t border-border pt-3">
                      <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_td:not(:first-child)]:border-l [&_th]:h-10 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                        <TableHeader>
                          <TableRow className="bg-secondary hover:bg-secondary">
                            <TableHead>{t("tProduct")}</TableHead>
                            <TableHead className="text-right">{t("tRegular")}</TableHead>
                            <TableHead className="text-right">{t("tDiscount")}</TableHead>
                            <TableHead className="text-right">{t("tSalePrice")}</TableHead>
                            <TableHead className="text-right">{t("tStock")}</TableHead>
                            <TableHead className="text-right">{t("tSold")}</TableHead>
                            <TableHead>{t("tStatus")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {s.products.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm font-semibold whitespace-nowrap">{p.product}</TableCell>
                              <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground line-through">
                                {money(p.regular)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold whitespace-nowrap text-destructive">
                                {p.discount}%
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold whitespace-nowrap text-secondary">
                                {money(salePrice(p.regular, p.discount))}
                              </TableCell>
                              <TableCell className="text-right text-sm">{num(p.stock)}</TableCell>
                              <TableCell className="text-right text-sm font-semibold">
                                {num(p.sold)} / {num(p.stock + p.sold)}
                              </TableCell>
                              <TableCell>
                                <MarketingStatusBadge status={p.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Flame} title={t("emptyTitle")} description={t("emptyFlash")} />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewed} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewed ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{viewed.name}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <Countdown endsAt={viewed.endsAt} />
              </div>
              <p className="text-center text-sm text-muted-foreground">{viewed.description}</p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewId(null)}>{t("cancelBtn")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addFlash")}
            </DialogTitle>
          </DialogHeader>
          <SectionCard title={t("fSaleName")}>
            <Field label={t("fSaleName")}>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Midnight Mega Sale" />
            </Field>
            <Field label={t("fDescription")}>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="bg-card" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("tDiscount")}>
                <Input value={fDiscount} onChange={(e) => setFDiscount(e.target.value)} className="bg-card" placeholder="Up to 30%" />
              </Field>
              <Field label={t("fMaxQty")}>
                <Input type="number" min={1} value={fMax} onChange={(e) => setFMax(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <Field label={t("fStartDate")}>
                <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} className="bg-card" />
              </Field>
              <Field label={t("fEndDate")}>
                <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} className="bg-card" />
              </Field>
            </div>
          </SectionCard>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button size="sm" onClick={handleSave}>{t("saveBtn")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
