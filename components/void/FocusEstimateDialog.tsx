"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import type { Task } from "@/lib/void-types";

type Props = {
  task: Task | null;
  open: boolean;
  onKeepGoing: () => void;
  onComplete: () => void;
};

export function FocusEstimateDialog({ task, open, onKeepGoing, onComplete }: Props) {
  if (!task) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="void-focus-estimate__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onKeepGoing}
          />
          <motion.div
            className="void-focus-estimate"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-estimate-title"
          >
            <button type="button" className="void-focus-estimate__close" onClick={onKeepGoing} aria-label="Dismiss">
              <X size={18} />
            </button>
            <div className="void-focus-estimate__icon">
              <Clock size={28} strokeWidth={2} />
            </div>
            <h2 id="focus-estimate-title" className="void-focus-estimate__title">
              Still working on this?
            </h2>
            <p className="void-focus-estimate__desc">
              You reached your {task.estimatedMinutes}-minute estimate for <strong>{task.title}</strong>. Haven&apos;t
              finished yet?
            </p>
            <div className="void-focus-estimate__actions">
              <button type="button" className="void-btn void-btn--ghost" onClick={onKeepGoing}>
                Keep going
              </button>
              <button type="button" className="void-btn void-btn--initiate" onClick={onComplete}>
                Mark complete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
