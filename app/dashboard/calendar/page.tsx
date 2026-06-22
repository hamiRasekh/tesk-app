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
import {
  buildMonthLabel,
  CalendarMonthHeader,
  initCalendarState,
  VoidCalendarGrid
} from "@/components/void/VoidCalendarGrid";
import { useLocale } from "@/lib/locale";
import { isToday, sortByPriority, useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { toLocalDateStr } from "@/lib/void-utils";

export default function CalendarPage() {
  const { state } = useVoid();
  const { useJalali, usePersianDigits, toggleCalendar } = useLocale();
  const init = initCalendarState();
  const now = new Date();

  const [viewYear, setViewYear] = useState(init.viewYear);
  const [viewMonth, setViewMonth] = useState(init.viewMonth);
  const [viewJy, setViewJy] = useState(init.viewJy);
  const [viewJm, setViewJm] = useState(init.viewJm);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(now));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const today = toLocalDateStr(now);

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

  const monthLabel = buildMonthLabel(useJalali, usePersianDigits, viewYear, viewMonth, viewJy, viewJm);

  function prevMonth() {
    if (useJalali) {
      if (viewJm === 1) {
        setViewJm(12);
        setViewJy((y) => y - 1);
      } else setViewJm((m) => m - 1);
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (useJalali) {
      if (viewJm === 12) {
        setViewJm(1);
        setViewJy((y) => y + 1);
      } else setViewJm((m) => m + 1);
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard
        done={doneToday}
        total={todayTasks.length}
        mood="reminder"
        quote={useJalali ? "روزی را انتخاب کنید تا گزارش تمرکز و پروژه‌ها را ببینید." : "Tap a day to see focus time, projects, and peak hours."}
      />

      <CalendarMonthHeader
        monthLabel={monthLabel}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        useJalali={useJalali}
        onToggleCalendar={toggleCalendar}
      />

      <motion.div className="void-card void-calendar-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <VoidCalendarGrid
          viewYear={viewYear}
          viewMonth={viewMonth}
          viewJy={viewJy}
          viewJm={viewJm}
          useJalali={useJalali}
          usePersianDigits={usePersianDigits}
          today={today}
          selectedDate={selectedDate}
          activityByDate={activityByDate}
          onSelectDate={setSelectedDate}
        />
      </motion.div>

      <motion.div className="void-card void-flex-grow void-day-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <CalendarDayInsight date={selectedDate} />

        {selectedTasks.length > 0 && (
          <div className="void-day-insight__block">
            <p className="void-day-insight__block-title">{useJalali ? "باز کردن سریع" : "Quick open"}</p>
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

      <AddTaskFab onClick={() => setAddOpen(true)} label={useJalali ? "زمان‌بندی تسک" : "Schedule task"} />

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
