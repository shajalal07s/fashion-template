/** Demo data layer for the Auto Call System (deterministic, SSR-safe). */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Arif", "Nusrat", "Tanvir", "Mim", "Rakib", "Sadia", "Fahim", "Priya", "Hasan", "Tania", "Sabbir", "Rina", "Mahmud", "Lima", "Shakil", "Dipa"];
const LAST = ["Hossain", "Akter", "Rahman", "Begum", "Khan", "Islam", "Chowdhury", "Ahmed"];
const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];
export const CALL_AGENTS = ["Rahim Uddin", "Nabila Akter", "Karim Sheikh", "Sumi Begum"];
const AGENTS = CALL_AGENTS;

export type QueueStatus = "waiting" | "calling" | "done";
export type Priority = "high" | "normal" | "low";

export interface CallQueueItem {
  id: string;
  customer: string;
  phone: string;
  city: string;
  agent: string;
  priority: Priority;
  attempts: number;
  scheduledAt: string;
  status: QueueStatus;
}

export type CallDirection = "inbound" | "outbound";
export type CallOutcome = "completed" | "missed" | "failed";

export interface CallLog {
  id: string;
  customer: string;
  phone: string;
  direction: CallDirection;
  agent: string;
  startedAt: string;
  durationSec: number;
  outcome: CallOutcome;
}

export interface Recording {
  id: string;
  callId: string;
  customer: string;
  agent: string;
  date: string;
  durationSec: number;
  sizeMb: number;
}

export interface CallScript {
  id: string;
  name: string;
  steps: string[];
  calls: number;
  successRate: number;
  active: boolean;
  updatedAt: string;
}

export interface CallSettings {
  enabled: boolean;
  concurrentCalls: number;
  retryAttempts: number;
  workStart: string;
  workEnd: string;
  callerId: string;
  recordCalls: boolean;
}

export const DEFAULT_CALL_SETTINGS: CallSettings = {
  enabled: true,
  concurrentCalls: 3,
  retryAttempts: 2,
  workStart: "09:00",
  workEnd: "21:00",
  callerId: "+8801700000000",
  recordCalls: true,
};

const rand = mulberry32(20260930);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const phone = () => `01${Math.floor(300000000 + rand() * 699999999)}`;
const person = () => `${pick(FIRST)} ${pick(LAST)}`;

function buildQueue(now = new Date()): CallQueueItem[] {
  const items: CallQueueItem[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(now.getTime() - Math.floor(rand() * 72) * 3600 * 1000);
    items.push({
      id: `Q-${3100 + i}`,
      customer: person(),
      phone: phone(),
      city: pick(CITIES),
      agent: pick(AGENTS),
      priority: pick(["high", "normal", "normal", "normal", "low"] as Priority[]),
      attempts: Math.floor(rand() * 3),
      scheduledAt: d.toISOString(),
      status: pick(["waiting", "waiting", "waiting", "calling", "done"] as QueueStatus[]),
    });
  }
  return items.sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));
}

function buildLogs(now = new Date()): CallLog[] {
  const logs: CallLog[] = [];
  for (let i = 0; i < 120; i++) {
    const d = new Date(now.getTime() - Math.floor(rand() * 30 * 24) * 3600 * 1000);
    const outcome = pick(["completed", "completed", "completed", "missed", "failed"] as CallOutcome[]);
    logs.push({
      id: `C-${5200 + i}`,
      customer: person(),
      phone: phone(),
      direction: pick(["inbound", "outbound", "outbound"] as CallDirection[]),
      agent: pick(AGENTS),
      startedAt: d.toISOString(),
      durationSec: outcome === "completed" ? 30 + Math.floor(rand() * 420) : Math.floor(rand() * 25),
      outcome,
    });
  }
  return logs.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
}

function buildRecordings(logs: CallLog[]): Recording[] {
  return logs
    .filter((l) => l.outcome === "completed")
    .slice(0, 30)
    .map((l, i) => ({
      id: `R-${8100 + i}`,
      callId: l.id,
      customer: l.customer,
      agent: l.agent,
      date: l.startedAt,
      durationSec: l.durationSec,
      sizeMb: Math.round(((l.durationSec * 16) / 1024) * 10) / 10,
    }));
}

function buildScripts(): CallScript[] {
  const now = new Date().toISOString();
  return [
    {
      id: "SC-1",
      name: "Order Confirmation",
      steps: ["Greet customer by name", "Confirm order ID and items", "Confirm delivery address", "Mention delivery time", "Close with thanks"],
      calls: 1840,
      successRate: 92,
      active: true,
      updatedAt: now,
    },
    {
      id: "SC-2",
      name: "Delivery Follow-up",
      steps: ["Greet customer", "Ask if parcel arrived", "Collect rating 1-5", "Note any complaint", "Close politely"],
      calls: 1215,
      successRate: 87,
      active: true,
      updatedAt: now,
    },
    {
      id: "SC-3",
      name: "Payment Reminder",
      steps: ["Verify customer identity", "State due amount", "Offer bKash/Nagad/card options", "Confirm payment time", "Send SMS receipt"],
      calls: 640,
      successRate: 74,
      active: true,
      updatedAt: now,
    },
    {
      id: "SC-4",
      name: "Abandoned Cart Win-back",
      steps: ["Greet warmly", "Mention cart items", "Offer 10% coupon", "Confirm order placement", "Thank customer"],
      calls: 388,
      successRate: 61,
      active: false,
      updatedAt: now,
    },
    {
      id: "SC-5",
      name: "Eid Campaign Promo",
      steps: ["Festival greeting", "Present Eid collection", "Share discount code", "Collect interest level", "Schedule callback"],
      calls: 512,
      successRate: 68,
      active: false,
      updatedAt: now,
    },
  ];
}

export const demoQueue: CallQueueItem[] = buildQueue();
export const demoLogs: CallLog[] = buildLogs();
export const demoRecordings: Recording[] = buildRecordings(demoLogs);
export const demoScripts: CallScript[] = buildScripts();

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SETTINGS_KEY = "auto-call-settings";

export function loadCallSettings(): CallSettings {
  if (typeof window === "undefined") return DEFAULT_CALL_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_CALL_SETTINGS;
    return { ...DEFAULT_CALL_SETTINGS, ...(JSON.parse(raw) as Partial<CallSettings>) };
  } catch {
    return DEFAULT_CALL_SETTINGS;
  }
}

export function saveCallSettings(settings: CallSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}
