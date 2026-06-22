import type { AppState } from "./void-types";

const today = new Date().toISOString().slice(0, 10);

export const seedState: AppState = {
  profile: {
    name: "Grandmaster Void",
    email: "void@spirit.realm",
    title: "Ethereal Rank: Tier VII",
    rank: "ETHEREAL RANK: TIER VII",
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
      description: "Core void engine structure and mana-flow protocols.",
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
      name: "Void Core",
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
        "Initiate a deep state of concentration to complete the architectural audit of the Void Engine core. Ensure all mana-leaks are sealed.",
      projectId: "p1",
      dueDate: today,
      priority: "critical",
      status: "pending",
      estimatedMinutes: 90,
      loggedMinutes: 0,
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
      status: "in_progress",
      estimatedMinutes: 60,
      loggedMinutes: 25,
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
      status: "pending",
      estimatedMinutes: 45,
      loggedMinutes: 0,
      attachments: ["draft-v2.md"],
      createdAt: today
    },
    {
      id: "t4",
      title: "Void Core Seal",
      description: "Finalize the central spirit engine deployment.",
      projectId: "p3",
      dueDate: today,
      priority: "low",
      status: "done",
      estimatedMinutes: 30,
      loggedMinutes: 30,
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
      status: "pending",
      estimatedMinutes: 50,
      loggedMinutes: 0,
      attachments: [],
      createdAt: today
    }
  ],
  activeTimerTaskId: null,
  timerStartedAt: null
};
