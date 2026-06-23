"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  apiCompleteTask,
  apiCreateProject,
  apiCreateTask,
  apiGetState,
  apiPauseTimer,
  apiRefreshToken,
  apiStartTimer,
  apiStopTimer,
  apiUpdateProfile,
  apiUpdateTask,
  AuthError,
  clearToken,
  getToken,
  isAppOnline,
  isOfflineError,
  migrateLegacyBrandingStorage,
  purgeLegacyDemoStorage,
  setToken
} from "./api";
import { clearCachedState, loadCachedState, saveCachedState } from "./offline-cache";
import { enqueueMutation, flushOfflineQueue, getQueueLength } from "./offline-queue";
import { emptyState } from "./void-data";
import { applyXp, xpForFocusMinutes, xpForTaskCompletion } from "./xp";
import { projectLevelFromTasks, randomId } from "./void-utils";
import { useVoidNotice } from "./void-notice";
import { useLocale } from "./locale";
import { offlineMsg } from "./offline-messages";
import type { AppState, Priority, Project, Task, TaskStatus, UserProfile } from "./void-types";

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    timerAccumulatedSeconds: state.timerAccumulatedSeconds ?? 0,
    tasks: state.tasks.map((t) => ({
      ...t,
      difficulty: t.difficulty ?? 5,
      importance: t.importance ?? 5,
      completedAt: t.completedAt ?? null
    }))
  };
}

function localId() {
  return `local-${randomId()}`;
}

type VoidContextValue = {
  state: AppState;
  loading: boolean;
  synced: boolean;
  online: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt" | "loggedMinutes" | "status" | "completedAt"> & { status?: TaskStatus }) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt" | "level"> & { level?: number }) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  refreshState: () => Promise<void>;
};

const VoidContext = createContext<VoidContextValue | null>(null);

