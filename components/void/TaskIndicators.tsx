"use client";

import type { Task } from "@/lib/void-types";
import { importanceHeatColor, scaleHeatColor } from "@/lib/void-utils";

type Props = {
  task: Task;
  projectColor?: string | null;
  compact?: boolean;
};

export function TaskIndicators({ task, projectColor, compact = false }: Props) {
  const diff = scaleHeatColor(task.difficulty);
  const imp = importanceHeatColor(task.importance);

  return (
    <span className={`void-task-indicators${compact ? " void-task-indicators--compact" : ""}`}>
      {projectColor ? (
        <span
          className="void-task-indicators__project"
          style={{ background: projectColor, boxShadow: `0 0 8px ${projectColor}` }}
          title="Project color"
        />
      ) : (
        <span className="void-task-indicators__project void-task-indicators__project--none" title="No project" />
      )}
      <span
        className="void-task-indicators__bar"
        style={{ background: diff.color, boxShadow: `0 0 6px ${diff.color}` }}
        title={`Difficulty ${task.difficulty}/10`}
      />
      <span
        className="void-task-indicators__bar"
        style={{ background: imp.color, boxShadow: `0 0 6px ${imp.color}` }}
        title={`Importance ${task.importance}/10`}
      />
    </span>
  );
}

export function projectColorFor(projects: { id: string; color: string }[], projectId: string | null) {
  if (!projectId) return null;
  return projects.find((p) => p.id === projectId)?.color ?? null;
}
