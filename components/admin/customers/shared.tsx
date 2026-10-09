"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { initials, type BlockInfo, type CustomerStatus } from "@/features/admin/customer-mgmt";

const STATUS_CLASS: Record<CustomerStatus, string> = {
  active: "bg-green-600/10 text-green-700",
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
  pending: "bg-primary/20 text-[#8a5a00]",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const t = useTranslations("Dashboard.customers");
  return (
    <Badge className={cn("font-semibold whitespace-nowrap", STATUS_CLASS[status])}>
      <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", status === "active" ? "bg-green-600" : status === "blocked" ? "bg-destructive" : status === "pending" ? "bg-[#8a5a00]" : "bg-muted-foreground")} />
      {t(status)}
    </Badge>
  );
}

export function CustomerAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "size-14 text-xl" : size === "sm" ? "size-7 text-xs" : "size-9 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-secondary font-bold text-white ${cls}`}
    >
      {initials(name)}
    </span>
  );
}

export function BlockCustomerDialog({
  open,
  customerName,
  mode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  customerName: string;
  mode: "block" | "unblock";
  onClose: () => void;
  onConfirm: (info?: BlockInfo) => void;
}) {
  const t = useTranslations("Dashboard.customers");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const confirm = () => {
    if (mode === "block") {
      onConfirm({ reason: reason.trim() || "Policy violation", note: note.trim(), date: "2026-09-26" });
      toast.success(t("toastBlocked"));
    } else {
      onConfirm();
      toast.success(t("toastUnblocked"));
    }
    setReason("");
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-base font-bold">
            {mode === "block" ? (
              <Ban className="size-4 text-destructive" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            )}
            {mode === "block" ? t("blockTitle") : t("unblockTitle")} · {customerName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {mode === "block" ? t("blockDesc") : t("unblockDesc")}
        </p>
        {mode === "block" ? (
          <div className="flex flex-col gap-4">
            <Field label={t("blockReason")}>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="bg-card" placeholder="Suspicious activity" />
            </Field>
            <Field label={t("blockNote")}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} className="bg-card" />
            </Field>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("cancelBtn")}
          </Button>
          <Button size="sm" variant={mode === "block" ? "destructive" : "default"} onClick={confirm}>
            {mode === "block" ? t("blockBtn") : t("unblockBtn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
