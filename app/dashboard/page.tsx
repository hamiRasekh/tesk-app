"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddTaskFab } from "@/components/void/AddTaskFab";
import { AddTaskDrawer } from "@/components/void/AddTaskDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { OverdueTaskCard } from "@/components/void/OverdueTaskCard";
import { TaskChipRow } from "@/components/void/TaskChipRow";
import { TaskDrawer } from "@/components/void/TaskDrawer";
import { TaskListSection } from "@/components/void/TaskListSection";
import { isToday, sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { groupTodayBoard } from "@/lib/task-filters";
import { hoursFromMinutes } from "@/lib/void-utils";

const PREVIEW = 3;

export default function HomePage() {
  const { state } = useVoid();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const groups = useMemo(() => groupTodayBoard(state.tasks, sortByPriority), [state.tasks]);
  const todayDue = useMemo(() => state.tasks.filter((t) => isToday(t.dueDate)), [state.tasks]);
  const doneToday = groups.done.length;
  const totalToday = todayDue.length + groups.overdue.filter((t) => isToday(t.dueDate)).length;
  const openToday = groups.inProgress.length + groups.pending.length;
  const criticalOpen = [...groups.inProgress, ...groups.pending, ...groups.overdue].filter(
    (t) => t.priority === "critical"
  ).length;

  const spiritMood = state.activeTimerTaskId
    ? "focused"
    : openToday === 0 && doneToday > 0
      ? "happy"
      : "idle";

  const xpPercent = Math.round((state.profile.xp / state.profile.xpToNext) * 100);

  function openTask(task: Task) {
    setSelectedTask(task);
    setTaskOpen(true);
  }

  const overduePreview = groups.overdue.slice(0, 2);
  const todayOpenCount = groups.inProgress.length + groups.pending.length;

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard done={doneToday} total={Math.max(totalToday, doneToday + openToday)} mood={spiritMood} />

      <div className="void-mini-grid">
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="void-stat-card__icon">⚡</div>
          <div>
            <div className="void-stat-card__value">Lv.{state.profile.level}</div>
            <div className="void-stat-card__label">
              {state.profile.xp}/{state.profile.xpToNext} XP
            </div>
          </div>
        </motion.div>
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="void-stat-card__icon">🎯</div>
          <div>
            <div className="void-stat-card__value">{hoursFromMinutes(state.profile.totalFocusMinutes)}</div>
            <div className="void-stat-card__label">Deep Focus</div>
          </div>
        </motion.div>
      </div>

      <div className="void-level-card" style={{ padding: "12px 14px" }}>
        <div className="void-stat__bar">
          <div className="void-stat__bar-fill void-stat__bar-fill--cyan" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      {groups.overdue.length > 0 && (
        <motion.section className="void-card void-task-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="void-section-head">
            <h2 className="void-section-head__title">Missed deadlines</h2>
            <span className="void-pill void-pill--warn">{groups.overdue.length}</span>
          </div>
          <div className="void-overdue-list">
            {overduePreview.map((task) => (
              <OverdueTaskCard key={task.id} task={task} onOpen={() => openTask(task)} />
            ))}
          </div>
          {groups.overdue.length > overduePreview.length && (
            <Link href="/dashboard/tasks/today" className="void-link-more">
              Show all overdue ({groups.overdue.length})
            </Link>
          )}
        </motion.section>
      )}

      <motion.div className="void-card void-task-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <TaskListSection
          title="In progress"
          tasks={groups.inProgress}
          projects={state.projects}
          onTaskClick={openTask}
          limit={PREVIEW}
          moreHref="/dashboard/tasks/today"
          moreLabel="Show more"
          showStatus
          badge={`${groups.inProgress.length}`}
          emptyText="No tasks in progress."
        />
      </motion.div>

      <motion.div className="void-card void-task-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <TaskListSection
          title="Not started"
          tasks={groups.pending}
          projects={state.projects}
          onTaskClick={openTask}
          limit={PREVIEW}
          moreHref="/dashboard/tasks/today"
          moreLabel="Show more"
          showStatus
          badge={criticalOpen > 0 ? `${criticalOpen} critical` : `${groups.pending.length}`}
          emptyText="All planned tasks are started or done."
        />
      </motion.div>

      <motion.div className="void-card void-task-section" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="void-section-head">
          <h2 className="void-section-head__title">Completed today</h2>
          <span className="void-pill">{doneToday}</span>
        </div>
        {groups.done.length === 0 ? (
          <p className="void-empty">Nothing completed yet today.</p>
        ) : (
          <>
            <div className="void-task-section__list">
              {groups.done.slice(0, PREVIEW).map((task) => (
                <TaskChipRow key={task.id} task={task} projects={state.projects} onClick={() => openTask(task)} showMeta />
              ))}
            </div>
            <Link href="/dashboard/tasks/completed" className="void-link-more">
              Show more ({groups.done.length} today · full report)
            </Link>
          </>
        )}
      </motion.div>

      {todayOpenCount === 0 && groups.overdue.length === 0 && doneToday === 0 && (
        <p className="void-empty void-empty--centered">No tasks for today. Add your first one below.</p>
      )}

      <AddTaskFab onClick={() => setAddOpen(true)} />

      <TaskDrawer
        task={selectedTask}
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectName={state.projects.find((p) => p.id === selectedTask?.projectId)?.name}
      />
      <AddTaskDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
