"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Copy,
  ExternalLink,
  Fingerprint,
  LogOut,
  Mail,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PHOTO_MAX_MB = 2;

export default function DashboardProfilePage() {
  const t = useTranslations("Dashboard.profile");
  const { user, isAuthenticated, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ label: string; value: string } | null>(null);

  const initial = (user?.name ?? "A")[0].toUpperCase();
  const current = preview ?? user?.avatar ?? null;



  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error(t("photoType"));
      return;
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      toast.error(t("photoType"));
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const savePhoto = () => {
    if (!preview || !user) return;
    setUser({ ...user, avatar: preview, updatedAt: new Date().toISOString() });
    setPreview(null);
    toast.success(t("photoSaved"));
  };

  const stats = [
    { icon: BadgeCheck, label: t("status"), value: isAuthenticated ? t("active") : t("guest"), tone: "text-green-700" },
    { icon: ShieldCheck, label: t("role"), value: user?.role ?? t("admin"), tone: "text-secondary" },
    { icon: CalendarDays, label: t("memberSince"), value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—", tone: "" },
    { icon: RefreshCw, label: t("lastUpdated"), value: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "—", tone: "" },
  ];

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: t("name"), value: isAuthenticated && user ? user.name : t("guest") },
    { label: t("email"), value: isAuthenticated && user ? user.email : "—" },
    { label: t("role"), value: user?.role ?? t("admin") },
    { label: t("userId"), value: user?.id ?? "—", mono: true },
    { label: t("memberSince"), value: user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—" },
    { label: t("lastUpdated"), value: user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—" },
    { label: t("status"), value: isAuthenticated ? t("active") : t("guest") },
  ];

  const copyValue = async () => {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.value);
      toast.success(t("copyValue"));
    } catch {
      toast.error(t("copyValue"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-border py-0">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-[#1a0d00] via-[#b35400] to-secondary px-5 py-6 md:flex-row md:items-center md:px-8">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={t("changePhoto")}
            title={t("changePhoto")}
            className="flex size-20 shrink-0 items-center justify-center overflow-hidden border-2 border-white/60 bg-white/10 text-3xl font-bold text-white backdrop-blur transition-colors hover:border-white"
          >
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current} alt={user?.name ?? "admin"} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">{t("title")}</p>
            <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
              {isAuthenticated && user ? user.name : t("guest")}
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-white/80">
              <Mail className="size-3.5" aria-hidden="true" />
              <span className="truncate">{user?.email ?? "—"}</span>
              <span className="bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                {user?.role ?? t("admin")}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => fileRef.current?.click()}>
              <Camera className="size-3.5" aria-hidden="true" />
              {t("changePhoto")}
            </Button>
            <Button size="sm" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => logout()}>
              <LogOut className="size-3.5" aria-hidden="true" />
              {t("logout")}
            </Button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
          aria-label={t("uploadPhoto")}
        />
      </Card>

      {preview ? (
        <div className="flex flex-wrap items-center gap-3 border border-secondary/50 bg-secondary/5 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="size-12 border border-border object-cover" />
          <p className="flex-1 text-sm font-semibold">{t("uploadPhoto")}</p>
          <Button size="sm" variant="outline" className="bg-card" onClick={() => setPreview(null)}>
            {t("cancel")}
          </Button>
          <Button size="sm" onClick={savePhoto}>
            {t("saveBtn")}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setDetail({ label: s.label, value: s.value })}
            className="border border-border bg-card p-3 text-left transition-colors hover:border-secondary"
            aria-label={`${s.label}: ${s.value}`}
          >
            <p className="flex items-center gap-1.5 truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              <s.icon className="size-3.5 shrink-0 text-secondary" aria-hidden="true" />
              {s.label}
            </p>
            <p className={cn("truncate font-heading text-lg font-bold", s.tone)}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-2">
            <UserRound className="size-4 text-secondary" aria-hidden="true" />
            <CardTitle className="font-heading text-base font-bold">{t("accountDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-4">
            {rows.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setDetail(row)}
                className="flex items-center justify-between gap-4 border border-border p-3 text-left text-sm transition-colors hover:border-secondary"
                aria-label={`${row.label}: ${row.value}`}
              >
                <span className="shrink-0 text-muted-foreground">{row.label}</span>
                <span className={cn("truncate font-bold", row.mono && "font-mono text-xs")}>{row.value}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">{t("uploadPhoto")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4">
              <p className="text-[11px] text-muted-foreground">{t("photoType")}</p>
              <Button size="sm" variant="outline" className="w-full bg-card" onClick={() => fileRef.current?.click()}>
                <Camera className="size-3.5" aria-hidden="true" />
                {t("changePhoto")}
              </Button>
              {current ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-card text-destructive"
                  onClick={() => {
                    if (!user) return;
                    setUser({ ...user, avatar: null });
                    setPreview(null);
                    toast.success(t("photoSaved"));
                  }}
                >
                  {t("removePhoto")}
                </Button>
              ) : null}
              <p className="flex items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
                <Fingerprint className="size-3.5" aria-hidden="true" />
                <span className="truncate font-mono">{user?.id ?? "—"}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="font-heading text-base font-bold">Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-4">
              {[
                { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders" },
                { href: "/dashboard/settings", icon: Settings, label: "Settings" },
                { href: "/", icon: ExternalLink, label: "View Store" },
              ].map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href as "/dashboard/orders"}
                  className="flex items-center gap-3 border border-border p-3 text-sm font-bold transition-colors hover:border-secondary hover:text-secondary"
                >
                  <l.icon className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o: boolean) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-base font-bold">{detail.label}</DialogTitle>
              </DialogHeader>
              <p className="border border-border bg-muted/40 p-3 text-sm font-semibold break-all">{detail.value}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                  {t("cancel")}
                </Button>
                <Button size="sm" onClick={copyValue}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  {t("copyValue")}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