export function VoidProvider({ children }: { children: ReactNode }) {
  const { notify, online, setPendingSync } = useVoidNotice();
  const { isFa } = useLocale();
  const msgs = offlineMsg(isFa ? "fa" : "en");
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return emptyState;
    return normalizeState(loadCachedState() ?? emptyState);
  });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const syncingRef = useRef(false);

  const persist = useCallback((updater: AppState | ((prev: AppState) => AppState)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const normalized = normalizeState(next);
      saveCachedState(normalized);
      return normalized;
    });
  }, []);

  const refreshState = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    if (!isAppOnline()) {
      notify(msgs.showingCache, "offline");
      return;
    }
    try {
      const refreshed = await apiRefreshToken();
      setToken(refreshed.access_token);
    } catch (err) {
      if (err instanceof AuthError) throw err;
      if (isOfflineError(err)) {
        notify(msgs.showingCache, "offline");
        return;
      }
    }
    const remote = await apiGetState();
    persist(remote);
  }, [notify, persist, msgs.showingCache]);

  const syncFromServer = useCallback(async () => {
    if (syncingRef.current || !getToken() || !isAppOnline()) return;
    syncingRef.current = true;
    try {
      const pending = getQueueLength();
      if (pending > 0) {
        await flushOfflineQueue();
        setPendingSync(0);
      }
      await refreshState();
      notify(msgs.backOnline, "success");
    } catch (err) {
      if (!isOfflineError(err)) {
        notify(msgs.syncFailed, "error");
      }
    } finally {
      syncingRef.current = false;
    }
  }, [notify, refreshState, setPendingSync, msgs.backOnline, msgs.syncFailed]);

  useEffect(() => {
    purgeLegacyDemoStorage();
    migrateLegacyBrandingStorage();
    setPendingSync(getQueueLength());

    async function init() {
      const token = getToken();
      const cached = loadCachedState();
      setHasToken(Boolean(token));

      if (cached) {
        setState(normalizeState(cached));
        setReady(true);
        setLoading(false);
      }

      if (!token) {
        setState(emptyState);
        setReady(true);
        setLoading(false);
        return;
      }

      if (!isAppOnline()) {
        if (cached) {
          notify(msgs.showingCache, "offline");
        } else {
          notify(msgs.noCache, "offline");
        }
        setReady(true);
        setLoading(false);
        return;
      }

      try {
        const pending = getQueueLength();
        if (pending > 0) {
          await flushOfflineQueue();
          setPendingSync(0);
        }
        const refreshed = await apiRefreshToken();
        setToken(refreshed.access_token);
        const remote = await apiGetState();
        persist(remote);
      } catch (err) {
        if (err instanceof AuthError) {
          clearToken();
          clearCachedState();
          setHasToken(false);
          setState(emptyState);
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (isOfflineError(err) || cached) {
          notify(cached ? msgs.serverUnreachable : msgs.noCache, "offline");
        } else {
          notify(msgs.connectionLost, "error");
        }
      } finally {
        setReady(true);
        setLoading(false);
      }
    }

    void init();
  }, [notify, persist, setPendingSync, msgs.showingCache, msgs.noCache, msgs.serverUnreachable, msgs.connectionLost]);

  useEffect(() => {
    function onOnline() {
      void syncFromServer();
    }
    function onFocus() {
      if (!getToken() || !isAppOnline()) return;
      void refreshState().catch((err) => {
        if (!isOfflineError(err) && !(err instanceof AuthError)) return;
      });
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshState, syncFromServer]);

  const runOrQueue = useCallback(
    async (
      onlineAction: () => Promise<void>,
      offlineAction: () => void,
      queueItem: Parameters<typeof enqueueMutation>[0],
      offlineMessage: string
    ) => {
      if (!isAppOnline()) {
        offlineAction();
        enqueueMutation(queueItem);
        setPendingSync(getQueueLength());
        notify(offlineMessage, "offline");
        return;
      }
      try {
        await onlineAction();
      } catch (err) {
        if (isOfflineError(err)) {
          offlineAction();
          enqueueMutation(queueItem);
          setPendingSync(getQueueLength());
          notify(offlineMessage, "offline");
          return;
        }
        notify(err instanceof Error ? err.message : "Something went wrong.", "error");
        throw err;
      }
    },
    [notify, setPendingSync]
  );

  const addTask = useCallback<VoidContextValue["addTask"]>(
    async (task) => {
      const body = {
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        dueDate: task.dueDate,
        priority: task.priority,
        difficulty: task.difficulty,
        importance: task.importance,
        estimatedMinutes: task.estimatedMinutes,
        attachments: task.attachments
      };
      const id = localId();
      await runOrQueue(
        async () => {
          const created = await apiCreateTask(body);
          persist((prev) => ({
            ...prev,
            tasks: prev.tasks.some((t) => t.id === created.id) ? prev.tasks : [...prev.tasks, created]
          }));
          try {
            await refreshState();
          } catch {
            /* keep optimistic task */
          }
        },
        () => {
          persist((prev) => ({
            ...prev,
            tasks: [
              ...prev.tasks,
              {
                ...task,
                id,
                status: task.status ?? "pending",
                loggedMinutes: 0,
                completedAt: null,
                createdAt: new Date().toISOString().slice(0, 10)
              }
            ]
          }));
        },
        { type: "create_task", payload: body, localId: id },
        "Task saved offline. It will sync when you are back online."
      );
    },
    [persist, refreshState, runOrQueue]
  );

  const updateTask = useCallback<VoidContextValue["updateTask"]>(
    async (id, patch) => {
      await runOrQueue(
        async () => {
          await apiUpdateTask(id, patch);
          await refreshState();
        },
        () => {
          persist((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))
          }));
        },
        { type: "update_task", id, payload: patch },
        "Changes saved offline."
      );
    },
    [persist, refreshState, runOrQueue]
  );

  const addProject = useCallback<VoidContextValue["addProject"]>(
    async (project) => {
      const body = {
        name: project.name,
        description: project.description,
        color: project.color,
        realm: project.realm,
        level: project.level ?? 1
      };
      const id = localId();
      await runOrQueue(
        async () => {
          const created = await apiCreateProject(body);
          persist((prev) => ({
            ...prev,
            projects: prev.projects.some((p) => p.id === created.id)
              ? prev.projects
              : [...prev.projects, created]
          }));
          try {
            await refreshState();
          } catch {
            /* keep optimistic project */
          }
        },
        () => {
          persist((prev) => ({
            ...prev,
            projects: [
              ...prev.projects,
              {
                ...project,
                id,
                level: project.level ?? 1,
                createdAt: new Date().toISOString().slice(0, 10)
              }
            ]
          }));
        },
        { type: "create_project", payload: body, localId: id },
        "Project saved offline."
      );
    },
    [persist, refreshState, runOrQueue]
  );

  const updateProfile = useCallback<VoidContextValue["updateProfile"]>(
    async (patch) => {
      await runOrQueue(
        async () => {
          await apiUpdateProfile(patch);
          await refreshState();
        },
        () => {
          persist((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
        },
        { type: "update_profile", payload: patch },
        "Profile saved offline."
      );
    },
    [persist, refreshState, runOrQueue]
  );

  const startTimer = useCallback(
    async (taskId: string) => {
      await runOrQueue(
        async () => {
          const remote = await apiStartTimer(taskId);
          persist(remote);
        },
        () => {
          persist((prev) => {
            const isResume = prev.activeTimerTaskId === taskId && !prev.timerStartedAt;
            return {
              ...prev,
              activeTimerTaskId: taskId,
              timerStartedAt: Date.now(),
              timerAccumulatedSeconds: isResume ? (prev.timerAccumulatedSeconds ?? 0) : 0,
              tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: "in_progress" as TaskStatus } : t))
            };
          });
        },
        { type: "start_timer", taskId },
        "Timer started offline."
      );
    },
    [persist, runOrQueue]
  );

  const pauseTimer = useCallback(async () => {
    const taskId = state.activeTimerTaskId;
    if (!taskId || !state.timerStartedAt) return;
    const startedAt = state.timerStartedAt;
    await runOrQueue(
      async () => {
        const remote = await apiPauseTimer(taskId);
        persist(remote);
      },
      () => {
        const segment = Math.floor((Date.now() - startedAt) / 1000);
        persist((prev) => ({
          ...prev,
          timerStartedAt: null,
          timerAccumulatedSeconds: (prev.timerAccumulatedSeconds ?? 0) + segment
        }));
      },
      { type: "pause_timer", taskId },
      "Timer paused offline."
    );
  }, [persist, runOrQueue, state.activeTimerTaskId, state.timerStartedAt]);

  const stopTimer = useCallback(async () => {
    const taskId = state.activeTimerTaskId;
    if (!taskId) return;
    const startedAt = state.timerStartedAt;
    const accumulated = state.timerAccumulatedSeconds ?? 0;
    await runOrQueue(
      async () => {
        const remote = await apiStopTimer(taskId);
        persist(remote);
      },
      () => {
        const running = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
        const elapsed = Math.max(1, Math.floor((accumulated + running) / 60));
        persist((prev) => ({
          ...prev,
          activeTimerTaskId: null,
          timerStartedAt: null,
          timerAccumulatedSeconds: 0,
          profile: applyXp(
            { ...prev.profile, totalFocusMinutes: prev.profile.totalFocusMinutes + elapsed },
            xpForFocusMinutes(elapsed)
          ),
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, loggedMinutes: t.loggedMinutes + elapsed } : t))
        }));
      },
      { type: "stop_timer", taskId },
      "Focus time saved offline."
    );
  }, [persist, runOrQueue, state.activeTimerTaskId, state.timerStartedAt, state.timerAccumulatedSeconds]);

  const completeTask = useCallback(
    async (taskId: string) => {
      await runOrQueue(
        async () => {
          const remote = await apiCompleteTask(taskId);
          persist(remote);
        },
        () => {
          const ended = new Date().toISOString();
          persist((prev) => {
            const base = prev.timerAccumulatedSeconds ?? 0;
            const running =
              prev.activeTimerTaskId === taskId && prev.timerStartedAt
                ? Math.floor((Date.now() - prev.timerStartedAt) / 1000)
                : 0;
            const elapsed =
              prev.activeTimerTaskId === taskId ? Math.max(1, Math.floor((base + running) / 60)) : 0;
            const task = prev.tasks.find((t) => t.id === taskId);
            const updatedTasks = prev.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: "done" as TaskStatus,
                    completedAt: ended,
                    loggedMinutes: t.loggedMinutes + elapsed
                  }
                : t
            );
            let profile = {
              ...prev.profile,
              completedTasks: prev.profile.completedTasks + 1,
              totalFocusMinutes: prev.profile.totalFocusMinutes + elapsed
            };
            if (elapsed > 0) {
              profile = applyXp(profile, xpForFocusMinutes(elapsed));
            }
            if (task) {
              profile = applyXp(
                profile,
                xpForTaskCompletion(
                  task.priority,
                  task.difficulty ?? 5,
                  task.importance ?? 5,
                  task.dueDate,
                  ended
                )
              );
            }
            const projectId = task?.projectId;
            const projects =
              projectId == null
                ? prev.projects
                : prev.projects.map((p) =>
                    p.id === projectId
                      ? { ...p, level: projectLevelFromTasks(updatedTasks.filter((t) => t.projectId === projectId)) }
                      : p
                  );
            return {
              ...prev,
              activeTimerTaskId: prev.activeTimerTaskId === taskId ? null : prev.activeTimerTaskId,
              timerStartedAt: prev.activeTimerTaskId === taskId ? null : prev.timerStartedAt,
              timerAccumulatedSeconds: prev.activeTimerTaskId === taskId ? 0 : prev.timerAccumulatedSeconds,
              profile,
              projects,
              tasks: updatedTasks
            };
          });
        },
        { type: "complete_task", taskId },
        "Task completed offline."
      );
    },
    [persist, runOrQueue]
  );

  const value = useMemo(
    () => ({
      state,
      loading: loading || !ready,
      synced: hasToken,
      online,
      addTask,
      updateTask,
      addProject,
      updateProfile,
      startTimer,
      pauseTimer,
      stopTimer,
      completeTask,
      refreshState
    }),
    [state, loading, ready, hasToken, online, addTask, updateTask, addProject, updateProfile, startTimer, pauseTimer, stopTimer, completeTask, refreshState]
  );

  return <VoidContext.Provider value={value}>{children}</VoidContext.Provider>;
}

export function useVoid() {
  const ctx = useContext(VoidContext);
  if (!ctx) throw new Error("useVoid must be used within VoidProvider");
  return ctx;
}

export const priorityWeight: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

export function sortByPriority(tasks: Task[]) {
  return [...tasks].sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
}

export function isToday(date: string) {
  return date === new Date().toISOString().slice(0, 10);
}
