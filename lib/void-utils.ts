import type { Priority, Task } from "./void-types";

export function hoursFromMinutes(m: number) {
  return `${Math.floor(m / 60)}h`;
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

export function xpForTask(priority: Priority) {
  const map = { critical: 120, high: 80, medium: 50, low: 30 };
  return map[priority];
}
