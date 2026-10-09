"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoRecordings, type Recording } from "@/features/admin/calls";

interface CallRecordingsState {
  removed: string[];
  patches: Record<string, Partial<Recording>>;
  appended: Recording[];
  patch: (id: string, patch: Partial<Recording>) => void;
  remove: (ids: string[]) => void;
  append: (items: Recording[]) => void;
}

export const useCallRecordingsStore = create<CallRecordingsState>()(
  persist(
    (set) => ({
      removed: [],
      patches: {},
      appended: [],
      patch: (id, patch) =>
        set((s) => ({ patches: { ...s.patches, [id]: { ...s.patches[id], ...patch } } })),
      remove: (ids) => set((s) => ({ removed: [...new Set([...s.removed, ...ids])] })),
      append: (items) => set((s) => ({ appended: [...items, ...s.appended] })),
    }),
    { name: "call-recordings" }
  )
);

export function useRecordings(): Recording[] {
  const removed = useCallRecordingsStore((s) => s.removed);
  const patches = useCallRecordingsStore((s) => s.patches);
  const appended = useCallRecordingsStore((s) => s.appended);
  const seen = new Set<string>();
  return [...appended, ...demoRecordings]
    .map((r) => ({ ...r, ...(patches[r.id] ?? {}) }))
    .filter((r) => {
      if (removed.includes(r.id) || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
}
