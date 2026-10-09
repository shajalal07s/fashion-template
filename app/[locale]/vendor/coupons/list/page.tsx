"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import type { CouponStatus, CouponType } from "@/features/vendor/coupons";
import { useVendorCoupons, useVendorStore } from "@/store/vendor.store";
import { CouponTabs, CpStatusBadge } from "@/components/vendor/payout-coupon-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VendorCouponListPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const coupons = useVendorCoupons();
  const store = useVendorStore();

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
  const num = (v: number) => format.number(v);

  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fType, setFType] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = [...coupons];
    if (fStatus !== "all") list = list.filter((c) => c.status === fStatus);
    if (fType !== "all") list = list.filter((c) => c.type === fType);
    if (needle) list = list.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(needle));
    return list.sort((a, b) => b.used - a.used);
  }, [coupons, q, fStatus, fType]);

  const toggle = (c: { id: string; status: CouponStatus }) => {
    const next: CouponStatus = c.status === "active" ? "paused" : "active";
    store.patchCoupon(c.id, { status: next });
    store.notifyVendor(`Coupon ${c.id} ${next}.`, "info");
    toast.success(t("toastSaved"));
  };

  const duplicate = (id: string) => {
    const src = coupons.find((c) => c.id === id);
    if (!src) return;
    store.addCoupon({
      ...src,
      id: `vc-${Date.now()}`,
      code: `${src.code}-COPY`,
      name: `${src.name} (Copy)`,
      status: "draft",
      used: 0, orders: 0, revenue: 0, discountGiven: 0,
      updated: "2026-09-26",
    });
    toast.success(t("toastSaved"));
  };

  const bulk = (action: "pause" | "resume" | "delete") => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === "delete") { setDeleting(ids); return; }
    for (const id of ids) store.patchCoupon(id, { status: action === "pause" ? "paused" : "active" });
    setSelected(new Set());
    toast.success(t("toastSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_coupons")}
        title={t("cpList")}
        subtitle={`${num(filtered.length)} · ${t("cpSubtitle")}`}
        highlightLabel={t("cpTotal")}
        highlightValue={num(coupons.length)}
        highlightIcon={Ticket}
      >
        <Link href="/vendor/coupons/create" className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("cpCreate")}
        </Link>
      </AccountingHero>

      <CouponTabs />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex gap-2">
          <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-32 bg-card" aria-label={t("cpStatus")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {(["draft", "scheduled", "active", "paused", "expired", "disabled"] as CouponStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fType} onValueChange={(v) => setFType(v ?? "all")}>
            <SelectTrigger size="sm" className="h-8 w-36 bg-card" aria-label={t("cpType")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {(["percent", "fixed", "shipping", "bogo", "product", "category", "minOrder"] as CouponType[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
            <p className="text-sm font-semibold">{selected.size} selected</p>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => bulk("pause")}>{t("cpPause")}</Button>
              <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => bulk("resume")}>{t("cpResume")}</Button>
              <Button size="sm" variant="outline" className="h-8 bg-card text-destructive" onClick={() => bulk("delete")}>{t("poDelete")}</Button>
            </div>
          </div>
        ) : null}
        <CardContent className="hidden overflow-x-auto p-0 md:block">
          {filtered.length > 0 ? (
            <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((c) => selected.has(c.id))}
                      indeterminate={filtered.some((c) => selected.has(c.id)) && !filtered.every((c) => selected.has(c.id))}
                      onCheckedChange={(v) => setSelected(() => {
                        if (v === true) return new Set(filtered.map((c) => c.id));
                        return new Set<string>();
                      })}
                      aria-label={t("cpList")}
                    />
                  </TableHead>
                  <TableHead>{t("cpCode")}</TableHead>
                  <TableHead>{t("cpType")}</TableHead>
                  <TableHead>{t("cpUsage")}</TableHead>
                  <TableHead>{t("cpExpiry")}</TableHead>
                  <TableHead>{t("cpStatus")}</TableHead>
                  <TableHead className="text-right">{t("cpRevenueCol")}</TableHead>
                  <TableHead className="w-32">{t("cpActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className={cn(selected.has(c.id) && "bg-secondary/5")}>
                    <TableCell>
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(c.id); else next.delete(c.id);
                        return next;
                      })} aria-label={c.code} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/vendor/coupons/${c.id}`} className="font-mono text-xs font-bold hover:text-secondary hover:underline">{c.code}</Link>
                      <p className="max-w-36 truncate text-[11px] text-muted-foreground">{c.name}</p>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{c.type} · {c.type === "percent" ? `${c.value}%` : money(c.value)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{num(c.used)}/{num(c.usageLimit)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{c.expiry}</TableCell>
                    <TableCell><CpStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap text-green-700">{money(c.revenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Link href={`/vendor/coupons/${c.id}`}>
                          <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${c.code}`}><Eye className="size-4" aria-hidden="true" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon-sm" onClick={() => { void navigator.clipboard.writeText(c.code); toast.success(t("cpCopy")); }} aria-label={t("cpCopy")}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => toggle(c)} aria-label={`${c.status === "active" ? t("cpPause") : t("cpResume")} ${c.code}`}>
                          {c.status === "active" ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${t("cpActions")} ${c.code}`} />}>
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-48">
                            <DropdownMenuItem render={<Link href={`/vendor/coupons/${c.id}`} />}>{t("viewDetails")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicate(c.id)}>{t("cpDuplicate")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggle(c)}>{c.status === "active" ? t("cpPause") : t("cpResume")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(c.code); toast.success(t("cpCopy")); }}>{t("cpCopy")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleting([c.id])} className="text-destructive">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              {t("poDelete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <EmptyState icon={Ticket} title={t("cpEmpty")} description={t("cpEmptyDesc")} />
              <Link href="/vendor/coupons/create"><Button size="sm">{t("cpCreate")}</Button></Link>
            </div>
          )}
        </CardContent>
        <CardContent className="grid gap-3 p-3 md:hidden">
          {filtered.length > 0 ? filtered.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <Link href={`/vendor/coupons/${c.id}`} className="font-mono text-sm font-bold">{c.code}</Link>
                <CpStatusBadge status={c.status} />
              </div>
              <p className="text-xs text-muted-foreground">{c.type} · {num(c.used)}/{num(c.usageLimit)} · {c.expiry}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-700">{money(c.revenue)}</span>
                <div className="flex gap-0.5">
                  <Link href={`/vendor/coupons/${c.id}`}><Button variant="ghost" size="icon-sm" aria-label={t("view")}><Eye className="size-4" aria-hidden="true" /></Button></Link>
                  <Button variant="ghost" size="icon-sm" onClick={() => toggle(c)} aria-label={t("cpPause")}><Pause className="size-4" aria-hidden="true" /></Button>
                </div>
              </div>
            </div>
          )) : <EmptyState icon={Ticket} title={t("cpEmpty")} description={t("cpEmptyDesc")} />}
        </CardContent>
      </Card>

      <Dialog open={!!deleting} onOpenChange={(o: boolean) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{t("poDelete")}?</DialogTitle>
            <DialogDescription className="font-mono">{deleting?.join(", ")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button
              size="sm"
              onClick={() => {
                if (deleting) {
                  store.removeCoupons(deleting);
                  store.notifyVendor(`Coupon(s) deleted: ${deleting.join(", ")}.`, "info");
                  toast.success(t("toastSaved"));
                  setSelected(new Set());
                }
                setDeleting(null);
              }}
            >
              {t("poDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
