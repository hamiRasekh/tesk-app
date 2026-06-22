"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { TaskDrawer } from "./TaskDrawer";
import { TaskChipRow } from "./TaskChipRow";
import { VoidSelect } from "./VoidSelect";
import { useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import {
  type CompletedPeriod,
  completionsByDay,
  estimationAccuracy,
  filterCompletedTasks,
  focusMinutesByDay,
  priorityBreakdown,
  projectBreakdown
} from "@/lib/completed-analytics";
import { formatMinutes } from "@/lib/void-utils";
import { completedAtDate } from "@/lib/task-filters";

const PERIODS: { key: CompletedPeriod; label: string }[] = [
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
  { key: "quarter", label: "90 days" },
  { key: "year", label: "1 year" },
  { key: "all", label: "All time" }
];

function MiniBarChart({
  items,
  labelKey,
  valueKey,
  color = "#8a5cf5",
  formatLabel
}: {
  items: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  color?: string;
  formatLabel?: (v: string | number) => string;
}) {
  const max = Math.max(...items.map((i) => Number(i[valueKey])), 1);
  if (items.length === 0) return <p className="void-empty">No data for this period.</p>;
  return (
    <div className="void-proj-chart void-proj-chart--compact">
      {items.map((item, i) => {
        const val = Number(item[valueKey]);
        const height = Math.max(4, (val / max) * 100);
        const label = formatLabel ? formatLabel(item[labelKey]) : String(item[labelKey]);
        return (
          <div key={i} className="void-proj-chart__col" title={`${label}: ${val}`}>
            <div className="void-proj-chart__bar" style={{ height: `${height}%`, background: color }} />
            <span className="void-proj-chart__tick">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CompletedTasksReport({ backHref = "/dashboard" }: { backHref?: string }) {
  const router = useRouter();
  const { state } = useVoid();
  const [period, setPeriod] = useState<CompletedPeriod>("month");
  const [projectId, setProjectId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);

  const filtered = useMemo(
    () => filterCompletedTasks(state.tasks, { period, projectId: projectId || null }),
    [state.tasks, period, projectId]
  );

  const byDay = useMemo(() => completionsByDay(filtered).slice(-14), [filtered]);
  const focusByDay = useMemo(() => focusMinutesByDay(filtered).slice(-14), [filtered]);
  const accuracy = useMemo(() => estimationAccuracy(filtered), [filtered]);
  const byPriority = useMemo(() => priorityBreakdown(filtered), [filtered]);
  const projectNames = useMemo(() => new Map(state.projects.map((p) => [p.id, p.name])), [state.projects]);
  const byProject = useMemo(() => projectBreakdown(filtered, projectNames), [filtered, projectNames]);

  const totalFocus = filtered.reduce((s, t) => s + t.loggedMinutes, 0);

  return (
    <div className="void-shell">
      <div className="void-page-top">
        <button type="button" className="void-back-btn" onClick={() => router.push(backHref)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="void-page-title">Completed tasks</h1>
      </div>

      <motion.div className="void-mini-grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="void-stat-card">
          <div className="void-stat-card__icon">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="void-stat-card__value">{filtered.length}</div>
            <div className="void-stat-card__label">Completed</div>
          </div>
        </div>
        <div className="void-stat-card">
          <div className="void-stat-card__icon">⏱</div>
          <div>
            <div className="void-stat-card__value">{formatMinutes(totalFocus)}</div>
            <div className="void-stat-card__label">Focus logged</div>
          </div>
        </div>
      </motion.div>

      <div className="void-filter-row">
        <div className="void-filter-chips">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`void-filter-chip${period === p.key ? " void-filter-chip--active" : ""}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <VoidSelect
          className="void-filter-select"
          value={projectId}
          onChange={setProjectId}
          placeholder="All projects"
          options={[
            { value: "", label: "All projects" },
            ...state.projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))
          ]}
        />
      </div>

      <motion.div className="void-card void-report-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="void-section-head__title">Completions per day</h2>
        <MiniBarChart
          items={byDay}
          labelKey="date"
          valueKey="count"
          color="#8b5cf6"
          formatLabel={(d) => String(d).slice(5)}
        />
      </motion.div>

      <motion.div className="void-card void-report-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="void-section-head__title">Focus minutes per day</h2>
        <MiniBarChart
          items={focusByDay}
          labelKey="date"
          valueKey="minutes"
          color="#2dd4bf"
          formatLabel={(d) => String(d).slice(5)}
        />
      </motion.div>

      <motion.div className="void-card void-report-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="void-section-head__title">Estimation accuracy</h2>
        <p className="void-report-stat">
          <strong>{accuracy.label}</strong>
          {accuracy.count > 0 && (
            <span className="void-report-stat__sub">
              Avg ratio {accuracy.ratio.toFixed(2)}× · {accuracy.count} tasks with estimates
            </span>
          )}
        </p>
        <h3 className="void-report-subtitle">By priority</h3>
        <MiniBarChart
          items={byPriority}
          labelKey="priority"
          valueKey="count"
          formatLabel={(p) => String(p).slice(0, 3).toUpperCase()}
          color="#f59e0b"
        />
        {byProject.length > 0 && (
          <>
            <h3 className="void-report-subtitle">By project</h3>
            <MiniBarChart
              items={byProject.map((p) => ({ name: p.name, count: p.count }))}
              labelKey="name"
              valueKey="count"
              color="#17deca"
            />
          </>
        )}
      </motion.div>

      <motion.div className="void-card void-report-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="void-section-head">
          <h2 className="void-section-head__title">All completed</h2>
          <span className="void-pill">{filtered.length}</span>
        </div>
        <div className="void-task-section__list">
          {filtered.map((task) => (
            <div key={task.id} className="void-completed-row">
              <TaskChipRow
                task={task}
                projects={state.projects}
                onClick={() => {
                  setSelectedTask(task);
                  setTaskOpen(true);
                }}
                showMeta
              />
              <span className="void-completed-row__date">{completedAtDate(task)}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="void-empty">No completed tasks in this period.</p>}
        </div>
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
