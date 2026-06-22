"use client";

import { useMemo, useState } from "react";
import { Drawer } from "./Drawer";
import { VoidSpirit } from "./VoidSpirit";
import { AddTaskDrawer } from "./AddTaskDrawer";
import { TaskDrawer } from "./TaskDrawer";
import { projectColorFor, TaskIndicators } from "./TaskIndicators";
import { useVoid } from "@/lib/void-store";
import type { Project, Task } from "@/lib/void-types";

type Tab = "overview" | "report" | "tasks";

type Props = {
  project: Project | null;
  open: boolean;
  onClose: () => void;
};

export function ProjectDrawer({ project, open, onClose }: Props) {
  const { state } = useVoid();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const projectTasks = useMemo(
    () => (project ? state.tasks.filter((t) => t.projectId === project.id) : []),
    [project, state.tasks]
  );

  const done = projectTasks.filter((t) => t.status === "done").length;
  const totalMinutes = projectTasks.reduce((s, t) => s + t.loggedMinutes, 0);
  const remaining = projectTasks.filter((t) => t.status !== "done").length;
  const critical = projectTasks.filter((t) => t.priority === "critical" && t.status !== "done").length;

  if (!project) return null;

  return (
    <>
      <Drawer open={open} onClose={onClose}>
        <div className="void-drawer__tabs void-drawer__tabs--underline">
          {(["overview", "report", "tasks"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`void-drawer__tab void-drawer__tab--underline${tab === t ? " void-drawer__tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="void-drawer__body">
          {tab === "overview" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div className="void-spirit-slot void-spirit-slot--card">
                  <VoidSpirit variant="work" scale="sm" glow />
                </div>
                <div>
                  <h2 className="void-drawer__title void-drawer__title--lg" style={{ margin: 0 }}>
                    {project.name}
                  </h2>
                  <p className="void-section-title" style={{ margin: "6px 0 0" }}>
                    Level {String(project.level).padStart(2, "0")}
                  </p>
                </div>
              </div>
              <p className="void-drawer__desc">{project.description}</p>
              <div className="void-meta-grid">
                <div className="void-meta-item">
                  <div className="void-meta-item__label">Tasks</div>
                  <div className="void-meta-item__value">{projectTasks.length}</div>
                </div>
                <div className="void-meta-item void-meta-item--cyan">
                  <div className="void-meta-item__label">Completed</div>
                  <div className="void-meta-item__value">
                    {done}/{projectTasks.length || 1}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "report" && (
            <>
              <p className="void-section-title">Project report</p>
              <div className="void-report-row">
                <span>Focus time logged</span>
                <span>{totalMinutes}m</span>
              </div>
              <div className="void-report-row">
                <span>Tasks completed</span>
                <span>{done}</span>
              </div>
              <div className="void-report-row">
                <span>Tasks remaining</span>
                <span>{remaining}</span>
              </div>
              <div className="void-report-row">
                <span>Critical open</span>
                <span>{critical}</span>
              </div>
              <div className="void-report-row">
                <span>Overall progress</span>
                <span>{projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0}%</span>
              </div>
              <p className="void-section-title" style={{ marginTop: 16 }}>
                Priority matrix
              </p>
              {(["critical", "high", "medium", "low"] as const).map((p) => (
                <div key={p} className="void-report-row">
                  <span>{p}</span>
                  <span>{projectTasks.filter((t) => t.priority === p).length}</span>
                </div>
              ))}
            </>
          )}

          {tab === "tasks" && (
            <>
              {projectTasks.length === 0 ? (
                <p className="void-empty">No tasks in this project yet.</p>
              ) : (
                projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="void-task-chip"
                    onClick={() => {
                      setSelectedTask(task);
                      setTaskDrawerOpen(true);
                    }}
                  >
                    <TaskIndicators task={task} projectColor={project.color} />
                    <span className={`void-task-row__title${task.status === "done" ? " void-task-row__title--done" : ""}`}>
                      {task.title}
                    </span>
                    <span className="void-task-row__meta">D{task.difficulty} · I{task.importance}</span>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {tab === "overview" && (
          <div className="void-drawer__footer-cta">
            <button type="button" className="void-btn void-btn--initiate" onClick={() => setAddTaskOpen(true)}>
              Add task to project
            </button>
          </div>
        )}
      </Drawer>

      <TaskDrawer task={selectedTask} open={taskDrawerOpen} onClose={() => setTaskDrawerOpen(false)} projectName={project.name} />
      <AddTaskDrawer open={addTaskOpen} onClose={() => setAddTaskOpen(false)} defaultProjectId={project.id} />
    </>
  );
}
