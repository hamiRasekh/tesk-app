import type { Task } from "./void-types";
import { completedAtDate } from "./task-filters";
import { toLocalDateStr } from "./void-utils";

export type CompletedPeriod = "week" | "month" | "quarter" | "year" | "all";

export type CompletedFilter = {
  period: CompletedPeriod;
  projectId: string | null;
};

function periodStart(period: CompletedPeriod): string | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "week") d.setDate(d.getDate() - 6);
  else if (period === "month") d.setDate(d.getDate() - 29);
  else if (period === "quarter") d.setDate(d.getDate() - 89);
  else if (period === "year") d.setDate(d.getDate() - 364);
  return toLocalDateStr(d);
}

export function filterCompletedTasks(tasks: Task[], filter: CompletedFilter): Task[] {
  const from = periodStart(filter.period);
  return tasks
    .filter((t) => t.status === "done")
    .filter((t) => {
      const d = completedAtDate(t);
      if (from && d < from) return false;
      if (filter.projectId && t.projectId !== filter.projectId) return false;
      return true;
    })
    .sort((a, b) => completedAtDate(b).localeCompare(completedAtDate(a)));
}

export function completionsByDay(tasks: Task[]) {
  const map: Record<string, number> = {};
  tasks.forEach((t) => {
    const d = completedAtDate(t);
    map[d] = (map[d] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function focusMinutesByDay(tasks: Task[]) {
  const map: Record<string, number> = {};
  tasks.forEach((t) => {
    const d = completedAtDate(t);
    map[d] = (map[d] ?? 0) + t.loggedMinutes;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));
}

export function estimationAccuracy(tasks: Task[]) {
  const withEstimate = tasks.filter((t) => t.estimatedMinutes > 0);
  if (withEstimate.length === 0) return { ratio: 1, label: "No data", count: 0 };
  const ratios = withEstimate.map((t) => t.loggedMinutes / t.estimatedMinutes);
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  let label = "On target";
  if (avg < 0.85) label = "Faster than planned";
  else if (avg > 1.15) label = "Took longer than planned";
  return { ratio: avg, label, count: withEstimate.length };
}

export function priorityBreakdown(tasks: Task[]) {
  const map: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  tasks.forEach((t) => {
    map[t.priority] = (map[t.priority] ?? 0) + 1;
  });
  return Object.entries(map)
    .filter(([, c]) => c > 0)
    .map(([priority, count]) => ({ priority, count }));
}

export function projectBreakdown(tasks: Task[], projectNames: Map<string, string>) {
  const map: Record<string, number> = {};
  tasks.forEach((t) => {
    const key = t.projectId ?? "_none";
    map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map).map(([id, count]) => ({
    projectId: id === "_none" ? null : id,
    name: id === "_none" ? "No project" : projectNames.get(id) ?? "Project",
    count
  }));
}
