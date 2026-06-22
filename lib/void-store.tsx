"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  apiCompleteTask,
  apiCreateProject,
  apiCreateTask,
  apiGetState,
  apiStartTimer,
  apiStopTimer,
  apiUpdateProfile,
  apiUpdateTask,
  getToken
} from "./api";
import { seedState } from "./void-data";
import type { AppState, Priority, Project, RealmIcon, Task, TaskStatus, UserProfile } from "./void-types";
import { xpForTask } from "./void-utils";

const STORAGE_KEY = "void-spirit-app-v2";

type VoidContextValue = {
  state: AppState;
  loading: boolean;
  synced: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt" | "loggedMinutes" | "status"> & { status?: TaskStatus }) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt" | "level"> & { level?: number }) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  refreshState: () => Promise<void>;
};

const VoidContext = createContext<VoidContextValue | null>(null);

function loadLocalState(): AppState {
  if (typeof window === "undefined") return seedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...seedState,
      ...parsed,
      profile: { ...seedState.profile, ...parsed.profile },
      projects: parsed.projects?.length ? parsed.projects : seedState.projects,
      tasks: parsed.tasks?.length ? parsed.tasks : seedState.tasks
    };
  } catch {
    return seedState;
  }
}

function awardXp(profile: UserProfile, amount: number): UserProfile {
  let xp = profile.xp + amount;
  let level = profile.level;
  let xpToNext = profile.xpToNext;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.15);
  }
  return { ...profile, xp, level, xpToNext, completedTasks: profile.completedTasks + 1 };
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VoidProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const synced = Boolean(getToken());

  const refreshState = useCallback(async () => {
    if (!getToken()) return;
    const remote = await apiGetState();
    setState(remote);
  }, []);

  useEffect(() => {
    async function init() {
      if (getToken()) {
        try {
          const remote = await apiGetState();
          setState(remote);
        } catch {
          setState(loadLocalState());
        }
      } else {
        setState(loadLocalState());
      }
      setReady(true);
      setLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    if (!ready || getToken()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const addTask = useCallback<VoidContextValue["addTask"]>(async (task) => {
    if (getToken()) {
      await apiCreateTask({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        attachments: task.attachments
      });
      await refreshState();
      return;
    }
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          ...task,
          id: uid(),
          status: task.status ?? "pending",
          loggedMinutes: 0,
          createdAt: new Date().toISOString().slice(0, 10)
        }
      ]
    }));
  }, [refreshState]);

  const updateTask = useCallback<VoidContextValue["updateTask"]>(async (id, patch) => {
    if (getToken()) {
      await apiUpdateTask(id, patch);
      await refreshState();
      return;
    }
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }));
  }, [refreshState]);

  const addProject = useCallback<VoidContextValue["addProject"]>(async (project) => {
    if (getToken()) {
      await apiCreateProject({
        name: project.name,
        description: project.description,
        color: project.color,
        realm: project.realm,
        level: project.level ?? 1
      });
      await refreshState();
      return;
    }
    setState((s) => ({
      ...s,
      projects: [
        ...s.projects,
        {
          ...project,
          id: uid(),
          level: project.level ?? 1,
          createdAt: new Date().toISOString().slice(0, 10)
        }
      ]
    }));
  }, [refreshState]);

  const updateProfile = useCallback<VoidContextValue["updateProfile"]>(async (patch) => {
    if (getToken()) {
      await apiUpdateProfile(patch);
      await refreshState();
      return;
    }
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, [refreshState]);

  const startTimer = useCallback(async (taskId: string) => {
    if (getToken()) {
      const remote = await apiStartTimer(taskId);
      setState(remote);
      return;
    }
    setState((s) => ({
      ...s,
      activeTimerTaskId: taskId,
      timerStartedAt: Date.now(),
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "in_progress" as TaskStatus } : t))
    }));
  }, []);

  const stopTimer = useCallback(async () => {
    if (getToken() && state.activeTimerTaskId) {
      const remote = await apiStopTimer(state.activeTimerTaskId);
      setState(remote);
      return;
    }
    setState((s) => {
      if (!s.activeTimerTaskId || !s.timerStartedAt) return { ...s, activeTimerTaskId: null, timerStartedAt: null };
      const elapsed = Math.floor((Date.now() - s.timerStartedAt) / 60000);
      return {
        ...s,
        activeTimerTaskId: null,
        timerStartedAt: null,
        profile: { ...s.profile, totalFocusMinutes: s.profile.totalFocusMinutes + elapsed },
        tasks: s.tasks.map((t) =>
          t.id === s.activeTimerTaskId ? { ...t, loggedMinutes: t.loggedMinutes + elapsed } : t
        )
      };
    });
  }, [state.activeTimerTaskId]);

  const completeTask = useCallback(async (taskId: string) => {
    if (getToken()) {
      const remote = await apiCompleteTask(taskId);
      setState(remote);
      return;
    }
    setState((s) => {
      const task = s.tasks.find((t) => t.id === taskId);
      if (!task) return s;
      let profile = s.profile;
      if (task.status !== "done") profile = awardXp(profile, xpForTask(task.priority));
      if (s.activeTimerTaskId === taskId && s.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - s.timerStartedAt) / 60000);
        profile = { ...profile, totalFocusMinutes: profile.totalFocusMinutes + elapsed };
      }
      return {
        ...s,
        activeTimerTaskId: s.activeTimerTaskId === taskId ? null : s.activeTimerTaskId,
        timerStartedAt: s.activeTimerTaskId === taskId ? null : s.timerStartedAt,
        profile,
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const extra =
            s.activeTimerTaskId === taskId && s.timerStartedAt
              ? Math.floor((Date.now() - s.timerStartedAt) / 60000)
              : 0;
          return { ...t, status: "done" as TaskStatus, loggedMinutes: t.loggedMinutes + extra };
        })
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loading,
      synced,
      addTask,
      updateTask,
      addProject,
      updateProfile,
      startTimer,
      stopTimer,
      completeTask,
      refreshState
    }),
    [state, loading, synced, addTask, updateTask, addProject, updateProfile, startTimer, stopTimer, completeTask, refreshState]
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
