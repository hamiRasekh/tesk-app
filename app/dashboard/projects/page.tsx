"use client";

import { useMemo, useState } from "react";
import { ActiveFocusCard } from "@/components/void/ActiveFocusCard";
import { AddProjectDrawer } from "@/components/void/AddProjectDrawer";
import { AppHeader } from "@/components/void/AppHeader";
import { ProjectDrawer } from "@/components/void/ProjectDrawer";
import { QuestCard } from "@/components/void/QuestCard";
import { isToday, useVoid } from "@/lib/void-store";
import type { Project } from "@/lib/void-types";

export default function ProjectsPage() {
  const { state } = useVoid();
  const [selected, setSelected] = useState<Project | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  function openProject(p: Project) {
    setSelected(p);
    setDrawerOpen(true);
  }

  return (
    <div className="void-shell">
      <AppHeader />

      <ActiveFocusCard
        done={doneToday}
        total={todayTasks.length}
        mood="writing"
        quote="Your spirit is forging paths across the realms."
      />

      <div className="void-section-head">
        <h2 className="void-section-head__title">Active Quests</h2>
        <button type="button" className="void-btn void-btn--accent" onClick={() => setAddOpen(true)}>
          + New Project
        </button>
      </div>

      <div className="void-scroll-section">
        {quests.map((q, i) => (
          <QuestCard
            key={q.project.id}
            project={q.project}
            remaining={q.remaining}
            total={q.total}
            complete={q.complete}
            index={i}
            onClick={() => openProject(q.project)}
          />
        ))}
      </div>

      <ProjectDrawer project={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <AddProjectDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
