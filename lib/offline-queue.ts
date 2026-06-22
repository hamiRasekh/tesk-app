import {
  apiCompleteTask,
  apiCreateProject,
  apiCreateTask,
  apiPauseTimer,
  apiStartTimer,
  apiStopTimer,
  apiUpdateProfile,
  apiUpdateTask
} from "./api";

const QUEUE_KEY = "aveno-queue-v1";
const LEGACY_QUEUE_KEY = "void-spirit-queue-v1";

export type QueuedMutation =
  | { type: "create_task"; payload: Record<string, unknown>; localId: string }
  | { type: "update_task"; id: string; payload: Record<string, unknown> }
  | { type: "create_project"; payload: Record<string, unknown>; localId: string }
  | { type: "update_profile"; payload: Record<string, unknown> }
  | { type: "start_timer"; taskId: string }
  | { type: "pause_timer"; taskId: string }
  | { type: "stop_timer"; taskId: string }
  | { type: "complete_task"; taskId: string };

function migrateQueue() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(QUEUE_KEY)) return;
  const val = localStorage.getItem(LEGACY_QUEUE_KEY);
  if (val != null) {
    localStorage.setItem(QUEUE_KEY, val);
    localStorage.removeItem(LEGACY_QUEUE_KEY);
  }
}

function loadQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  migrateQueue();
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedMutation[];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueLength(): number {
  return loadQueue().length;
}

export function enqueueMutation(mutation: QueuedMutation) {
  const queue = loadQueue();
  queue.push(mutation);
  saveQueue(queue);
}

export function clearQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(LEGACY_QUEUE_KEY);
}

function resolveId(id: string, idMap: Map<string, string>): string {
  if (!id.startsWith("local-")) return id;
  return idMap.get(id) ?? id;
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = loadQueue();
  if (queue.length === 0) return 0;

  const idMap = new Map<string, string>();
  let flushed = 0;

  for (const item of queue) {
    switch (item.type) {
      case "create_task": {
        const created = (await apiCreateTask(item.payload)) as { id: string };
        idMap.set(item.localId, created.id);
        flushed++;
        break;
      }
      case "update_task": {
        const id = resolveId(item.id, idMap);
        if (!id.startsWith("local-")) {
          await apiUpdateTask(id, item.payload);
          flushed++;
        }
        break;
      }
      case "create_project": {
        const created = (await apiCreateProject(item.payload)) as { id: string };
        idMap.set(item.localId, created.id);
        flushed++;
        break;
      }
      case "update_profile":
        await apiUpdateProfile(item.payload);
        flushed++;
        break;
      case "start_timer": {
        const id = resolveId(item.taskId, idMap);
        if (!id.startsWith("local-")) {
          await apiStartTimer(id);
          flushed++;
        }
        break;
      }
      case "pause_timer": {
        const id = resolveId(item.taskId, idMap);
        if (!id.startsWith("local-")) {
          await apiPauseTimer(id);
          flushed++;
        }
        break;
      }
      case "stop_timer": {
        const id = resolveId(item.taskId, idMap);
        if (!id.startsWith("local-")) {
          await apiStopTimer(id);
          flushed++;
        }
        break;
      }
      case "complete_task": {
        const id = resolveId(item.taskId, idMap);
        if (!id.startsWith("local-")) {
          await apiCompleteTask(id);
          flushed++;
        }
        break;
      }
    }
  }

  clearQueue();
  return flushed;
}
