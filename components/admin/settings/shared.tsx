"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function SettingToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-border bg-card px-4 py-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-label={label} />
    </label>
  );
}

export function SaveBar({ onSave, onReset }: { onSave: () => void; onReset?: () => void }) {
  const t = useTranslations("Dashboard.settings");
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onReset ? (
        <Button variant="outline" className="bg-card" onClick={onReset}>
          {t("resetBtn")}
        </Button>
      ) : null}
      <Button onClick={onSave}>{t("saveBtn")}</Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Dashboard.settings");
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-bold">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("cancelBtn")}
          </Button>
          <Button size="sm" variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface SearchEntry {
  label: string;
  category: string;
  description: string;
  href: string;
  value: string;
}

export function SettingsSearch({ index }: { index: SearchEntry[] }) {
  const t = useTranslations("Dashboard.settings");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? index.filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];
  return (
    <div className="relative w-full sm:max-w-md">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="bg-card pl-9"
        aria-label={t("searchPlaceholder")}
      />
      {q ? (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 border border-border bg-card shadow-lg">
          {results.length > 0 ? (
            results.map((r) => (
              <a
                key={`${r.category}-${r.label}`}
                href={r.href}
                className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-muted"
                onClick={() => setQuery("")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.category} · {r.description}</span>
                </span>
                <span className="shrink-0 font-mono text-xs font-bold text-secondary">{r.value}</span>
              </a>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t("emptyTitle")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function savedToast(message: string): void {
  toast.success(message);
}
