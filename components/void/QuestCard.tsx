"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import type { Project } from "@/lib/void-types";

type Props = {
  project: Project;
  remaining: number;
  total: number;
  complete: boolean;
  index?: number;
  onClick: () => void;
};

const realmIcons: Record<Project["realm"], ReactNode> = {
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
      <path d="M12 2l2 7h5l-4 4 2 9-5-4-5 4 2-9-4-4h5z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
      <path d="M12 3l8 4v6c0 5-3.5 8-8 8s-8-3-8-8V7l8-4z" />
    </svg>
  ),
  core: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
};

export function QuestCard({ project, remaining, total, complete, index = 0, onClick }: Props) {
  const done = total - remaining;
  const percent = total ? (done / total) * 100 : complete ? 100 : 0;

  return (
    <motion.button
      type="button"
      className={`void-quest-card${complete ? " void-quest-card--complete" : ""}`}
      onClick={onClick}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="void-quest-card__icon" style={{ color: project.color }}>
        {complete ? (
          <ProgressRing percent={100} complete size={44} />
        ) : (
          <ProgressRing percent={percent} color={project.color} size={44} />
        )}
      </div>
      <div className="void-quest-card__body">
        <span className="void-quest-card__name">{project.name}</span>
        {complete ? (
          <span className="void-quest-card__status">Mission Complete</span>
        ) : (
          <span className="void-quest-card__meta">
            {remaining} task{remaining !== 1 ? "s" : ""} remaining · Level {String(project.level).padStart(2, "0")}
          </span>
        )}
      </div>
      <span className="void-quest-card__realm" style={{ color: complete ? "#2dd4bf" : project.color }}>
        {realmIcons[project.realm]}
      </span>
      <ChevronRight size={18} className="void-quest-card__chevron" />
    </motion.button>
  );
}
