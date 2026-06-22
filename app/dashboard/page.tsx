"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddTaskDrawer } from "@/components/void/AddTaskDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { TaskDrawer } from "@/components/void/TaskDrawer";
import { isToday, sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { hoursFromMinutes } from "@/lib/void-utils";

export default function HomePage() {
  const { state } = useVoid();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const todayTasks = useMemo(
    () => sortByPriority(state.tasks.filter((t) => isToday(t.dueDate))),
    [state.tasks]
  );

  const doneToday = todayTasks.filter((t) => t.status === "done").length;
  const totalToday = todayTasks.length;
  const criticalOpen = todayTasks.filter((t) => t.priority === "critical" && t.status !== "done").length;

  const spiritMood = state.activeTimerTaskId
    ? "focused"
    : doneToday === totalToday && totalToday > 0
      ? "happy"
      : "idle";

  const xpPercent = Math.round((state.profile.xp / state.profile.xpToNext) * 100);

  function openTask(task: Task) {
    setSelectedTask(task);
    setTaskOpen(true);
  }

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard done={doneToday} total={totalToday} mood={spiritMood} />

      <div className="void-mini-grid">
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="void-stat-card__icon">⚡</div>
          <div>
            <div className="void-stat-card__value">Lv.{state.profile.level}</div>
            <div className="void-stat-card__label">{state.profile.xp}/{state.profile.xpToNext} XP</div>
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

      <motion.div className="void-card void-flex-grow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="void-section-head">
          <h2 className="void-section-head__title">Today&apos;s Quests</h2>
          <span className="void-pill">{criticalOpen} critical</span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {todayTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="void-task-chip" onClick={() => openTask(task)}>
              <span className={`void-task-dot void-task-dot--${task.priority}`} />
              <span className={`void-task-row__title${task.status === "done" ? " void-task-row__title--done" : ""}`} style={{ flex: 1 }}>
                {task.title}
              </span>
              {task.priority === "critical" && <span className="void-task-chip__priority">!</span>}
            </div>
          ))}
          {todayTasks.length === 0 && <p className="void-empty">The void awaits your first quest.</p>}
        </div>
      </motion.div>

      <motion.button
        type="button"
        className="void-btn void-btn--initiate"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => setAddOpen(true)}
      >
        + Summon New Quest
      </motion.button>

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
