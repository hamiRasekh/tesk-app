import type { AppState } from "./void-types";

export function getTimerElapsedSeconds(state: AppState, now = Date.now()): number {
  if (!state.activeTimerTaskId) return 0;
  const base = state.timerAccumulatedSeconds ?? 0;
  if (!state.timerStartedAt) return base;
  return base + Math.floor((now - state.timerStartedAt) / 1000);
}

export function isTimerPaused(state: AppState): boolean {
  return !!state.activeTimerTaskId && !state.timerStartedAt;
}

export function isTimerRunning(state: AppState): boolean {
  return !!state.activeTimerTaskId && !!state.timerStartedAt;
}

export function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function timerProgress(elapsedSeconds: number, estimatedMinutes: number): number {
  if (!estimatedMinutes || estimatedMinutes <= 0) return 0;
  return Math.min(1, elapsedSeconds / (estimatedMinutes * 60));
}
