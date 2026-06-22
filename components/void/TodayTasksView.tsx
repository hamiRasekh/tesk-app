"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskDrawer } from "./TaskDrawer";
import { TaskListSection } from "./TaskListSection";
import { OverdueTaskCard } from "./OverdueTaskCard";
import { sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { groupTodayBoard } from "@/lib/task-filters";

export function TodayTasksView({ backHref = "/dashboard" }: { backHref?: string }) {
  const router = useRouter();
  const { state } = useVoid();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);

  const groups = useMemo(() => groupTodayBoard(state.tasks, sortByPriority), [state.tasks]);

  function openTask(task: Task) {
    setSelectedTask(task);
    setTaskOpen(true);
  }

  return (
    <div className="void-shell">
      <div className="void-page-top">
        <button type="button" className="void-back-btn" onClick={() => router.push(backHref)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="void-page-title">Today&apos;s tasks</h1>
      </div>

      {groups.overdue.length > 0 && (
        <motion.section className="void-card void-task-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="void-section-head">
            <h2 className="void-section-head__title">Overdue</h2>
            <span className="void-pill void-pill--warn">{groups.overdue.length}</span>
          </div>
          <div className="void-overdue-list">
            {groups.overdue.map((task) => (
              <OverdueTaskCard key={task.id} task={task} onOpen={() => openTask(task)} />
            ))}
          </div>
        </motion.section>
      )}

      <motion.div className="void-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <TaskListSection
          title="In progress"
          tasks={groups.inProgress}
          projects={state.projects}
          onTaskClick={openTask}
          showStatus
          emptyText="No tasks in progress for today."
        />
      </motion.div>

      <motion.div className="void-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <TaskListSection
          title="Not started"
          tasks={groups.pending}
          projects={state.projects}
          onTaskClick={openTask}
          showStatus
          emptyText="All today's tasks are started or done."
        />
      </motion.div>

      <motion.div className="void-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <TaskListSection
          title="Completed today"
          tasks={groups.done}
          projects={state.projects}
          onTaskClick={openTask}
          showMeta
          emptyText="Nothing completed yet today."
        />
        {groups.done.length > 0 && (
          <Link href="/dashboard/tasks/completed" className="void-link-more">
            Full completion report
          </Link>
        )}
      </motion.div>

      <TaskDrawer
        task={selectedTask}
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectName={state.projects.find((p) => p.id === selectedTask?.projectId)?.name}
      />
    </div>
  );
}
