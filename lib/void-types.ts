export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done";
export type SpiritMood = "idle" | "focused" | "happy" | "writing" | "reminder";
export type SpiritVariant = "normal" | "hello" | "work" | "happy" | "write" | "think";
export type RealmIcon = "network" | "rocket" | "shield" | "core";

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  dueDate: string;
  priority: Priority;
  difficulty: number;
  importance: number;
  status: TaskStatus;
  estimatedMinutes: number;
  loggedMinutes: number;
  completedAt: string | null;
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
  timerAccumulatedSeconds: number;
};

export type WorkSession = {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  projectName: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  completed: boolean;
};

export type ProjectDayTotal = {
  projectId: string | null;
  projectName: string;
  minutes: number;
};

export type CalendarDayData = {
  date: string;
  scheduledTasks: Task[];
  completedTasks: Task[];
  workSessions: WorkSession[];
  projectTotals: ProjectDayTotal[];
  totalMinutes: number;
};

export type AnalyticsPeriod = "week" | "month" | "quarter" | "year" | "all";

export type ProjectAnalytics = {
  project: Project;
  period: { key: string; from: string; to: string };
  summary: {
    spiritScore: number;
    totalFocusMinutes: number;
    activeDays: number;
    avgMinutesPerActiveDay: number;
    tasksTotal: number;
    tasksDone: number;
    tasksOpen: number;
    completionRate: number;
    completionsInPeriod: number;
    estimationAccuracy: number;
    focusConsistency: number;
    peakHour: number;
  };
  timeSeries: { date: string; minutes: number }[];
  weeklySeries: { week: string; minutes: number }[];
  hourlyDistribution: { hour: number; minutes: number }[];
  difficultyBreakdown: {
    difficulty: number;
    taskCount: number;
    avgLoggedMinutes: number;
    avgExpectedMinutes: number;
    avgRatio: number;
    calibration: string;
  }[];
  taskCalibration: {
    taskId: string;
    title: string;
    difficulty: number;
    importance: number;
    estimatedMinutes: number;
    expectedMinutes: number;
    loggedMinutes: number;
    ratio: number;
    calibration: string;
    completedAt: string | null;
  }[];
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  taskScatter: {
    taskId: string;
    title: string;
    difficulty: number;
    importance: number;
    loggedMinutes: number;
    status: TaskStatus;
  }[];
  insights: string[];
  tasks: Task[];
};
