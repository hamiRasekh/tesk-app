"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, FileText, Paperclip } from "lucide-react";
import { Drawer } from "./Drawer";
import { VoidSpirit } from "./VoidSpirit";
import { useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { TaskIndicators, projectColorFor } from "./TaskIndicators";
import { getExpirationLabel, importanceHeatColor, priorityLabel, scaleHeatColor } from "@/lib/void-utils";
import {
  formatTimerDisplay,
  getTimerElapsedSeconds,
  isTimerPaused,
  isTimerRunning
} from "@/lib/focus-timer";

type Tab = "info" | "focus";

type Props = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectName?: string;
};

export function TaskDrawer({ task, open, onClose, projectName }: Props) {
  const { state, startTimer, pauseTimer, completeTask } = useVoid();
  const [tab, setTab] = useState<Tab>("info");
  const [, setTick] = useState(0);

  const isActive = task && state.activeTimerTaskId === task.id;
  const running = isActive && isTimerRunning(state);
  const paused = isActive && isTimerPaused(state);

  useEffect(() => {
    if (!isActive || !running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isActive, running]);

  useEffect(() => {
    if (!open) setTab("info");
  }, [open]);

  if (!task) return null;

  const diffColor = scaleHeatColor(task.difficulty).color;
  const impColor = importanceHeatColor(task.importance).color;
  const projColor = projectColorFor(state.projects, task.projectId);
  const elapsed = isActive ? getTimerElapsedSeconds(state) : task.loggedMinutes * 60;

  function handleStart() {
    void startTimer(task!.id).then(() => setTab("focus"));
  }

  function handleComplete() {
    void completeTask(task!.id).then(onClose);
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="void-drawer__tabs void-drawer__tabs--underline">
        <button
          type="button"
          className={`void-drawer__tab void-drawer__tab--underline${tab === "info" ? " void-drawer__tab--active" : ""}`}
          onClick={() => setTab("info")}
        >
          Info
        </button>
        <button
          type="button"
          className={`void-drawer__tab void-drawer__tab--underline${tab === "focus" ? " void-drawer__tab--active" : ""}`}
          onClick={() => setTab("focus")}
        >
          Focus
        </button>
      </div>

      <div className="void-drawer__body">
        {tab === "info" ? (
          <>
            <h2 className="void-drawer__title void-drawer__title--lg">{task.title}</h2>
            <div className="void-task-drawer-colors">
              <TaskIndicators task={task} projectColor={projColor} />
              <span className="void-task-drawer-colors__legend">
                <span style={{ color: projColor ?? "var(--void-outline)" }}>Project</span>
                <span style={{ color: diffColor }}>Difficulty</span>
                <span style={{ color: impColor }}>Importance</span>
              </span>
            </div>
            {projectName && <p className="void-drawer__desc">{projectName}</p>}
            <p className="void-drawer__desc">{task.description}</p>
            <div className="void-meta-grid">
              <div className="void-meta-item">
                <div className="void-meta-item__label">Difficulty</div>
                <div className="void-meta-item__value" style={{ color: diffColor }}>
                  {task.difficulty}/10
                </div>
              </div>
              <div className="void-meta-item">
                <div className="void-meta-item__label">Importance</div>
                <div className="void-meta-item__value" style={{ color: impColor }}>
                  {task.importance}/10
                </div>
              </div>
              <div className={`void-meta-item${task.priority === "critical" ? " void-meta-item--critical" : ""}`}>
                <div className="void-meta-item__label">Priority</div>
                <div className="void-meta-item__value">{priorityLabel(task.priority)}</div>
              </div>
              <div className="void-meta-item void-meta-item--cyan">
                <div className="void-meta-item__label">Due date</div>
                <div className="void-meta-item__value">
                  <Clock size={18} strokeWidth={2} />
                  {getExpirationLabel(task.dueDate)}
                </div>
              </div>
            </div>
            {task.attachments.length > 0 && (
              <>
                <p className="void-section-title">Attachments</p>
                <div className="void-essence-list">
                  {task.attachments.map((a, i) => (
                    <div key={a} className="void-essence">
                      {i % 2 === 0 ? <FileText size={22} strokeWidth={2} /> : <Paperclip size={22} strokeWidth={2} />}
                      {a}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="void-timer">
            <div className="void-spirit-slot void-spirit-slot--focus">
              <VoidSpirit variant="work" scale="lg" showcase glow />
            </div>
            <motion.div
              className="void-timer__display void-timer__display--glow"
              animate={
                running
                  ? { scale: [1, 1.02, 1], filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatTimerDisplay(elapsed)}
            </motion.div>
            <p className="void-timer__label">
              {running
                ? "Focus session in progress"
                : paused
                  ? "Paused — resume when ready"
                  : "Ready when you are"}
            </p>
            {task.estimatedMinutes > 0 && isActive && (
              <p className="void-timer__estimate">
                {Math.floor(elapsed / 60)} / {task.estimatedMinutes} min estimated
              </p>
            )}
          </div>
        )}
      </div>

      <div className="void-drawer__footer-cta">
        {tab === "info" ? (
          <button type="button" className="void-btn void-btn--initiate" onClick={handleStart}>
            {paused ? "Resume focus timer" : "Start focus timer"}
          </button>
        ) : !isActive ? (
          <button type="button" className="void-btn void-btn--initiate" onClick={handleStart}>
            Start focus timer
          </button>
        ) : paused ? (
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="void-btn void-btn--initiate" onClick={handleStart}>
              Resume timer
            </button>
            <button type="button" className="void-btn void-btn--ghost" onClick={handleComplete}>
              Mark task complete
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="void-btn void-btn--initiate" onClick={handleComplete}>
              Mark task complete
            </button>
            <button type="button" className="void-btn void-btn--ghost" onClick={() => void pauseTimer()}>
              Pause timer
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
