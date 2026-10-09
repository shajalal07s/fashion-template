"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoQueue, type CallQueueItem } from "@/features/admin/calls";

interface CallQueueState {
  removed: string[];
  patches: Record<string, Partial<CallQueueItem>>;
  appended: CallQueueItem[];
  patch: (id: string, patch: Partial<CallQueueItem>) => void;
  remove: (ids: string[]) => void;
  append: (items: CallQueueItem[]) => void;
}

export const useCallQueueStore = create<CallQueueState>()(
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
    { name: "call-queue" }
  )
);

export function useQueueItems(): CallQueueItem[] {
  const removed = useCallQueueStore((s) => s.removed);
  const patches = useCallQueueStore((s) => s.patches);
  const appended = useCallQueueStore((s) => s.appended);
  const seen = new Set<string>();
  return [...appended, ...demoQueue]
    .map((q) => ({ ...q, ...(patches[q.id] ?? {}) }))
    .filter((q) => {
      if (removed.includes(q.id) || seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
}
