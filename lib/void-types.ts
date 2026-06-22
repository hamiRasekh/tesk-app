export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done";
export type SpiritMood = "idle" | "focused" | "happy" | "writing" | "reminder";
export type SpiritVariant = "normal" | "hello" | "work" | "happy";
export type RealmIcon = "network" | "rocket" | "shield" | "core";

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number;
  loggedMinutes: number;
  attachments: string[];
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  level: number;
  realm: RealmIcon;
  createdAt: string;
};

export type UserProfile = {
  name: string;
  email: string;
  title: string;
  rank: string;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalFocusMinutes: number;
  completedTasks: number;
};

export type AppState = {
  tasks: Task[];
  projects: Project[];
  profile: UserProfile;
  activeTimerTaskId: string | null;
  timerStartedAt: number | null;
};
