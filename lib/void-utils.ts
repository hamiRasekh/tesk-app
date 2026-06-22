import type { Priority, Task } from "./void-types";

export function hoursFromMinutes(m: number) {
  return `${Math.floor(m / 60)}h`;
}

export function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

export function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

/** Green (low) → red (high) for difficulty */
export function scaleHeatColor(value: number, min = 1, max = 10) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round(23 + (255 - 23) * t);
  const g = Math.round(222 + (107 - 222) * t);
  const b = Math.round(202 + (138 - 202) * t);
  const color = `rgb(${r}, ${g}, ${b})`;
  return {
    color,
    fill: `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.18), rgba(${r}, ${g}, ${b}, 0.38))`,
    thumb: `linear-gradient(145deg, rgba(${Math.min(r + 30, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 30, 255)}), rgb(${r}, ${g}, ${b}))`,
    glow: `0 0 12px rgba(${r}, ${g}, ${b}, 0.55)`,
    border: `rgba(${r}, ${g}, ${b}, 0.45)`
  };
}

/** Blue (low) → amber (high) for importance */
export function importanceHeatColor(value: number, min = 1, max = 10) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round(59 + (251 - 59) * t);
  const g = Math.round(130 + (191 - 130) * t);
  const b = Math.round(246 + (36 - 246) * t);
  return { color: `rgb(${r}, ${g}, ${b})` };
}

export function getExpirationLabel(dueDate: string) {
  const due = new Date(dueDate + "T23:59:59");
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return "OVERDUE";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}H REMAINING`;
  const days = Math.ceil(hours / 24);
  return `${days}D REMAINING`;
}

export function priorityLabel(p: Priority) {
  if (p === "critical") return "! CRITICAL";
  return p.toUpperCase();
}

export function projectLevelFromTasks(tasks: Task[]) {
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.min(99, 8 + done * 2);
}

export function importanceToPriority(importance: number): Priority {
  if (importance >= 9) return "critical";
  if (importance >= 7) return "high";
  if (importance >= 4) return "medium";
  return "low";
}

export function xpForTask(priority: Priority) {
  const map = { critical: 120, high: 80, medium: 50, low: 30 };
  return map[priority];
}
