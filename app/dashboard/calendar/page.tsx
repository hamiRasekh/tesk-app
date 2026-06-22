"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddTaskDrawer } from "@/components/void/AddTaskDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { TaskDrawer } from "@/components/void/TaskDrawer";
import { isToday, sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; day: number; muted: boolean }[] = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1);
    cells.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d).toISOString().slice(0, 10);
    cells.push({ date, day: d, muted: false });
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(cells[cells.length - 1].date);
    last.setDate(last.getDate() + 1);
    cells.push({ date: last.toISOString().slice(0, 10), day: last.getDate(), muted: true });
  }
  return cells;
}

export default function CalendarPage() {
  const { state } = useVoid();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const today = now.toISOString().slice(0, 10);
  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    state.tasks.forEach((t) => {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [state.tasks]);

  const selectedTasks = sortByPriority(tasksByDate[selectedDate] ?? []);
  const todayTasks = state.tasks.filter((t) => isToday(t.dueDate));
  const doneToday = todayTasks.filter((t) => t.status === "done").length;
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("en", { month: "long", year: "numeric" });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard done={doneToday} total={todayTasks.length} mood="reminder" quote="Track your rituals across the void timeline." />

      <div className="void-section-head">
        <h2 className="void-section-head__title">{monthLabel}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="void-btn void-btn--ghost void-btn--sm" onClick={prevMonth}>
            ‹
          </button>
          <button type="button" className="void-btn void-btn--ghost void-btn--sm" onClick={nextMonth}>
            ›
          </button>
        </div>
      </div>

      <motion.div className="void-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="void-calendar">
          {WEEKDAYS.map((d) => (
            <div key={d} className="void-calendar__head">
              {d}
            </div>
          ))}
          {grid.map((cell) => {
            const count = tasksByDate[cell.date]?.length ?? 0;
            const isTodayCell = cell.date === today;
            const isSelected = cell.date === selectedDate;
            return (
              <button
                key={cell.date}
                type="button"
                className={`void-calendar__day${cell.muted ? " void-calendar__day--muted" : ""}${isTodayCell ? " void-calendar__day--today" : ""}${isSelected ? " void-calendar__day--selected" : ""}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                {cell.day}
                {count > 0 && (
                  <span className="void-calendar__dots">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span key={i} className="void-calendar__dot" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div className="void-card void-flex-grow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p className="void-section-title">
          Rituals on {new Date(selectedDate + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
        </p>
        {selectedTasks.length === 0 ? (
          <p className="void-empty">No quests on this day.</p>
        ) : (
          selectedTasks.map((task) => (
            <div
              key={task.id}
              className="void-task-chip"
              onClick={() => {
                setSelectedTask(task);
                setTaskOpen(true);
              }}
            >
              <span className={`void-task-dot void-task-dot--${task.priority}`} />
              <span className="void-task-row__title">{task.title}</span>
            </div>
          ))
        )}
      </motion.div>

      <button type="button" className="void-btn void-btn--initiate" onClick={() => setAddOpen(true)}>
        + Schedule Quest
      </button>

      <TaskDrawer
        task={selectedTask}
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        projectName={state.projects.find((p) => p.id === selectedTask?.projectId)?.name}
      />
      <AddTaskDrawer open={addOpen} onClose={() => setAddOpen(false)} defaultDate={selectedDate} />
    </div>
  );
}
