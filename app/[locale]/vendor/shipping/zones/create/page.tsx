"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AccountingHero, heroPillClassName } from "@/components/admin/accounting/AccountingHero";
import { Field } from "@/components/admin/products/edit/sections";
import { zoneSchema } from "@/features/vendor/shipping";
import { useVendorStore } from "@/store/vendor.store";
import { ShipTabs } from "@/components/vendor/shipping-settings-shared";
import { toast } from "sonner";

const COUNTRIES = ["Bangladesh", "United States", "United Kingdom", "UAE", "India"];
const REGIONS: Record<string, string[]> = {
  Bangladesh: ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh"],
  "United States": ["California", "New York", "Texas"],
  India: ["West Bengal", "Delhi", "Maharashtra"],
  "United Kingdom": ["London", "Manchester"],
  UAE: ["Dubai", "Abu Dhabi"],
};

export default function VendorZoneCreatePage() {
  const t = useTranslations("Dashboard.Vendor");
  const router = useRouter();
  const store = useVendorStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [countries, setCountries] = useState<string[]>(["Bangladesh"]);
  const [regions, setRegions] = useState<string[]>(["Dhaka"]);
  const [cities, setCities] = useState("");
  const [postals, setPostals] = useState("");
  const [priority, setPriority] = useState(4);
  const [active, setActive] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const toggle = (list: string[], v: string, set: (x: string[]) => void) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const review = () => {
    const parsed = zoneSchema.safeParse({ name: name.trim(), description, priority });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid zone");
      return;
    }
    if (countries.length === 0) {
      setError(t("errRequired"));
      return;
    }
    setError("");
    setConfirm(true);
  };

  const create = () => {
    const id = `sz-${Date.now()}`;
    store.addShippingZone({
      id, name: name.trim(), description: description.trim(), countries, regions,
      cities: cities.split(",").map((s) => s.trim()).filter(Boolean),
      postals: postals.split(",").map((s) => s.trim()).filter(Boolean),
      priority, active, updated: "2026-09-26",
    });
    store.notifyVendor(`Shipping zone ${name} created.`, "info");
    setConfirm(false);
    toast.success(t("toastSaved"));
    router.push(`/vendor/shipping/zones/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <AccountingHero
        eyebrow={t("nav_shipping")} title={t("shCreateZone")} subtitle={t("shSubtitle")}
        highlightLabel={t("shZones")} highlightValue={name || "—"} highlightIcon={MapPin}
      >
        <Link href="/vendor/shipping/zones" className={heroPillClassName}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("shZones")}
        </Link>
      </AccountingHero>

      <ShipTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shZoneName")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4">
            <Field label={t("shZoneName")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dhaka Express" className="bg-card" maxLength={60} />
            </Field>
            <Field label={t("shZoneDesc")}>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-card" maxLength={200} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("shPriority")}>
                <Input type="number" min={1} max={100} value={priority} onChange={(e) => setPriority(Math.max(1, Number(e.target.value) || 1))} className="bg-card" />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} aria-label={t("tStatus")} />
                {t("seOn")}
              </label>
            </div>
            <Field label={t("shCity")}>
              <Input value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Dhaka, Gazipur" className="bg-card" />
            </Field>
            <Field label={t("shPostal")}>
              <Input value={postals} onChange={(e) => setPostals(e.target.value)} placeholder="1000–1299" className="bg-card" />
            </Field>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="font-heading text-base font-bold">{t("shLocations")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pb-4">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("shCountry")}</p>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => (
                <button
                  key={c} type="button" onClick={() => toggle(countries, c, setCountries)} aria-pressed={countries.includes(c)}
                  className={countries.includes(c) ? "border border-secondary bg-secondary px-3 py-1.5 text-xs font-bold text-white" : "border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-secondary"}
                >
                  {c}
                </button>
              ))}
            </div>
            {countries.map((c) => (
              <div key={c}>
                <p className="pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">{c} · {t("shDivision")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(REGIONS[c] ?? ["All Regions"]).map((r) => (
                    <button
                      key={r} type="button" onClick={() => toggle(regions, r, setRegions)} aria-pressed={regions.includes(r)}
                      className={regions.includes(r) ? "border border-secondary bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary" : "border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-secondary"}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Link href="/vendor/shipping/zones"><Button variant="outline" className="bg-card">{t("cancel")}</Button></Link>
        <Button onClick={review}>{t("shCreateZone")}</Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">{name} · #{priority}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{countries.join(", ")}{regions.length > 0 ? ` · ${regions.join(", ")}` : ""}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{t("cancel")}</Button>
            <Button size="sm" onClick={create}>{t("shCreateZone")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
