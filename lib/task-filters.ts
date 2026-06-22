import type { Task, TaskStatus } from "./void-types";
import { toLocalDateStr } from "./void-utils";

export function todayStr() {
  return toLocalDateStr(new Date());
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateStr(d);
}

export function isDueToday(task: Task) {
  return task.dueDate === todayStr();
}

export function isDueYesterday(task: Task) {
  return task.dueDate === yesterdayStr();
}

export function isOpen(task: Task) {
  return task.status !== "done";
}

export function isOverdue(task: Task) {
  return isOpen(task) && task.dueDate < todayStr();
}

export function isCompletedOnDate(task: Task, date: string) {
  if (task.status !== "done") return false;
  if (task.completedAt) return task.completedAt.slice(0, 10) === date;
  return task.dueDate === date;
}

export function completedAtDate(task: Task): string {
  if (task.completedAt) return task.completedAt.slice(0, 10);
  return task.dueDate;
}

export type TodayTaskGroups = {
  overdue: Task[];
  inProgress: Task[];
  pending: Task[];
  done: Task[];
};

export function groupTodayBoard(tasks: Task[], sort: (t: Task[]) => Task[]): TodayTaskGroups {
  const today = todayStr();
  const overdue = sort(tasks.filter((t) => isOverdue(t)));
  const todayOpen = tasks.filter((t) => isOpen(t) && t.dueDate === today);
  const inProgress = sort(todayOpen.filter((t) => t.status === "in_progress"));
  const pending = sort(todayOpen.filter((t) => t.status === "pending"));
  const done = sort(tasks.filter((t) => isCompletedOnDate(t, today)));
  return { overdue, inProgress, pending, done };
}

export function statusLabel(status: TaskStatus) {
  if (status === "in_progress") return "In progress";
  if (status === "done") return "Done";
  return "Not started";
}
