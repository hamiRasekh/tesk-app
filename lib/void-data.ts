import type { AppState } from "./void-types";

const today = new Date().toISOString().slice(0, 10);

/** Fresh account — no demo tasks or projects */
export const emptyState: AppState = {
  profile: {
    name: "Aveno User",
    email: "",
    title: "Productivity Seeker",
    rank: "AVENO RANK: TIER I",
    streak: 0,
    level: 1,
    xp: 0,
    xpToNext: 300,
    totalFocusMinutes: 0,
    completedTasks: 0
  },
  projects: [],
  tasks: [],
  activeTimerTaskId: null,
  timerStartedAt: null,
  timerAccumulatedSeconds: 0
};

/** @deprecated demo only — not used in production flow */
export const seedState: AppState = {
  profile: {
    name: "Aveno Pro",
    email: "demo@aveno.app",
    title: "Aveno Rank: Tier VII",
    rank: "AVENO RANK: TIER VII",
    streak: 12,
    level: 42,
    xp: 2450,
    xpToNext: 3000,
    totalFocusMinutes: 9840,
    completedTasks: 842
  },
  projects: [
    {
      id: "p1",
      name: "System Architecture",
      description: "Core architecture and workflow protocols.",
      color: "#8b5cf6",
      level: 12,
      realm: "network",
      createdAt: "2026-06-01"
    },
    {
      id: "p2",
      name: "Nexus Protocol",
      description: "Cross-realm integrations and essence synchronization.",
      color: "#2dd4bf",
      level: 8,
      realm: "rocket",
      createdAt: "2026-06-10"
    },
    {
      id: "p3",
      name: "Aveno Core",
      description: "Central spirit engine — mission complete.",
      color: "#2dd4bf",
      level: 22,
      realm: "core",
      createdAt: "2026-06-15"
    }
  ],
  tasks: [
    {
      id: "t1",
      title: "Deep Work Protocol",
      description:
        "Deep focus session to complete the architectural audit of the Aveno core. Track every detail.",
      projectId: "p1",
      dueDate: today,
      priority: "critical",
      difficulty: 8,
      importance: 9,
      status: "pending",
      estimatedMinutes: 90,
      loggedMinutes: 0,
      completedAt: null,
      attachments: ["Blueprint.void", "Energy_Logs.txt"],
      createdAt: today
    },
    {
      id: "t2",
      title: "Neural Path Mapping",
      description: "Map focus timer flows and spirit mood state transitions.",
      projectId: "p1",
      dueDate: today,
      priority: "high",
      difficulty: 6,
      importance: 7,
      status: "in_progress",
      estimatedMinutes: 60,
      loggedMinutes: 25,
      completedAt: null,
      attachments: [],
      createdAt: today
    },
    {
      id: "t3",
      title: "Essence Link Copy",
      description: "Write launch copy for the cosmic onboarding ritual.",
      projectId: "p2",
      dueDate: today,
      priority: "medium",
      difficulty: 4,
      importance: 5,
      status: "pending",
      estimatedMinutes: 45,
      loggedMinutes: 0,
      completedAt: null,
      attachments: ["draft-v2.md"],
      createdAt: today
    },
    {
      id: "t4",
      title: "Aveno Core Seal",
      description: "Finalize the central engine deployment.",
      projectId: "p3",
      dueDate: today,
      priority: "low",
      difficulty: 3,
      importance: 3,
      status: "done",
      estimatedMinutes: 30,
      loggedMinutes: 30,
      completedAt: today + "T18:00:00.000Z",
      attachments: [],
      createdAt: today
    },
    {
      id: "t5",
      title: "Calendar Density Ritual",
      description: "Show per-day task load across the work calendar.",
      projectId: "p1",
      dueDate: "2026-06-25",
      priority: "medium",
      difficulty: 4,
      importance: 5,
      status: "pending",
      estimatedMinutes: 50,
      loggedMinutes: 0,
      completedAt: null,
      attachments: [],
      createdAt: today
    }
  ],
  activeTimerTaskId: null,
  timerStartedAt: null,
  timerAccumulatedSeconds: 0
};
