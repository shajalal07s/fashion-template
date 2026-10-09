"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  GitBranch,
  Pencil,
  PhoneCall,
  Trash2,
  Trophy,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Field, SectionCard } from "@/components/admin/products/edit/sections";
import { cn } from "@/lib/utils";
import {
  stepsToFlow,
  useCallScriptsStore,
  useScripts,
  type FlowStep,
} from "@/store/call-scripts.store";
import { toast } from "sonner";

export default function ScriptDetailsPage() {
  const t = useTranslations("Dashboard.calls");
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const scripts = useScripts();
  const patchScript = useCallScriptsStore((s) => s.patch);
  const removeScripts = useCallScriptsStore((s) => s.remove);
  const flows = useCallScriptsStore((s) => s.flows);
  const setFlow = useCallScriptsStore((s) => s.setFlow);
  const appendScript = useCallScriptsStore((s) => s.append);

  const script = useMemo(() => scripts.find((s) => s.id === id), [scripts, id]);
  const flow: FlowStep[] = useMemo(
    () => flows[id] ?? stepsToFlow(script?.steps ?? []),
    [flows, id, script]
  );

  const [newStep, setNewStep] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editCondition, setEditCondition] = useState("");

  if (!script) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t("scriptsTitle")} />
        <Card className="border-border bg-card">
          <CardContent className="py-8">
            <EmptyState icon={Eye} title={t("emptyTitle")} description={t("emptyDescription")} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const persist = (steps: FlowStep[]) => {
    setFlow(id, steps);
    patchScript(id, { steps: steps.map((s) => s.text) });
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    persist([...flow, { text: newStep.trim(), condition: newCondition.trim() }]);
    setNewStep("");
    setNewCondition("");
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(flow[idx].text);
    setEditCondition(flow[idx].condition);
  };

  const saveStep = () => {
    if (editingIdx === null || !editText.trim()) return;
    persist(
      flow.map((s, i) =>
        i === editingIdx ? { text: editText.trim(), condition: editCondition.trim() } : s
      )
    );
    setEditingIdx(null);
  };

  const removeStep = (idx: number) => {
    persist(flow.filter((_, i) => i !== idx));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= flow.length) return;
    const next = [...flow];
    [next[idx], next[to]] = [next[to], next[idx]];
    persist(next);
  };

  const toggleActive = () => {
    patchScript(id, { active: !script.active });
  };

  const duplicate = () => {
    const newId = `SC-${Date.now().toString().slice(-5)}`;
    appendScript({
      ...script,
      id: newId,
      name: `${script.name} (Copy)`,
      active: false,
      calls: 0,
      successRate: 0,
      updatedAt: new Date().toISOString(),
    });
    setFlow(
      newId,
      flow.map((s) => ({ ...s }))
    );
    toast.success(t("toastDuplicated"));
    router.push(`/dashboard/calls/scripts/${newId}`);
  };

  const remove = () => {
    removeScripts([id]);
    toast.success(t("toastDeleted", { count: 1 }));
    router.push("/dashboard/calls/scripts");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`${t("scriptsTitle")} · ${script.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/calls/scripts">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                {t("back")}
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="gap-1.5 bg-card" onClick={duplicate}>
              <Copy className="size-3.5" aria-hidden="true" />
              {t("duplicateScript")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-card text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("bulkDelete")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={toggleActive}>
              {script.active ? t("inactive") : t("active")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("tableCalls")}
          value={script.calls.toLocaleString()}
          delta={0}
          icon={PhoneCall}
        />
        <StatCard
          label={t("tableSuccess")}
          value={`${script.successRate}%`}
          delta={0}
          icon={Trophy}
          iconClassName="bg-secondary/15 text-secondary"
        />
        <StatCard
          label={t("tableStatus")}
          value={script.active ? t("active") : t("inactive")}
          delta={0}
          icon={GitBranch}
          iconClassName={cn(
            script.active ? "bg-green-600/10 text-green-700" : "bg-muted text-muted-foreground"
          )}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_320px]">
        <SectionCard
          title={`${t("scriptSteps")} (${flow.length})`}
          action={
            <Badge variant="outline" className="font-bold">
              {script.steps.length}
            </Badge>
          }
        >
          <ol className="flex flex-col gap-2">
            {flow.map((step, i) => (
              <li
                key={`${i}-${step.text}`}
                className="flex items-start gap-3 border border-border bg-card px-3 py-2.5"
              >
                <span className="font-heading flex size-7 shrink-0 items-center justify-center bg-secondary/15 text-sm font-bold text-secondary">
                  {i + 1}
                </span>
                {editingIdx === i ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-card text-sm"
                    />
                    <Input
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value)}
                      placeholder={t("stepCondition")}
                      className="bg-card font-mono text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-8" onClick={saveStep}>
                        {t("settings.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditingIdx(null)}
                      >
                        {t("cancelBtn")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm">{step.text}</span>
                    {step.condition ? (
                      <span className="w-fit bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#8a5a00]">
                        IF: {step.condition}
                      </span>
                    ) : null}
                  </div>
                )}
                {editingIdx === i ? null : (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      disabled={i === flow.length - 1}
                      aria-label="Move down"
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      aria-label={`${t("editTitle")} ${i + 1}`}
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      aria-label={`${t("bulkDelete")} ${i + 1}`}
                      className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              placeholder={t("stepPlaceholder")}
              className="bg-card text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStep();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder={t("stepCondition")}
                className="bg-card font-mono text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStep();
                  }
                }}
              />
              <Button size="sm" className="h-8 shrink-0" onClick={addStep}>
                {t("addStep")}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("tableStatus")}>
          <div className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">
                {script.active ? t("active") : t("inactive")}
              </p>
              <p className="text-xs text-muted-foreground">{script.name}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={script.active}
              onClick={toggleActive}
              className={cn(
                "relative h-6 w-11 shrink-0 border transition-colors",
                script.active ? "border-secondary bg-secondary" : "border-border bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 bg-white shadow transition-all",
                  script.active ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
          <Field label={t("tableScript")}>
            <p className="font-mono text-xs font-bold">{script.id}</p>
          </Field>
          <Field label={t("tableUpdated")}>
            <p className="text-sm">{script.updatedAt.slice(0, 10)}</p>
          </Field>
        </SectionCard>
      </div>
    </div>
  );
}
