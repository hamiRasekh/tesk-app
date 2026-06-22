"use client";

import Link from "next/link";
import type { Task } from "@/lib/void-types";
import type { Project } from "@/lib/void-types";
import { TaskChipRow } from "./TaskChipRow";

type Props = {
  title: string;
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  emptyText?: string;
  limit?: number;
  moreHref?: string;
  moreLabel?: string;
  showStatus?: boolean;
  showMeta?: boolean;
  badge?: string;
};

export function TaskListSection({
  title,
  tasks,
  projects,
  onTaskClick,
  emptyText,
  limit,
  moreHref,
  moreLabel = "Show more",
  showStatus,
  showMeta,
  badge
}: Props) {
  const visible = limit ? tasks.slice(0, limit) : tasks;
  const hasMore = limit ? tasks.length > limit : false;

  if (tasks.length === 0 && !emptyText) return null;

  return (
    <section className="void-task-section">
      <div className="void-section-head">
        <h2 className="void-section-head__title">{title}</h2>
        {badge ? <span className="void-pill">{badge}</span> : <span className="void-pill">{tasks.length}</span>}
      </div>
      {tasks.length === 0 ? (
        <p className="void-empty">{emptyText}</p>
      ) : (
        <>
          <div className="void-task-section__list">
            {visible.map((task) => (
              <TaskChipRow
                key={task.id}
                task={task}
                projects={projects}
                onClick={() => onTaskClick(task)}
                showStatus={showStatus}
                showMeta={showMeta}
              />
            ))}
          </div>
          {hasMore && moreHref && (
            <Link href={moreHref} className="void-link-more">
              {moreLabel} ({tasks.length})
            </Link>
          )}
        </>
      )}
    </section>
  );
}
