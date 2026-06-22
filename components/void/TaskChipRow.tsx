"use client";

import type { Task } from "@/lib/void-types";
import { projectColorFor, TaskIndicators } from "./TaskIndicators";
import type { Project } from "@/lib/void-types";
import { formatMinutes } from "@/lib/void-utils";
import { statusLabel } from "@/lib/task-filters";

type Props = {
  task: Task;
  projects: Project[];
  onClick: () => void;
  showStatus?: boolean;
  showMeta?: boolean;
};

export function TaskChipRow({ task, projects, onClick, showStatus, showMeta }: Props) {
  return (
    <div className="void-task-chip" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <TaskIndicators task={task} projectColor={projectColorFor(projects, task.projectId)} />
      <span className="void-task-chip__main">
        <span className={`void-task-row__title${task.status === "done" ? " void-task-row__title--done" : ""}`}>{task.title}</span>
        {showMeta && (
          <span className="void-task-row__meta">
            {formatMinutes(task.loggedMinutes || task.estimatedMinutes)}
            {task.estimatedMinutes > 0 && task.loggedMinutes > 0 ? ` · est ${formatMinutes(task.estimatedMinutes)}` : ""}
          </span>
        )}
      </span>
      {showStatus && <span className={`void-task-status void-task-status--${task.status}`}>{statusLabel(task.status)}</span>}
      {task.priority === "critical" && task.status !== "done" && <span className="void-task-chip__priority">!</span>}
    </div>
  );
}
