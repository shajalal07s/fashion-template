"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { Field } from "@/components/admin/products/edit/sections";
import type { EnrichedStatus } from "@/features/vendor/reviews";
import { enrichReviews, reviewResponseSchema } from "@/features/vendor/reviews";
import { downloadCsv } from "@/features/vendor/earnings";
import { useVendorOrders, useVendorProducts, useVendorReviews, useVendorStore } from "@/store/vendor.store";
import { ReviewTabs, StarsRow } from "@/components/vendor/review-store-shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "newest" | "oldest" | "highest" | "lowest" | "helpful" | "reported";

function useDebounced<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setD(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return d;
}

export default function VendorProductReviewsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const format = useFormatter();
  const raw = useVendorReviews();
  const products = useVendorProducts();
  const orders = useVendorOrders();
  const store = useVendorStore();

  const num = (v: number) => format.number(v);
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const reviews = useMemo(() => enrichReviews(raw, products), [raw, products]);

  const [ready, setReady] = useState(false);
  const [qRaw, setQRaw] = useState("");
  const query = useDebounced(qRaw);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState(false);
  const [fRating, setFRating] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fProduct, setFProduct] = useState("all");
  const [fVerified, setFVerified] = useState("all");
  const [fImage, setFImage] = useState("all");
  const [fResponse, setFResponse] = useState("all");
  const [custId, setCustId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...reviews];
    if (fRating !== "all") list = list.filter((r) => r.rating === Number(fRating));
    if (fStatus !== "all") list = list.filter((r) => r.status === fStatus);
    if (fProduct !== "all") list = list.filter((r) => r.productId === fProduct);
    if (fVerified !== "all") list = list.filter((r) => (fVerified === "yes") === r.verified);
    if (fImage !== "all") list = list.filter((r) => (fImage === "yes") === (r.images.length > 0));
    if (fResponse !== "all") list = list.filter((r) => (fResponse === "yes") === r.replied);
    if (q) {
      list = list.filter((r) =>
        `${r.customer} ${r.product} ${r.sku} ${r.text} ${r.id}`.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "oldest": list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "highest": list.sort((a, b) => b.rating - a.rating); break;
      case "lowest": list.sort((a, b) => a.rating - b.rating); break;
      case "helpful": list.sort((a, b) => b.helpful - a.helpful); break;
      case "reported": list.sort((a, b) => b.reports - a.reports); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [reviews, query, fRating, fStatus, fProduct, fVerified, fImage, fResponse, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (fRating !== "all") chips.push({ label: `${fRating}★`, clear: () => setFRating("all") });
  if (fStatus !== "all") chips.push({ label: fStatus, clear: () => setFStatus("all") });
  if (fVerified !== "all") chips.push({ label: fVerified === "yes" ? t("rwVerified") : "unverified", clear: () => setFVerified("all") });
  if (fImage !== "all") chips.push({ label: t("rwHasImage"), clear: () => setFImage("all") });
  if (fResponse !== "all") chips.push({ label: t("rwHasResponse"), clear: () => setFResponse("all") });

  const clearAll = () => {
    setQRaw(""); setFRating("all"); setFStatus("all"); setFProduct("all");
    setFVerified("all"); setFImage("all"); setFResponse("all"); setPage(0);
  };

  const quickReply = (id: string, text: string) => {
    const parsed = reviewResponseSchema.safeParse({ response: text.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid response");
      return;
    }
    store.replyReview(id, text.trim());
    store.notifyVendor(`Response published for review ${id}.`, "review");
    toast.success(t("toastSaved"));
  };

  const cust = custId ? reviews.find((r) => r.id === custId) ?? null : null;
  const custHistory = cust ? reviews.filter((r) => r.customer === cust.customer) : [];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_reviews")}
        title={t("rwProducts")}
        subtitle={t("rvSubtitle", { count: filtered.length })}
        highlightLabel={t("rwTotal")}
        highlightValue={num(reviews.length)}
        highlightIcon={MessageSquare}
      >
        <button type="button" onClick={() => setSheet(true)} className={heroPillClassName}>
          {t("eApply")}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadCsv("product-reviews.csv", ["id", "customer", "product", "rating", "status", "date"],
              filtered.map((r) => [r.id, r.customer, r.product, r.rating, r.status, r.date]));
            toast.success(t("exported"));
          }}
          className={heroPillClassName}
        >
          <Download className="size-3.5" aria-hidden="true" />
          CSV
        </button>
      </AccountingHero>

      <ReviewTabs />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={qRaw} onChange={(e) => { setQRaw(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" aria-label={t("searchPlaceholder")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(fRating)} onValueChange={(v) => { setFRating(v ?? "all"); setPage(0); }}>
            <SelectTrigger size="sm" className="h-8 w-28 bg-card" aria-label={t("rwRating")}><SelectValue placeholder="★" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("eAll")}</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort((v as SortKey) ?? "newest")}>
            <SelectTrigger size="sm" className="h-8 w-40 bg-card" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("eNewest")}</SelectItem>
              <SelectItem value="oldest">{t("eOldest")}</SelectItem>
              <SelectItem value="highest">{t("rwHighest")}</SelectItem>
              <SelectItem value="lowest">{t("rwLowest")}</SelectItem>
              <SelectItem value="helpful">{t("rwMostHelpful")}</SelectItem>
              <SelectItem value="reported">{t("rwMostReported")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <button key={i} type="button" onClick={c.clear} className="flex items-center gap-1 border border-secondary/50 bg-secondary/10 px-2 py-0.5 text-[11px] font-bold text-secondary hover:bg-secondary/20">
              {c.label}<X className="size-3" aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="text-[11px] font-bold text-destructive hover:underline">{t("eClearFilters")}</button>
        </div>
      ) : null}

      {!ready ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="overflow-hidden border-border bg-card py-0">
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/5 px-4 py-3">
              <p className="text-sm font-semibold">{selected.size} selected</p>
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => {
                  downloadCsv("reviews-selected.csv", ["id", "rating"], [...selected].map((id) => [id, reviews.find((r) => r.id === id)?.rating ?? ""]));
                  toast.success(t("exported"));
                }}>{t("rwExport")}</Button>
                <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => setSelected(new Set())}>{t("eReset")}</Button>
              </div>
            </div>
          ) : null}
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            {visible.length > 0 ? (
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={visible.length > 0 && visible.every((r) => selected.has(r.id))}
                        indeterminate={visible.some((r) => selected.has(r.id)) && !visible.every((r) => selected.has(r.id))}
                        onCheckedChange={(v) => setSelected(v === true ? new Set(visible.map((r) => r.id)) : new Set())}
                        aria-label={t("rwProducts")}
                      />
                    </TableHead>
                    <TableHead>{t("rwCustomer")}</TableHead>
                    <TableHead>{t("rwProduct")}</TableHead>
                    <TableHead>{t("rwRating")}</TableHead>
                    <TableHead>{t("rwReview")}</TableHead>
                    <TableHead>{t("rwStatus")}</TableHead>
                    <TableHead className="w-32">{t("cpActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow key={r.id} className={cn(selected.has(r.id) && "bg-secondary/5")}>
                      <TableCell>
                        <Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => setSelected((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(r.id); else next.delete(r.id);
                          return next;
                        })} aria-label={r.id} />
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setCustId(r.id)} className="flex items-center gap-2 text-left">
                          <CustomerAvatar name={r.customer} size="sm" />
                          <span className="min-w-0">
                            <span className="block max-w-24 truncate text-sm font-bold hover:text-secondary hover:underline">{r.customer}</span>
                            {r.verified ? <span className="block text-[10px] font-bold text-green-700">{t("rwVerified")}</span> : null}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        {r.productId ? (
                          <Link href={`/vendor/products/${r.productId}`} className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.image} alt={r.product} className="size-9 shrink-0 object-cover" loading="lazy" />
                            <span className="block max-w-28 truncate text-xs font-semibold hover:text-secondary hover:underline">{r.product}</span>
                          </Link>
                        ) : <span className="text-xs">{r.product}</span>}
                      </TableCell>
                      <TableCell>
                        <StarsRow value={r.rating} />
                        <p className="text-[11px] font-bold">{r.rating}.0 · ♥{r.helpful}</p>
                      </TableCell>
                      <TableCell className="max-w-52">
                        <p className="truncate text-sm" title={r.text}>{r.text}</p>
                        <p className="text-[11px] text-muted-foreground">{dateOf(r.date)}{r.images.length > 0 ? ` · 📷${r.images.length}` : ""}{r.replied ? ` · ${t("rwResponded")}` : ""}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
                          r.status === "published" ? "bg-green-600/10 text-green-700"
                          : r.status === "reported" || r.status === "removed" ? "bg-destructive/10 text-destructive"
                          : "bg-primary/20 text-[#8a5a00]")}>
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Link href={`/vendor/reviews/${r.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label={`${t("view")} ${r.id}`}><Eye className="size-4" aria-hidden="true" /></Button>
                          </Link>
                          {!r.replied ? (
                            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => quickReply(r.id, "Thank you for your feedback! We appreciate your support.")}>
                              {t("rwRespond")}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <EmptyState icon={MessageSquare} title={t("eNoResults")} description={t("emptyDescription")} />
                <Button variant="outline" size="sm" className="bg-card" onClick={clearAll}>{t("eClearFilters")}</Button>
              </div>
            )}
          </CardContent>
          <CardContent className="grid gap-3 p-3 md:hidden">
            {visible.length > 0 ? visible.map((r) => (
              <div key={r.id} className="flex flex-col gap-1.5 border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <StarsRow value={r.rating} />
                  <span className="text-sm font-bold">{r.rating}.0</span>
                </div>
                <p className="truncate text-sm font-bold">{r.product}</p>
                <p className="truncate text-xs text-muted-foreground">{r.customer}{r.verified ? " · ✓" : ""}</p>
                <p className="line-clamp-3 text-sm">“{r.text}”</p>
                <p className="text-[11px] text-muted-foreground">{dateOf(r.date)} · {r.status}</p>
                <div className="flex gap-1.5 border-t border-border pt-2">
                  <Link href={`/vendor/reviews/${r.id}`}><Button variant="outline" size="sm" className="h-7 bg-card text-[11px]">{t("view")}</Button></Link>
                  {!r.replied ? <Button size="sm" className="h-7 text-[11px]" onClick={() => quickReply(r.id, "Thank you for your feedback! We appreciate your support.")}>{t("rwRespond")}</Button> : null}
                </div>
              </div>
            )) : <EmptyState icon={MessageSquare} title={t("eNoResults")} description={t("emptyDescription")} />}
          </CardContent>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} / {num(filtered.length)}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous"><ChevronLeft className="size-3.5" aria-hidden="true" /></Button>
              <span className="px-2 text-xs text-muted-foreground">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" className="h-8 bg-card" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} aria-label="Next"><ChevronRight className="size-3.5" aria-hidden="true" /></Button>
            </div>
          </div>
        </Card>
      )}

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="font-heading text-base font-bold">{t("eApply")}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Field label={t("rwStatus")}>
              <Select value={fStatus} onValueChange={(v) => setFStatus(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  {(["published", "pending", "hidden", "reported", "removed"] as EnrichedStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("rwProduct")}>
              <Select value={fProduct} onValueChange={(v) => setFProduct(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("rwVerified")}>
              <Select value={fVerified} onValueChange={(v) => setFVerified(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  <SelectItem value="yes">{t("rwVerified")}</SelectItem>
                  <SelectItem value="no">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("rwImages")}>
              <Select value={fImage} onValueChange={(v) => setFImage(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  <SelectItem value="yes">{t("rwHasImage")}</SelectItem>
                  <SelectItem value="no">No image</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("rwResponse")}>
              <Select value={fResponse} onValueChange={(v) => setFResponse(v ?? "all")}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("eAll")}</SelectItem>
                  <SelectItem value="yes">{t("rwHasResponse")}</SelectItem>
                  <SelectItem value="no">No response</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-card" onClick={() => { clearAll(); setSheet(false); }}>{t("eReset")}</Button>
              <Button className="flex-1" onClick={() => { setPage(0); setSheet(false); }}>{t("eApply")}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!cust} onOpenChange={(o: boolean) => !o && setCustId(null)}>
        <DialogContent className="sm:max-w-md">
          {cust ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
                  <CustomerAvatar name={cust.customer} />
                  {t("rwCustomerDrawer")} · {cust.customer}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col divide-y divide-border text-sm">
                <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("rwVerified")}</span><span className="font-bold">{cust.verified ? "✓" : "—"}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("rwOrdersCount")}</span><span className="font-bold">{orders.filter((o) => o.email === cust.customer.toLowerCase().replace(/ /g, "") + "@mail.com").length || custHistory.length}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("rwTotal")}</span><span className="font-bold">{custHistory.length}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground">{t("rwOrderRef")}</span><span className="font-mono text-xs font-bold">{cust.orderId}</span></div>
              </div>
              <div className="flex flex-col gap-1.5">
                {custHistory.slice(0, 3).map((h) => (
                  <Link key={h.id} href={`/vendor/reviews/${h.id}`} className="flex items-center justify-between border border-border p-2 text-sm transition-colors hover:border-secondary">
                    <span className="truncate font-semibold">{h.product}</span>
                    <StarsRow value={h.rating} />
                  </Link>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setCustId(null)}>{t("cancel")}</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}


