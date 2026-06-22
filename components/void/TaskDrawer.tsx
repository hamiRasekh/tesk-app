"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, FileText, Paperclip } from "lucide-react";
import { Drawer } from "./Drawer";
import { VoidSpirit } from "./VoidSpirit";
import { useVoid } from "@/lib/void-store";
import type { Task } from "@/lib/void-types";
import { getExpirationLabel, priorityLabel } from "@/lib/void-utils";

type Tab = "info" | "focus";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectName?: string;
};

export function TaskDrawer({ task, open, onClose, projectName }: Props) {
  const { state, startTimer, stopTimer, completeTask } = useVoid();
  const [tab, setTab] = useState<Tab>("info");
  const [elapsed, setElapsed] = useState(0);

  const isActive = task && state.activeTimerTaskId === task.id;

  useEffect(() => {
    if (!isActive || !state.timerStartedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - state.timerStartedAt!) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, state.timerStartedAt]);

  useEffect(() => {
    if (!open) setTab("info");
  }, [open]);

  if (!task) return null;

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
            <p className="void-drawer__desc">{task.description}</p>
            <div className="void-meta-grid">
              <div className={`void-meta-item${task.priority === "critical" ? " void-meta-item--critical" : ""}`}>
                <div className="void-meta-item__label">Priority</div>
                <div className="void-meta-item__value">{priorityLabel(task.priority)}</div>
              </div>
              <div className="void-meta-item void-meta-item--cyan">
                <div className="void-meta-item__label">Expiration</div>
                <div className="void-meta-item__value">
                  <Clock size={14} />
                  {getExpirationLabel(task.dueDate)}
                </div>
              </div>
            </div>
            {task.attachments.length > 0 && (
              <>
                <p className="void-section-title">Attached Essences</p>
                <div className="void-essence-list">
                  {task.attachments.map((a, i) => (
                    <div key={a} className="void-essence">
                      {i % 2 === 0 ? <FileText size={18} /> : <Paperclip size={18} />}
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
                isActive
                  ? { scale: [1, 1.02, 1], filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatTime(isActive ? elapsed : task.loggedMinutes * 60)}
            </motion.div>
            <p className="void-timer__label">{isActive ? "Spirit channeling focus" : "Prepare your ritual"}</p>
          </div>
        )}
      </div>

      <div className="void-drawer__footer-cta">
        {tab === "info" ? (
          <button type="button" className="void-btn void-btn--initiate" onClick={handleStart}>
            Start Working
          </button>
        ) : !isActive ? (
          <button type="button" className="void-btn void-btn--initiate" onClick={handleStart}>
            Initiate Focus
          </button>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" className="void-btn void-btn--initiate" onClick={handleComplete}>
              Complete Quest
            </button>
                  <button type="button" className="void-btn void-btn--ghost" onClick={() => void stopTimer()}>
              Pause Ritual
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
