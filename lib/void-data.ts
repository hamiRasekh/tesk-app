import type { AppState } from "./void-types";

/** Offline / pre-auth placeholder — always zeros, never demo data */
export const emptyState: AppState = {
  profile: {
    name: "Aveno User",
    email: "",
    title: "Discipline Seeker",
    rank: "AVENO RANK: TIER I",
    streak: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalFocusMinutes: 0,
    completedTasks: 0
  },
  projects: [],
  tasks: [],
  activeTimerTaskId: null,
  timerStartedAt: null,
  timerAccumulatedSeconds: 0
};
