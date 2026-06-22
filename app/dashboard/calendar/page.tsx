"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddTaskFab } from "@/components/void/AddTaskFab";
import { AddTaskDrawer } from "@/components/void/AddTaskDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { CalendarDayInsight } from "@/components/void/CalendarDayInsight";
import { TaskDrawer } from "@/components/void/TaskDrawer";
import { projectColorFor, TaskIndicators } from "@/components/void/TaskIndicators";
import { isToday, sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { toLocalDateStr } from "@/lib/void-utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: string; day: number; muted: boolean }[] = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1);
    cells.push({ date: toLocalDateStr(d), day: d.getDate(), muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toLocalDateStr(new Date(year, month, d)), day: d, muted: false });
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(cells[cells.length - 1].date + "T12:00:00");
    last.setDate(last.getDate() + 1);
    cells.push({ date: toLocalDateStr(last), day: last.getDate(), muted: true });
  }
  return cells;
}

export default function CalendarPage() {
  const { state } = useVoid();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(now));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const today = toLocalDateStr(now);
  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const activityByDate = useMemo(() => {
    const map: Record<string, number> = {};
    state.tasks.forEach((t) => {
      map[t.dueDate] = (map[t.dueDate] ?? 0) + 1;
      if (t.completedAt) {
        const d = t.completedAt.slice(0, 10);
        map[d] = (map[d] ?? 0) + 1;
      }
    });
    return map;
  }, [state.tasks]);

  const selectedTasks = sortByPriority(
    state.tasks.filter((t) => t.dueDate === selectedDate || (t.completedAt && t.completedAt.slice(0, 10) === selectedDate))
  );
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

      <ActiveFocusCard done={doneToday} total={todayTasks.length} mood="reminder" quote="Tap a day to see focus time, projects, and peak hours." />

      <div className="void-section-head">
        <h2 className="void-section-head__title">{monthLabel}</h2>
        <div className="void-calendar-nav">
          <button type="button" className="void-calendar-nav__btn" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <button type="button" className="void-calendar-nav__btn" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <motion.div className="void-card void-calendar-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="void-calendar">
          {WEEKDAYS.map((d) => (
            <div key={d} className="void-calendar__head">
              {d}
            </div>
          ))}
          {grid.map((cell) => {
            const count = activityByDate[cell.date] ?? 0;
            const isTodayCell = cell.date === today;
            const isSelected = cell.date === selectedDate;
            return (
              <button
                key={cell.date + cell.day}
                type="button"
                className={`void-calendar__day${cell.muted ? " void-calendar__day--muted" : ""}${isTodayCell ? " void-calendar__day--today" : ""}${isSelected ? " void-calendar__day--selected" : ""}${count > 0 ? " void-calendar__day--active" : ""}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span className="void-calendar__num">{cell.day}</span>
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

      <motion.div className="void-card void-flex-grow void-day-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <CalendarDayInsight date={selectedDate} />

        {selectedTasks.length > 0 && (
          <div className="void-day-insight__block">
            <p className="void-day-insight__block-title">Quick open</p>
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="void-task-chip"
                onClick={() => {
                  setSelectedTask(task);
                  setTaskOpen(true);
                }}
              >
                <TaskIndicators task={task} projectColor={projectColorFor(state.projects, task.projectId)} />
                <span className="void-task-row__title">{task.title}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AddTaskFab onClick={() => setAddOpen(true)} label="Schedule task" />

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
