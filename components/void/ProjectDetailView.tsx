"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddTaskDrawer } from "./AddTaskDrawer";
import { ProgressRing } from "./ProgressRing";
import { TaskDrawer } from "./TaskDrawer";
import { projectColorFor, TaskIndicators } from "./TaskIndicators";
import { VoidSpirit } from "./VoidSpirit";
import { apiGetProjectAnalytics, isOfflineError } from "@/lib/api";
import { loadCachedProjectAnalytics, saveCachedProjectAnalytics } from "@/lib/offline-cache";
import { useVoid } from "@/lib/void-store";
import type { AnalyticsPeriod, Project, ProjectAnalytics, Task } from "@/lib/void-types";
import { formatMinutes } from "@/lib/void-utils";

type Tab = "overview" | "focus" | "difficulty" | "tasks";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
  { key: "quarter", label: "90 days" },
  { key: "year", label: "1 year" },
  { key: "all", label: "All time" }
];

const CALIBRATION_LABELS: Record<string, string> = {
  accurate: "On target",
  slightly_easier: "Easier",
  slightly_harder: "Harder",
  overestimated: "Much faster",
  underestimated: "Much longer"
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ff6b8a",
  high: "#f59e0b",
  medium: "#8a5cf5",
  low: "#17deca"
};

type Props = {
  projectId: string;
};

