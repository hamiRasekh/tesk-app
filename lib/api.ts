import type { AppState } from "./void-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "void-spirit-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string) {
  return request<{ access_token: string; user: Record<string, unknown> }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function apiSignup(body: Record<string, unknown>) {
  return request<{ access_token: string; user: Record<string, unknown> }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body)
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

export async function apiStartTimer(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/timer/start`, { method: "POST" });
}

export async function apiStopTimer(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/timer/stop`, { method: "POST" });
}

export async function apiCompleteTask(taskId: string): Promise<AppState> {
  return request<AppState>(`/api/tasks/${taskId}/complete`, { method: "POST" });
}
