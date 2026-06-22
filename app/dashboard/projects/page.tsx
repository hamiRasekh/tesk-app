"use client";

import { useRouter } from "next/navigation";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddProjectDrawer } from "@/components/void/AddProjectDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { QuestCard } from "@/components/void/QuestCard";
import { isToday, useVoid } from "@/lib/void-store";
import { useMemo, useState } from "react";

export default function ProjectsPage() {
  const router = useRouter();
  const { state } = useVoid();
  const [addOpen, setAddOpen] = useState(false);

  const todayTasks = state.tasks.filter((t) => isToday(t.dueDate));
  const doneToday = todayTasks.filter((t) => t.status === "done").length;

  const quests = useMemo(
    () =>
      state.projects.map((p) => {
        const tasks = state.tasks.filter((t) => t.projectId === p.id);
        const remaining = tasks.filter((t) => t.status !== "done").length;
        return {
          project: p,
          total: tasks.length,
          remaining,
          complete: tasks.length > 0 && remaining === 0
        };
      }),
    [state.projects, state.tasks]
  );

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard
        done={doneToday}
        total={todayTasks.length}
        mood="writing"
        quote="Momentum is building across your projects."
      />

      <div className="void-section-head">
        <h2 className="void-section-head__title">Your projects</h2>
        <button type="button" className="void-btn void-btn--accent" onClick={() => setAddOpen(true)}>
          + New Project
        </button>
      </div>

      <div className="void-scroll-section">
        {quests.length === 0 ? (
          <p className="void-empty">No projects yet. Create one to group your tasks.</p>
        ) : (
          quests.map((q, i) => (
            <QuestCard
              key={q.project.id}
              project={q.project}
              remaining={q.remaining}
              total={q.total}
              complete={q.complete}
              index={i}
              onClick={() => router.push(`/dashboard/projects/${q.project.id}`)}
            />
          ))
        )}
      </div>

      <AddProjectDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
