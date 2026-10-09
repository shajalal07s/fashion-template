"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  Coins,
  CreditCard,
  Landmark,
  Mail,
  Percent,
  Settings as SettingsIcon,
  ShieldCheck,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { SaveBar, SettingsSearch, type SearchEntry } from "@/components/admin/settings/shared";
import { useSettingsStore } from "@/store/settings.store";
import { toast } from "sonner";

function ConfigCard({ label, value, sub, icon: Icon, tile, href }: { label: string; value: string; sub?: string; icon: LucideIcon; tile: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden border-border bg-card py-0 transition-colors hover:border-secondary">
        <CardContent className="flex items-center gap-3 p-4">
          <span className={`flex size-10 shrink-0 items-center justify-center ${tile}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
            <span className="font-heading truncate text-lg font-bold text-foreground">{value}</span>
            {sub ? <span className="truncate text-[11px] text-muted-foreground">{sub}</span> : null}
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SettingsOverviewPage() {
  const t = useTranslations("Dashboard.settings");
  const ts = useTranslations("Dashboard.sidebar");
  const s = useSettingsStore();

  const searchIndex: SearchEntry[] = [
    { label: t("gTitle"), category: ts("settings"), description: t("secWebsite"), href: "/dashboard/settings/general", value: s.general.siteName },
    { label: t("stTitle"), category: ts("settings"), description: t("secStoreInfo"), href: "/dashboard/settings/store", value: s.store.storeName },
    { label: t("cuTitle"), category: ts("settings"), description: t("secDefault"), href: "/dashboard/settings/currency", value: s.currency.code },
    { label: t("txTitle"), category: ts("settings"), description: t("secRates"), href: "/dashboard/settings/tax", value: `${s.tax.rates.length}` },
    { label: t("pmTitle"), category: ts("settings"), description: t("sActiveMethods"), href: "/dashboard/settings/payments", value: `${s.payments.filter((p) => p.status === "active").length}` },
    { label: t("shTitle"), category: ts("settings"), description: t("secMethods"), href: "/dashboard/settings/shipping", value: `${s.shipping.methods.length}` },
    { label: t("cmTitle"), category: ts("settings"), description: t("secGlobalCom"), href: "/dashboard/settings/commission", value: `${s.commission.defaultRate}%` },
    { label: t("emTitle"), category: ts("settings"), description: t("secSender"), href: "/dashboard/settings/email", value: s.email.senderEmail },
    { label: t("ntTitle"), category: ts("settings"), description: t("secEvents"), href: "/dashboard/settings/notifications", value: `${s.notifications.length}` },
    { label: t("scTitle"), category: ts("settings"), description: t("secAccount"), href: "/dashboard/settings/security", value: s.security.twoFactor ? t("on") : t("off") },
    { label: t("rlTitle"), category: ts("settings"), description: t("permTitle"), href: "/dashboard/settings/roles", value: `${s.roles.length}` },
    { label: t("adTitle"), category: ts("settings"), description: t("tabProfile"), href: "/dashboard/settings/admins", value: `${s.admins.length}` },
  ];

  const cards = [
    { label: t("ovStore"), value: s.store.status === "open" ? t("stOpen") : s.store.status === "closed" ? t("stClosed") : t("stMaintenance"), sub: s.store.storeName, icon: Store, tile: "bg-secondary/15 text-secondary", href: "/dashboard/settings/store" },
    { label: t("ovCurrency"), value: s.currency.code, sub: `${s.currency.symbol} · ${s.currency.code}`, icon: Coins, tile: "bg-primary/15 text-secondary", href: "/dashboard/settings/currency" },
    { label: t("ovTax"), value: s.tax.enabled ? t("enabled") : t("disabled"), sub: `${s.tax.rates.length} rates`, icon: Percent, tile: "bg-primary/20 text-[#8a5a00]", href: "/dashboard/settings/tax" },
    { label: t("ovPayments"), value: `${s.payments.filter((p) => p.status === "active").length} Active`, sub: s.payments.find((p) => p.isDefault)?.display ?? "", icon: CreditCard, tile: "bg-green-600/10 text-green-700", href: "/dashboard/settings/payments" },
    { label: t("ovShipping"), value: `${s.shipping.methods.filter((m) => m.status === "active").length} Active`, sub: s.shipping.defaultMethod, icon: Truck, tile: "bg-secondary/15 text-secondary", href: "/dashboard/settings/shipping" },
    { label: t("ovCommission"), value: s.commission.enabled ? t("enabled") : t("disabled"), sub: `${s.commission.defaultRate}% ${s.commission.defaultType}`, icon: Landmark, tile: "bg-primary/15 text-secondary", href: "/dashboard/settings/commission" },
    { label: t("ovEmail"), value: s.email.senderEmail ? "Configured" : "—", sub: s.email.provider.toUpperCase(), icon: Mail, tile: "bg-secondary/15 text-secondary", href: "/dashboard/settings/email" },
    { label: t("ovNotify"), value: `${s.notifications.filter((n) => n.status === "active").length} Active`, sub: "4 channels", icon: Bell, tile: "bg-primary/15 text-secondary", href: "/dashboard/settings/notifications" },
    { label: t("ovAdmins"), value: `${s.admins.length} Users`, sub: `${s.roles.length} roles`, icon: Users, tile: "bg-green-600/10 text-green-700", href: "/dashboard/settings/admins" },
    { label: t("ovSecurity"), value: s.security.twoFactor ? "2FA On" : "2FA Off", sub: `Min length ${s.security.minLength}`, icon: ShieldCheck, tile: "bg-muted text-muted-foreground", href: "/dashboard/settings/security" },
  ];

  const quick: Array<[string, string]> = [
    ["/dashboard/settings/store", t("qaStore")],
    ["/dashboard/settings/currency", t("qaCurrency")],
    ["/dashboard/settings/tax", t("qaTax")],
    ["/dashboard/settings/payments", t("qaPayments")],
    ["/dashboard/settings/shipping", t("qaShipping")],
    ["/dashboard/settings/commission", t("qaCommission")],
    ["/dashboard/settings/email", t("qaEmail")],
    ["/dashboard/settings/notifications", t("qaNotify")],
    ["/dashboard/settings/admins", t("qaAdmins")],
    ["/dashboard/settings/roles", t("qaRoles")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={ts("settings")}
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        highlightLabel={t("ovStore")}
        highlightValue={s.store.storeName}
        highlightIcon={SettingsIcon}
      />

      <SettingsSearch index={searchIndex} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <ConfigCard key={c.label} {...c} />
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading text-base font-bold">{t("qaTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quick.map(([href, label]) => (
            <Link key={href + label} href={href}>
              <Button variant="outline" className="w-full justify-start gap-2 bg-card">
                <ArrowRight className="size-3.5 text-secondary" aria-hidden="true" />
                {label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <SaveBar onSave={() => toast.success(t("toastSaved"))} />
    </div>
  );
}
