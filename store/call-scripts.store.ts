"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoScripts, type CallScript } from "@/features/admin/calls";

export interface FlowStep {
  text: string;
  condition: string;
}

interface CallScriptsState {
  removed: string[];
  patches: Record<string, Partial<CallScript>>;
  flows: Record<string, FlowStep[]>;
  appended: CallScript[];
  patch: (id: string, patch: Partial<CallScript>) => void;
  remove: (ids: string[]) => void;
  setFlow: (id: string, steps: FlowStep[]) => void;
  append: (script: CallScript) => void;
}

export const useCallScriptsStore = create<CallScriptsState>()(
  persist(
    (set) => ({
      removed: [],
      patches: {},
      flows: {},
      appended: [],
      patch: (id, patch) =>
        set((s) => ({ patches: { ...s.patches, [id]: { ...s.patches[id], ...patch } } })),
      remove: (ids) => set((s) => ({ removed: [...new Set([...s.removed, ...ids])] })),
      setFlow: (id, steps) => set((s) => ({ flows: { ...s.flows, [id]: steps } })),
      append: (script) => set((s) => ({ appended: [script, ...s.appended] })),
    }),
    { name: "call-scripts" }
  )
);

export function useScripts(): CallScript[] {
  const removed = useCallScriptsStore((s) => s.removed);
  const patches = useCallScriptsStore((s) => s.patches);
  const appended = useCallScriptsStore((s) => s.appended);
  const seen = new Set<string>();
  return [...appended, ...demoScripts]
    .map((s) => ({ ...s, ...(patches[s.id] ?? {}) }))
    .filter((s) => {
      if (removed.includes(s.id) || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
}

export function stepsToFlow(steps: string[]): FlowStep[] {
  return steps.map((text) => ({ text, condition: "" }));
}
