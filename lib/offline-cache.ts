import type { AppState, CalendarDayData } from "./void-types";

const STATE_KEY = "aveno-cache-v1";
const CALENDAR_PREFIX = "aveno-cal-";
const PROJECT_ANALYTICS_PREFIX = "aveno-proj-analytics-";

const LEGACY = {
  state: "void-spirit-cache-v1",
  cal: "void-spirit-cal-",
  proj: "void-spirit-proj-analytics-"
};

function migrateKey(newKey: string, legacyKey: string) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(newKey)) return;
  const val = localStorage.getItem(legacyKey);
  if (val != null) {
    localStorage.setItem(newKey, val);
    localStorage.removeItem(legacyKey);
  }
}

function migratePrefix(newPrefix: string, legacyPrefix: string) {
  if (typeof window === "undefined") return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(legacyPrefix)) continue;
    const suffix = key.slice(legacyPrefix.length);
    const newKey = newPrefix + suffix;
    if (!localStorage.getItem(newKey)) {
      const val = localStorage.getItem(key);
      if (val != null) localStorage.setItem(newKey, val);
    }
    localStorage.removeItem(key);
  }
}

function runMigrations() {
  migrateKey(STATE_KEY, LEGACY.state);
  migratePrefix(CALENDAR_PREFIX, LEGACY.cal);
  migratePrefix(PROJECT_ANALYTICS_PREFIX, LEGACY.proj);
}

export function loadCachedState(): AppState | null {
  if (typeof window === "undefined") return null;
  runMigrations();
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveCachedState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage full — ignore
  }
}

export function clearCachedState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(LEGACY.state);
}

export function loadCachedCalendarDay(date: string): CalendarDayData | null {
  if (typeof window === "undefined") return null;
  runMigrations();
  try {
    const raw = localStorage.getItem(CALENDAR_PREFIX + date);
    if (!raw) return null;
    return JSON.parse(raw) as CalendarDayData;
  } catch {
    return null;
  }
}

export function saveCachedCalendarDay(date: string, data: CalendarDayData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CALENDAR_PREFIX + date, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadCachedProjectAnalytics(projectId: string, cacheKey: string) {
  if (typeof window === "undefined") return null;
  runMigrations();
  try {
    const raw = localStorage.getItem(PROJECT_ANALYTICS_PREFIX + projectId + "-" + cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedProjectAnalytics(projectId: string, cacheKey: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECT_ANALYTICS_PREFIX + projectId + "-" + cacheKey, JSON.stringify(data));
  } catch {
    // ignore
  }
}
