"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, CheckCircle2 } from "lucide-react";
import { useVoid } from "@/lib/void-store";
import { APP_NAME } from "@/lib/brand";
import {
  formatTimerDisplay,
  getTimerElapsedSeconds,
  isTimerPaused,
  isTimerRunning,
  timerProgress
} from "@/lib/focus-timer";

export function FocusSessionBar() {
  const { state, startTimer, pauseTimer, completeTask } = useVoid();
  const [tick, setTick] = useState(0);

  const taskId = state.activeTimerTaskId;
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : null;
  const running = isTimerRunning(state);
  const paused = isTimerPaused(state);
  const visible = !!task;

  useEffect(() => {
    if (!visible || !running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [visible, running]);

  if (!visible || !task) return null;

  const elapsed = getTimerElapsedSeconds(state);
  const progress = timerProgress(elapsed, task.estimatedMinutes);
  const ringDeg = Math.round(progress * 360);

  return (
    <AnimatePresence>
      <motion.div
        className="void-focus-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        role="status"
        aria-live="polite"
        aria-label={running ? "Focus session in progress" : "Focus session paused"}
      >
        <div
          className="void-focus-bar__ring"
          style={{ background: `conic-gradient(var(--void-accent) ${ringDeg}deg, rgba(255,255,255,0.08) 0deg)` }}
          aria-hidden="true"
        >
          <div className="void-focus-bar__ring-inner">
            <span className="void-focus-bar__time">{formatTimerDisplay(elapsed)}</span>
          </div>
        </div>

        <div className="void-focus-bar__body">
          <div className="void-focus-bar__eyebrow">
            <span className={`void-focus-bar__dot${running ? " void-focus-bar__dot--live" : ""}`} />
            {running ? `Timing on ${APP_NAME}` : "Paused"}
          </div>
          <p className="void-focus-bar__title">{task.title}</p>
          {task.estimatedMinutes > 0 && (
            <p className="void-focus-bar__meta">
              {Math.floor(elapsed / 60)} / {task.estimatedMinutes} min
            </p>
          )}
        </div>

        <div className="void-focus-bar__actions">
          {paused ? (
            <button
              type="button"
              className="void-focus-bar__btn void-focus-bar__btn--primary"
              onClick={() => void startTimer(task.id)}
              aria-label="Resume timer"
            >
              <Play size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              className="void-focus-bar__btn"
              onClick={() => void pauseTimer()}
              aria-label="Pause timer"
            >
              <Pause size={18} strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            className="void-focus-bar__btn void-focus-bar__btn--done"
            onClick={() => void completeTask(task.id)}
            aria-label="Mark task complete"
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
