import type { AppState, CalendarDayData, ProjectAnalytics } from "./void-types";

const TOKEN_KEY = "aveno-token";
const LEGACY_STORAGE_KEY = "void-spirit-app-v2";
const LEGACY_TOKEN_KEY = "void-spirit-token";

function migrateStorageKey(newKey: string, legacyKeys: string[]) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(newKey)) return;
  for (const old of legacyKeys) {
    const val = localStorage.getItem(old);
    if (val != null) {
      localStorage.setItem(newKey, val);
      localStorage.removeItem(old);
      return;
    }
  }
}

export function migrateLegacyBrandingStorage() {
  migrateStorageKey(TOKEN_KEY, [LEGACY_TOKEN_KEY]);
}

export class OfflineError extends Error {
  constructor(message = "You are offline") {
    super(message);
    this.name = "OfflineError";
  }
}

export class AuthError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "AuthError";
  }
}

export function isAppOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function isOfflineError(err: unknown): boolean {
  if (err instanceof OfflineError) return true;
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return (
      !isAppOnline() ||
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed")
    );
  }
  return false;
}

/** Same-origin proxy — works on mobile PWA (no localhost:8000 on phone) */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api-proxy`;
  }
  return process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyBrandingStorage();
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  purgeLegacyDemoStorage();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const DEMO_PROJECT_NAMES = new Set([
  "System Architecture",
  "Nexus Protocol",
  "Void Core",
  "Aveno Core"
]);

export function purgeLegacyDemoStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  try {
    const raw = localStorage.getItem("aveno-cache-v1");
    if (raw) {
      const parsed = JSON.parse(raw) as {
        profile?: { email?: string; level?: number };
        projects?: { name?: string }[];
      };
      const hasDemoProfile =
        parsed.profile?.email === "demo@aveno.app" || (parsed.profile?.level ?? 0) >= 40;
      const hasDemoProjects = (parsed.projects ?? []).some((p) => DEMO_PROJECT_NAMES.has(p.name ?? ""));
      if (hasDemoProfile || hasDemoProjects) {
        localStorage.removeItem("aveno-cache-v1");
      }
    }
  } catch {
    /* ignore */
  }
}

function parseErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item))).join(", ");
  }
  return "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isAppOnline()) {
    throw new OfflineError();
  }

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...options, headers, cache: "no-store" });
  } catch {
    throw new OfflineError();
  }

  if (!res.ok) {
    if (res.status === 401) throw new AuthError();
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    if (res.status === 503 && err.detail === "offline") throw new OfflineError();
    if (!isAppOnline() || res.status === 503) throw new OfflineError();
    throw new Error(parseErrorDetail(err.detail ?? res.statusText));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string) {
  return request<{ access_token: string; expires_in: number; user: Record<string, unknown> }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function apiSignup(body: Record<string, unknown>) {
  return request<{ access_token: string; expires_in: number; user: Record<string, unknown> }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

/** Renew JWT while current token is valid (extends 1-year session). */
export async function apiRefreshToken() {
  return request<{ access_token: string; expires_in: number; user: Record<string, unknown> }>("/auth/refresh", {
    method: "POST"
  });
}

export async function apiGetState(): Promise<AppState> {
  return request<AppState>("/api/state");
}

export async function apiCreateTask(body: Record<string, unknown>) {
  return request("/api/tasks", { method: "POST", body: JSON.stringify(body) });
}

export async function apiUpdateTask(id: string, body: Record<string, unknown>) {
  return request(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiCreateProject(body: Record<string, unknown>) {
  return request("/api/projects", { method: "POST", body: JSON.stringify(body) });
}

export async function apiUpdateProfile(body: Record<string, unknown>) {
  return request("/api/profile", { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiPauseTimer(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/timer/pause`, { method: "POST" });
}

export async function apiStartTimer(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/timer/start`, { method: "POST" });
}

export async function apiStopTimer(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/timer/stop`, { method: "POST" });
}

export async function apiCompleteTask(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/complete`, { method: "POST" });
}

export async function apiGetCalendarDay(date: string): Promise<CalendarDayData> {
  return request<CalendarDayData>(`/api/calendar/day/${date}`);
}

export async function apiGetProjectAnalytics(
  projectId: string,
  params: { period?: string; from?: string; to?: string } = {}
): Promise<ProjectAnalytics> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const query = qs.toString();
  return request<ProjectAnalytics>(`/api/projects/${projectId}/analytics${query ? `?${query}` : ""}`);
}
