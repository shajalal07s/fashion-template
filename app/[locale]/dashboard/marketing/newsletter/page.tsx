"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MarketingStatusBadge } from "@/components/admin/marketing/shared";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import type { MktStatus, SubscriberStatus } from "@/features/admin/marketing";
import { useMarketingStore, useMktNewsletters, useMktSubscribers } from "@/store/marketing.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BLOCKS = ["blkHeading", "blkText", "blkImage", "blkButton", "blkDivider", "blkProduct", "blkGrid", "blkCoupon", "blkSpacer"] as const;
function Mini({ label, value, tile }: { label: string; value: string; tile: string }) {
  return (
    <Card className="overflow-hidden border-border bg-card py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
          <Mail className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
          <span className="font-heading truncate text-xl font-bold text-foreground">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

const SUB_CLASS: Record<SubscriberStatus, string> = {
  subscribed: "bg-green-600/10 text-green-700",
  unsubscribed: "bg-muted text-muted-foreground",
  pending: "bg-primary/20 text-[#8a5a00]",
  bounced: "bg-destructive/10 text-destructive",
};

export default function NewsletterPage() {
  const t = useTranslations("Dashboard.marketing");
  const ts = useTranslations("Dashboard.sidebar");
  const format = useFormatter();
  const subscribers = useMktSubscribers();
  const newsletters = useMktNewsletters();
  const store = useMarketingStore();
  const num = (v: number) => format.number(v);

  const [tab, setTab] = useState("subs");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState("desktop");
  const [editId, setEditId] = useState<string | null>(null);
  const [fName, setFName] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fPreview, setFPreview] = useState("");
  const [fSender, setFSender] = useState("Fashion Store");
  const [fSenderEmail, setFSenderEmail] = useState("hello@fashionstore.com");
  const [fStatus, setFStatus] = useState<MktStatus>("draft");
  const [blocks, setBlocks] = useState<string[]>(["blkHeading", "blkText", "blkButton"]);

  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [subscribers, query]);

  const pageCount = Math.max(1, Math.ceil(filteredSubs.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleSubs = filteredSubs.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const bySub = (s: SubscriberStatus) => subscribers.filter((x) => x.status === s).length;
  const totalSent = newsletters.reduce((n, x) => n + x.sent, 0);
  const stats = [
    { label: t("sSubs"), value: num(subscribers.length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sActiveSubs"), value: num(bySub("subscribed")), tile: "bg-green-600/10 text-green-700" },
    { label: t("sUnsub"), value: num(bySub("unsubscribed")), tile: "bg-muted text-muted-foreground" },
    { label: t("sSent"), value: num(newsletters.filter((n) => n.status === "sent").length), tile: "bg-secondary/15 text-secondary" },
    { label: t("sEmails"), value: num(totalSent), tile: "bg-primary/15 text-secondary" },
    { label: t("sOpen"), value: "42%", tile: "bg-green-600/10 text-green-700" },
    { label: t("sClick"), value: "8.4%", tile: "bg-primary/20 text-[#8a5a00]" },
  ];

  const openAdd = () => {
    setEditId(null);
    setFName(""); setFSubject(""); setFPreview("");
    setFSender("Fashion Store"); setFSenderEmail("hello@fashionstore.com");
    setFStatus("draft");
    setBlocks(["blkHeading", "blkText", "blkButton"]);
    setDialogOpen(true);
  };

  const handleSave = (status: MktStatus) => {
    if (!fName.trim() || !fSubject.trim()) return;
    if (editId) {
      store.patchNewsletter(editId, { name: fName.trim(), subject: fSubject.trim(), status });
    } else {
      store.addNewsletter({
        id: `nl-${newsletters.length + 1}`,
        name: fName.trim(), subject: fSubject.trim(),
        recipients: bySub("subscribed") * 5334, sent: 0, openRate: 0, clickRate: 0,
        date: "2026-09-26", status,
      });
    }
    setDialogOpen(false);
    toast.success(status === "scheduled" ? t("toastCreated") : t("toastSaved"));
  };

  const renderBlock = (b: string) => {
    switch (b) {
      case "blkHeading":
        return <p className="font-heading text-xl font-bold">{fName || "Campaign Heading"}</p>;
      case "blkText":
        return <p className="text-sm text-muted-foreground">{fPreview || "Your paragraph text goes here. Tell subscribers why this drop matters."}</p>;
      case "blkImage":
        return <div className="flex h-28 items-center justify-center bg-gradient-to-r from-primary/20 to-secondary/20 text-xs font-bold text-secondary">IMAGE · 600 × 200</div>;
      case "blkButton":
        return <span className="w-fit bg-secondary px-5 py-2 text-xs font-bold tracking-widest text-white uppercase">{t("shopNow")}</span>;
      case "blkDivider":
        return <hr className="border-border" />;
      case "blkProduct":
        return (
          <div className="flex items-center gap-3 border border-border p-2">
            <span className="flex size-12 items-center justify-center bg-primary/15 font-heading text-lg font-bold text-secondary">K</span>
            <span>
              <span className="block text-sm font-bold">Printed Kurti - Red</span>
              <span className="block text-xs text-muted-foreground">৳2,450 → ৳1,960</span>
            </span>
          </div>
        );
      case "blkGrid":
        return (
          <div className="grid grid-cols-2 gap-2">
            {["Kurti", "Saree"].map((p) => (
              <div key={p} className="border border-border p-2 text-center text-xs font-bold">{p}</div>
            ))}
          </div>
        );
      case "blkCoupon":
        return <p className="mx-auto w-fit border border-dashed border-secondary/50 bg-secondary/5 px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-secondary">SAVE20</p>;
      default:
        return <div className="h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("marketing")}
        title={t("nlTitle")}
        subtitle={t("nlSubtitle", { count: subscribers.length })}
        highlightLabel={t("sOpen")}
        highlightValue="42%"
        highlightIcon={Mail}
      >
        <button type="button" onClick={openAdd} className={heroPillClassName}>
          <Plus className="size-3.5" aria-hidden="true" />
          {t("addNewsletter")}
        </button>
      </AccountingHero>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {stats.map((s) => (
          <Mini key={s.label} {...s} />
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="subs">{t("subsTab")} ({subscribers.length})</TabsTrigger>
          <TabsTrigger value="campaigns">{t("campaignsTab")} ({newsletters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="subs" className="flex flex-col gap-4 pt-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder={t("searchPlaceholder")} className="bg-card pl-9" />
          </div>
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              {visibleSubs.length > 0 ? (
                <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead>{t("tSubscriber")}</TableHead>
                      <TableHead>{t("tSource")}</TableHead>
                      <TableHead>{t("tSubscribed")}</TableHead>
                      <TableHead>{t("tStatus")}</TableHead>
                      <TableHead className="w-28">{t("colAction")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSubs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex size-8 shrink-0 items-center justify-center bg-secondary/15 text-xs font-bold text-secondary">
                              <Users className="size-4" aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold whitespace-nowrap">{s.name}</span>
                              <span className="block text-xs text-muted-foreground">{s.email}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{s.source}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{s.subscribed}</TableCell>
                        <TableCell>
                          <Badge className={cn("font-semibold whitespace-nowrap", SUB_CLASS[s.status])}>
                            {t(`sb${s.status[0].toUpperCase()}${s.status.slice(1)}` as "sbSubscribed")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {s.status === "subscribed" ? (
                              <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.patchSubscriber(s.id, { status: "unsubscribed" }); toast.success(t("toastUpdated")); }} aria-label={s.email} title={t("sbUnsubscribed")}>
                                <X className="size-4" aria-hidden="true" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon-sm" onClick={() => { store.patchSubscriber(s.id, { status: "subscribed" }); toast.success(t("toastUpdated")); }} aria-label={s.email} title={t("sbSubscribed")}>
                                <Plus className="size-4 text-green-600" aria-hidden="true" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeSubscribers([s.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={s.email}>
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8">
                  <EmptyState icon={Users} title={t("emptyTitle")} description={t("emptySubs")} />
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
        </TabsContent>

        <TabsContent value="campaigns" className="flex flex-col gap-4 pt-2">
          <Card className="overflow-hidden border-border bg-card py-0">
            <CardContent className="overflow-x-auto p-0">
              <Table className="[&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_td:not(:first-child)]:border-l [&_th]:h-12 [&_th]:border-white/25 [&_th]:px-4 [&_th]:text-white [&_th:not(:first-child)]:border-l">
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>{t("tCampName")}</TableHead>
                    <TableHead className="text-right">{t("tRecipients")}</TableHead>
                    <TableHead className="text-right">{t("tOpenRate")}</TableHead>
                    <TableHead className="text-right">{t("tClickRate")}</TableHead>
                    <TableHead>{t("tStatus")}</TableHead>
                    <TableHead className="w-32">{t("colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletters.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <p className="max-w-44 truncate text-sm font-semibold" title={n.name}>{n.name}</p>
                        <p className="max-w-52 truncate text-xs text-muted-foreground" title={n.subject}>{n.subject}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{num(n.recipients)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{n.openRate}%</TableCell>
                      <TableCell className="text-right text-sm font-bold">{n.clickRate}%</TableCell>
                      <TableCell>
                        <MarketingStatusBadge status={n.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {n.status === "scheduled" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchNewsletter(n.id, { status: "sent", sent: n.recipients }); toast.success(t("toastUpdated")); }} aria-label={n.name} title={t("sent")}>
                              <Send className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                          ) : n.status === "paused" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchNewsletter(n.id, { status: "scheduled" }); toast.success(t("toastActivated")); }} aria-label={n.name} title={t("scheduled")}>
                              <Play className="size-4 text-green-600" aria-hidden="true" />
                            </Button>
                          ) : n.status === "draft" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchNewsletter(n.id, { status: "scheduled" }); toast.success(t("toastCreated")); }} aria-label={n.name} title={t("scheduled")}>
                              <Send className="size-4 text-secondary" aria-hidden="true" />
                            </Button>
                          ) : null}
                          {n.status !== "sent" ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => { store.patchNewsletter(n.id, { status: "paused" }); toast.success(t("toastPaused")); }} aria-label={n.name} title={t("paused")}>
                              <Pause className="size-4 text-[#8a5a00]" aria-hidden="true" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => { store.removeNewsletters([n.id]); toast.success(t("toastDeleted", { count: 1 })); }} aria-label={n.name}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editId ? t("editTitle") : t("addNewsletter")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <SectionCard title={t("nlForm")}>
                <Field label={t("fCampName")}>
                  <Input value={fName} onChange={(e) => setFName(e.target.value)} className="bg-card" placeholder="Eid Lookbook" />
                </Field>
                <Field label={t("fSubject")}>
                  <Input value={fSubject} onChange={(e) => setFSubject(e.target.value)} className="bg-card" placeholder="Eid styles just dropped" />
                </Field>
                <Field label={t("fPreview")}>
                  <Input value={fPreview} onChange={(e) => setFPreview(e.target.value)} className="bg-card" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("fSender")}>
                    <Input value={fSender} onChange={(e) => setFSender(e.target.value)} className="bg-card" />
                  </Field>
                  <Field label={t("fSenderEmail")}>
                    <Input value={fSenderEmail} onChange={(e) => setFSenderEmail(e.target.value)} className="bg-card" />
                  </Field>
                </div>
                <Field label={t("fStatus")}>
                  <Select value={fStatus} onValueChange={(v) => setFStatus((v as MktStatus) ?? "draft")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["draft", "scheduled", "paused"] as MktStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </SectionCard>
              <SectionCard title={t("nlEditor")}>
                <div className="flex flex-wrap gap-1.5">
                  {BLOCKS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBlocks((p) => [...p, b])}
                      className="border border-border bg-card px-2 py-1 text-[11px] font-semibold transition-colors hover:border-secondary hover:text-secondary"
                    >
                      + {t(b)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  {blocks.map((b, i) => (
                    <div key={`${b}-${i}`} className="flex items-center gap-2 border border-border bg-card px-2 py-1.5 text-xs">
                      <span className="flex-1 font-semibold">{t(b)}</span>
                      <button type="button" aria-label={`${t(b)} ${i}`} onClick={() => setBlocks((p) => p.filter((_, x) => x !== i))} className="flex size-5 items-center justify-center text-destructive hover:bg-muted">
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
            <div className="flex flex-col gap-2">
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList>
                  <TabsTrigger value="desktop">{t("tabDesktop")}</TabsTrigger>
                  <TabsTrigger value="mobile">{t("tabMobile")}</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="pt-2">
                  <div className="flex flex-col gap-3 border border-border bg-white p-4 text-[#1a0d00]">
                    <p className="text-[11px] text-muted-foreground">{fSender} · {fSenderEmail}</p>
                    <p className="font-heading text-lg font-bold">{fSubject || "Subject"}</p>
                    {blocks.map((b, i) => (
                      <div key={`${b}-${i}`}>{renderBlock(b)}</div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="mobile" className="pt-2">
                  <div className="mx-auto flex max-w-64 flex-col gap-2 border border-border bg-white p-3 text-[#1a0d00]">
                    <p className="text-[10px] text-muted-foreground">{fSender}</p>
                    <p className="font-heading text-base font-bold">{fSubject || "Subject"}</p>
                    {blocks.map((b, i) => (
                      <div key={`${b}-${i}`}>{renderBlock(b)}</div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>{t("cancelBtn")}</Button>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => handleSave("draft")}>{t("draft")}</Button>
            <Button size="sm" onClick={() => handleSave("scheduled")}>
              <Send className="size-3.5" aria-hidden="true" />
              {t("scheduled")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
