"use client";

import { useTranslations } from "next-intl";
import {
  Bell,
  CheckCircle2,
  Circle,
  KeyRound,
  Landmark,
  Settings,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountingHero } from "@/components/admin/accounting/AccountingHero";
import { CustomerAvatar } from "@/components/admin/customers/shared";
import { useVendorStore } from "@/store/vendor.store";
import { SettingTabs } from "@/components/vendor/shipping-settings-shared";

export default function VendorSettingsPage() {
  const t = useTranslations("Dashboard.Vendor");
  const store = useVendorStore();
  const profile = store.accountProfile;
  const kyc = store.kyc;
  const accounts = store.payoutAccounts;

  const completion = [
    { label: t("seProfile"), done: profile.displayName.trim().length >= 3, href: "/vendor/settings/profile" },
    { label: t("sePassword"), done: true, href: "/vendor/settings/password" },
    { label: t("seEmailVerified"), done: profile.emailVerified, href: "/vendor/settings/profile" },
    { label: t("seKyc"), done: kyc.status === "verified", href: "/vendor/settings/kyc" },
    { label: t("sePayment"), done: accounts.filter((a) => a.verified).length > 0, href: "/vendor/settings/payment-account" },
    { label: t("seStore"), done: store.accountStoreSettings.storeVisible, href: "/vendor/settings/store" },
  ];
  const pct = Math.round((completion.filter((c) => c.done).length / completion.length) * 100);

  const groups: Array<{ title: string; links: Array<{ href: string; icon: typeof User; label: string; sub: string }> }> = [
    {
      title: t("seAccount"),
      links: [
        { href: "/vendor/settings/profile", icon: User, label: t("seProfile"), sub: profile.email },
        { href: "/vendor/settings/password", icon: KeyRound, label: t("sePassword"), sub: "••••••••" },
        { href: "/vendor/settings/kyc", icon: ShieldCheck, label: t("seKyc"), sub: kyc.status },
        { href: "/vendor/settings/payment-account", icon: Landmark, label: t("sePayment"), sub: `${accounts.length}` },
      ],
    },
    {
      title: t("seStore"),
      links: [
        { href: "/vendor/settings/store", icon: Store, label: t("seStore"), sub: store.accountStoreSettings.vacation ? t("seVacation") : t("seOn") },
      ],
    },
    {
      title: t("seNotif"),
      links: [
        { href: "/vendor/settings/notifications", icon: Bell, label: t("seNotif"), sub: `${store.notifyPrefs.length}` },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_settings")} title={t("seTitle")} subtitle={t("seSubtitle")}
        highlightLabel={t("seSetup")} highlightValue={`${pct}%`} highlightIcon={Settings}
      />

      <SettingTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {groups.map((g) => (
            <Card key={g.title} className="border-border bg-card">
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="font-heading text-base font-bold">{g.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 px-4 pb-4">
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href as "/vendor/settings"} className="flex items-center gap-3 border border-border p-3 transition-colors hover:border-secondary">
                    <span className="flex size-9 shrink-0 items-center justify-center bg-secondary/10">
                      <l.icon className="size-4 text-secondary" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{l.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{l.sub}</span>
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("seSecurity")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex items-center gap-3">
                <CustomerAvatar name={profile.displayName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profile.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.email} · {profile.phone}</p>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-border text-sm">
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("seEmailVerified")}</span><span className={profile.emailVerified ? "font-bold text-green-700" : "font-bold text-destructive"}>{profile.emailVerified ? "✓" : "—"}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("sePhoneVerified")}</span><span className={profile.phoneVerified ? "font-bold text-green-700" : "font-bold text-destructive"}>{profile.phoneVerified ? "✓" : "—"}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("seTwoFactor")}</span><span className="font-bold">{profile.twoFactor ? t("seOn") : t("seOff")}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">{t("seLastLogin")}</span><span className="font-mono text-xs font-bold">{profile.lastLogin}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("seSetup")} · {pct}%</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 px-4 pb-4">
              <div className="h-2 w-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
              </div>
              {completion.map((c) => (
                <Link key={c.label} href={c.href as "/vendor/settings"} className="flex items-center gap-2 py-1 text-sm transition-colors hover:text-secondary">
                  {c.done ? <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-hidden="true" /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  {c.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