function BarChart({
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
  return (
    <div className="void-proj-chart">
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

function DualBarChart({
  items
}: {
  items: { difficulty: number; avgLoggedMinutes: number; avgExpectedMinutes: number }[];
}) {
  const max = Math.max(...items.flatMap((i) => [i.avgLoggedMinutes, i.avgExpectedMinutes]), 1);
  return (
    <div className="void-proj-dual-chart">
      {items.map((item) => (
        <div key={item.difficulty} className="void-proj-dual-chart__group">
          <div className="void-proj-dual-chart__bars">
            <div
              className="void-proj-dual-chart__bar void-proj-dual-chart__bar--expected"
              style={{ height: `${Math.max(4, (item.avgExpectedMinutes / max) * 100)}%` }}
              title={`Expected: ${item.avgExpectedMinutes}m`}
            />
            <div
              className="void-proj-dual-chart__bar void-proj-dual-chart__bar--actual"
              style={{ height: `${Math.max(4, (item.avgLoggedMinutes / max) * 100)}%` }}
              title={`Actual: ${item.avgLoggedMinutes}m`}
            />
          </div>
          <span className="void-proj-dual-chart__label">{item.difficulty}</span>
        </div>
      ))}
      <div className="void-proj-dual-chart__legend">
        <span><i className="void-proj-dual-chart__dot void-proj-dual-chart__dot--expected" /> Expected</span>
        <span><i className="void-proj-dual-chart__dot void-proj-dual-chart__dot--actual" /> Actual</span>
      </div>
    </div>
  );
}

export function ProjectDetailView({ projectId }: Props) {
  const router = useRouter();
  const { state } = useVoid();
  const project = state.projects.find((p) => p.id === projectId) ?? null;

  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [data, setData] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineView, setOfflineView] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const cacheKey = useCustom && customFrom && customTo ? `${customFrom}_${customTo}` : period;

  const fetchAnalytics = useCallback(() => {
    const cached = loadCachedProjectAnalytics(projectId, cacheKey) as ProjectAnalytics | null;
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const params = useCustom && customFrom && customTo
      ? { from: customFrom, to: customTo }
      : { period };

    apiGetProjectAnalytics(projectId, params)
      .then((d) => {
        setData(d);
        saveCachedProjectAnalytics(projectId, cacheKey, d);
        setOfflineView(false);
      })
      .catch((err) => {
        if (isOfflineError(err) && cached) {
          setOfflineView(true);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId, cacheKey, period, useCustom, customFrom, customTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const displayProject: Project | null = data?.project ?? project;
  const summary = data?.summary;
  const percent = summary && summary.tasksTotal ? Math.round((summary.tasksDone / summary.tasksTotal) * 100) : 0;

  const timeChartItems = useMemo(() => {
    if (!data) return [];
    if (data.weeklySeries.length > 0) {
      return data.weeklySeries.map((w) => ({ label: w.week.replace(/^\d+-W/, "W"), minutes: w.minutes }));
    }
    return data.timeSeries.map((d) => ({
      label: new Date(d.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
      minutes: d.minutes
    }));
  }, [data]);

  if (!displayProject) {
    return (
      <div className="void-shell">
        <p className="void-empty">Project not found.</p>
        <button type="button" className="void-btn void-btn--ghost" onClick={() => router.push("/dashboard/projects")}>
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="void-shell void-proj-page">
      <header className="void-proj-hero" style={{ "--proj-color": displayProject.color } as CSSProperties}>
        <button type="button" className="void-proj-hero__back" onClick={() => router.push("/dashboard/projects")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="void-proj-hero__main">
          <div className="void-proj-hero__spirit">
            <VoidSpirit variant="work" scale="sm" glow />
          </div>
          <div className="void-proj-hero__info">
            <h1>{displayProject.name}</h1>
            <p>{displayProject.description || "No description yet."}</p>
            <span className="void-proj-hero__level">Level {String(displayProject.level).padStart(2, "0")}</span>
          </div>
          {summary && (
            <div className="void-proj-hero__score">
              <ProgressRing percent={summary.spiritScore} color={displayProject.color} size={56} />
              <span>Aveno</span>
            </div>
          )}
        </div>
      </header>

      <div className="void-proj-period">
        <div className="void-proj-period__pills">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`void-proj-period__pill${!useCustom && period === p.key ? " void-proj-period__pill--active" : ""}`}
              onClick={() => {
                setUseCustom(false);
                setPeriod(p.key);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="void-proj-period__custom">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="void-proj-period__date" />
          <span>→</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="void-proj-period__date" />
          <button
            type="button"
            className="void-btn void-btn--sm void-btn--ghost"
            disabled={!customFrom || !customTo}
            onClick={() => setUseCustom(true)}
          >
            Apply
          </button>
        </div>
        {offlineView && <p className="void-proj-period__offline">Offline — showing saved analytics</p>}
      </div>

      <nav className="void-proj-tabs">
        {(["overview", "focus", "difficulty", "tasks"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`void-proj-tabs__btn${tab === t ? " void-proj-tabs__btn--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {loading && !data ? (
        <p className="void-proj-loading">Loading project intelligence…</p>
      ) : (
        <motion.div className="void-proj-content" key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "overview" && data && (
            <>
              {data.insights.length > 0 && (
                <div className="void-proj-insights">
                  <p className="void-section-title void-proj-insights__title">
                    <Sparkles size={14} /> Insights
                  </p>
                  {data.insights.map((text, i) => (
                    <div key={i} className="void-proj-insight">{text}</div>
                  ))}
                </div>
              )}

              <div className="void-proj-metrics">
                <div className="void-proj-metric">
                  <span className="void-proj-metric__val">{formatMinutes(summary?.totalFocusMinutes ?? 0)}</span>
                  <span className="void-proj-metric__lbl">Focus time</span>
                </div>
                <div className="void-proj-metric">
                  <span className="void-proj-metric__val">{summary?.completionRate ?? 0}%</span>
                  <span className="void-proj-metric__lbl">Completed</span>
                </div>
                <div className="void-proj-metric">
                  <span className="void-proj-metric__val">{summary?.estimationAccuracy ?? 0}%</span>
                  <span className="void-proj-metric__lbl">Estimate accuracy</span>
                </div>
                <div className="void-proj-metric">
                  <span className="void-proj-metric__val">{summary?.focusConsistency ?? 0}%</span>
                  <span className="void-proj-metric__lbl">Consistency</span>
                </div>
              </div>

              <div className="void-card void-proj-card">
                <p className="void-section-title">Progress</p>
                <div className="void-proj-progress-row">
                  <ProgressRing percent={percent} color={displayProject.color} size={72} />
                  <div>
                    <p className="void-proj-progress-row__big">{summary?.tasksDone ?? 0} / {summary?.tasksTotal ?? 0}</p>
                    <p className="void-proj-progress-row__sub">tasks completed</p>
                    <p className="void-proj-progress-row__sub">{summary?.completionsInPeriod ?? 0} finished in this period</p>
                  </div>
                </div>
              </div>

              <div className="void-card void-proj-card">
                <p className="void-section-title">Priority mix</p>
                {Object.entries(data.priorityDistribution).map(([p, count]) => (
                  <div key={p} className="void-proj-dist-row">
                    <span className="void-proj-dist-row__label">{p}</span>
                    <div className="void-proj-dist-row__track">
                      <div
                        className="void-proj-dist-row__fill"
                        style={{
                          width: `${summary?.tasksTotal ? (count / summary.tasksTotal) * 100 : 0}%`,
                          background: PRIORITY_COLORS[p] ?? "#8a5cf5"
                        }}
                      />
                    </div>
                    <span className="void-proj-dist-row__count">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "focus" && data && (
            <>
              <div className="void-card void-proj-card">
                <p className="void-section-title">Time invested</p>
                <div className="void-proj-metrics void-proj-metrics--row">
                  <div className="void-proj-metric void-proj-metric--compact">
                    <span className="void-proj-metric__val">{formatMinutes(summary?.totalFocusMinutes ?? 0)}</span>
                    <span className="void-proj-metric__lbl">Total</span>
                  </div>
                  <div className="void-proj-metric void-proj-metric--compact">
                    <span className="void-proj-metric__val">{summary?.activeDays ?? 0}</span>
                    <span className="void-proj-metric__lbl">Active days</span>
                  </div>
                  <div className="void-proj-metric void-proj-metric--compact">
                    <span className="void-proj-metric__val">{formatMinutes(summary?.avgMinutesPerActiveDay ?? 0)}</span>
                    <span className="void-proj-metric__lbl">Avg / day</span>
                  </div>
                </div>
                {timeChartItems.length > 0 ? (
                  <BarChart
                    items={timeChartItems.map((i) => ({ label: i.label, minutes: i.minutes }))}
                    labelKey="label"
                    valueKey="minutes"
                    color={displayProject.color}
                  />
                ) : (
                  <p className="void-empty">No focus sessions in this period.</p>
                )}
              </div>

              <div className="void-card void-proj-card">
                <p className="void-section-title">Peak hours</p>
                <BarChart
                  items={data.hourlyDistribution.filter((h) => h.minutes > 0).length > 0
                    ? data.hourlyDistribution.map((h) => ({ hour: h.hour, minutes: h.minutes }))
                    : data.hourlyDistribution.map((h) => ({ hour: h.hour, minutes: 0 }))}
                  labelKey="hour"
                  valueKey="minutes"
                  color="#b794ff"
                  formatLabel={(h) => `${h}h`}
                />
                {summary && summary.peakHour >= 0 && (
                  <p className="void-proj-hint">You focus most around {summary.peakHour}:00–{summary.peakHour + 1}:00.</p>
                )}
              </div>
            </>
          )}

          {tab === "difficulty" && data && (
            <>
              <div className="void-card void-proj-card">
                <p className="void-section-title">Difficulty vs actual time</p>
                <p className="void-proj-hint">Compare what you expected (blend of your estimate + difficulty) vs real logged time.</p>
                {data.difficultyBreakdown.length > 0 ? (
                  <DualBarChart items={data.difficultyBreakdown} />
                ) : (
                  <p className="void-empty">Complete tasks with logged time to see difficulty analysis.</p>
                )}
              </div>

              <div className="void-card void-proj-card">
                <p className="void-section-title">Per-difficulty summary</p>
                {data.difficultyBreakdown.map((d) => (
                  <div key={d.difficulty} className="void-proj-cal-row">
                    <span className="void-proj-cal-row__diff">D{d.difficulty}</span>
                    <span>{d.taskCount} tasks</span>
                    <span>{formatMinutes(d.avgLoggedMinutes)} avg</span>
                    <span className={`void-proj-cal-badge void-proj-cal-badge--${d.calibration}`}>
                      {CALIBRATION_LABELS[d.calibration] ?? d.calibration}
                    </span>
                  </div>
                ))}
              </div>

              {data.taskCalibration.length > 0 && (
                <div className="void-card void-proj-card">
                  <p className="void-section-title">Task calibration</p>
                  {data.taskCalibration.slice(0, 12).map((t) => (
                    <div key={t.taskId} className="void-proj-cal-task">
                      <div className="void-proj-cal-task__top">
                        <span>{t.title}</span>
                        <span className={`void-proj-cal-badge void-proj-cal-badge--${t.calibration}`}>
                          {CALIBRATION_LABELS[t.calibration]}
                        </span>
                      </div>
                      <p className="void-proj-cal-task__meta">
                        Difficulty {t.difficulty} · Est. {t.estimatedMinutes}m · Expected {t.expectedMinutes}m · Logged {t.loggedMinutes}m · Ratio {t.ratio}x
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="void-card void-proj-card">
                <p className="void-section-title">Importance × difficulty map</p>
                <div className="void-proj-scatter">
                  {data.taskScatter.map((t) => (
                    <div
                      key={t.taskId}
                      className={`void-proj-scatter__dot${t.status === "done" ? " void-proj-scatter__dot--done" : ""}`}
                      style={{
                        left: `${(t.importance / 10) * 92 + 4}%`,
                        bottom: `${(t.difficulty / 10) * 88 + 4}%`,
                        width: `${Math.max(10, Math.min(28, 8 + t.loggedMinutes / 8))}px`,
                        height: `${Math.max(10, Math.min(28, 8 + t.loggedMinutes / 8))}px`,
                        opacity: t.status === "done" ? 1 : 0.55
                      }}
                      title={`${t.title} — D${t.difficulty} I${t.importance} ${t.loggedMinutes}m`}
                    />
                  ))}
                  <span className="void-proj-scatter__axis void-proj-scatter__axis--x">Importance →</span>
                  <span className="void-proj-scatter__axis void-proj-scatter__axis--y">Difficulty ↑</span>
                </div>
              </div>
            </>
          )}

          {tab === "tasks" && data && (
            <>
              <div className="void-proj-tasks-head">
                <p className="void-section-title">{data.tasks.length} tasks</p>
                <button type="button" className="void-btn void-btn--accent void-btn--sm" onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Add
                </button>
              </div>
              {data.tasks.length === 0 ? (
                <p className="void-empty">No tasks in this project yet.</p>
              ) : (
                data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="void-task-chip"
                    onClick={() => {
                      setSelectedTask(task);
                      setTaskOpen(true);
                    }}
                  >
                    <TaskIndicators task={task} projectColor={projectColorFor(state.projects, task.projectId)} />
                    <span className={`void-task-row__title${task.status === "done" ? " void-task-row__title--done" : ""}`}>
                      {task.title}
                    </span>
                    <span className="void-task-row__meta">D{task.difficulty} · I{task.importance}</span>
                  </div>
                ))
              )}
            </>
          )}
        </motion.div>
      )}

      <TaskDrawer task={selectedTask} open={taskOpen} onClose={() => setTaskOpen(false)} projectName={displayProject.name} />
      <AddTaskDrawer open={addOpen} onClose={() => setAddOpen(false)} defaultProjectId={displayProject.id} />
    </div>
  );
}
