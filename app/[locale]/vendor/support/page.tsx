"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown, LifeBuoy, Mail, MessageCircleQuestion, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { useVendorProfile } from "@/store/vendor.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FAQS = [
  { q: "When do I get paid?", a: "Payouts are released every Friday for the previous week's completed orders. Minimum payout is ৳1,000." },
  { q: "What is the commission rate?", a: "The default marketplace commission is 10% on the order subtotal. Category and product rules may vary." },
  { q: "How do I handle a return?", a: "Go to Orders, open the return request, inspect the item, then approve and create a refund from the order details." },
  { q: "How do I go on vacation?", a: "Open My Store and switch the store status to Vacation Mode. New orders will be paused." },
  { q: "Why is my product out of stock?", a: "Stock hits zero when all units sell. Add stock from Products → Add Stock to make it buyable again." },
];

export default function VendorSupportPage() {
  const t = useTranslations("Dashboard.Vendor");
  const profile = useVendorProfile();
  const [name, setName] = useState(profile.name);
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const send = () => {
    if (!name.trim() || !message.trim()) return;
    setMessage("");
    toast.success(t("msgSent"));
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_support")}
        title={t("spTitle")}
        subtitle={t("spSubtitle")}
        highlightLabel={t("contactTitle")}
        highlightValue="24h"
        highlightIcon={LifeBuoy}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("faqTitle")}>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-bold"
                >
                  {f.q}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
                </button>
                {open ? <p className="border-t border-border px-3 py-2 text-sm text-muted-foreground">{f.a}</p> : null}
              </div>
            );
          })}
        </SectionCard>

        <SectionCard title={t("contactTitle")}>
          <Field label={t("contactName")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card" />
          </Field>
          <Field label={t("contactMsg")}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              aria-label={t("contactMsg")}
              className="w-full border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-secondary"
              placeholder={t("contactMsg")}
            />
          </Field>
          <Button className="w-fit gap-1.5" onClick={send}>
            <Send className="size-3.5" aria-hidden="true" />
            {t("sendMsg")}
          </Button>
        </SectionCard>
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("contactTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: Phone, label: "09612-000000", sub: "9AM – 9PM" },
            { icon: Mail, label: "vendors@fashionstore.com.bd", sub: "Seller helpdesk" },
            { icon: MessageCircleQuestion, label: "Live Chat", sub: "In-app, 9AM – 11PM" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2.5 border border-border bg-card p-3">
              <span className="flex size-9 shrink-0 items-center justify-center bg-secondary/15 text-secondary">
                <c.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.sub}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
