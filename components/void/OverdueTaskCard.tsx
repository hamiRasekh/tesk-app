"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, Play } from "lucide-react";
import type { Task } from "@/lib/void-types";
import { isDueYesterday } from "@/lib/task-filters";
import { toLocalDateStr } from "@/lib/void-utils";
import { useVoid } from "@/lib/void-store";
import { LocaleDatePicker } from "./JalaliDatePicker";

type Props = {
  task: Task;
  onOpen: () => void;
};

export function OverdueTaskCard({ task, onOpen }: Props) {
  const { updateTask } = useVoid();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(toLocalDateStr(new Date()));
  const [saving, setSaving] = useState(false);

  const yesterday = isDueYesterday(task);
  const label = yesterday ? "Due yesterday — not finished" : `Overdue since ${task.dueDate}`;

  async function handleDoNow() {
    setSaving(true);
    try {
      await updateTask(task.id, { dueDate: toLocalDateStr(new Date()), status: "in_progress" });
      onOpen();
    } finally {
      setSaving(false);
    }
  }

  async function handleReschedule() {
    if (!newDate) return;
    setSaving(true);
    try {
      await updateTask(task.id, { dueDate: newDate });
      setRescheduleOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="void-overdue-card">
      <div className="void-overdue-card__icon">
        <AlertTriangle size={20} strokeWidth={2} />
      </div>
      <div className="void-overdue-card__body">
        <p className="void-overdue-card__label">{label}</p>
        <p className="void-overdue-card__title">{task.title}</p>
        <p className="void-overdue-card__hint">
          {yesterday
            ? "You planned this for yesterday. Finish it now or move it to another day."
            : "This task is past due. Start now or pick a new date."}
        </p>
        {!rescheduleOpen ? (
          <div className="void-overdue-card__actions">
            <button type="button" className="void-btn void-btn--initiate void-overdue-card__btn" disabled={saving} onClick={() => void handleDoNow()}>
              <Play size={16} />
              Do it now
            </button>
            <button type="button" className="void-btn void-btn--ghost void-overdue-card__btn" disabled={saving} onClick={() => setRescheduleOpen(true)}>
              <Calendar size={16} />
              Reschedule
            </button>
          </div>
        ) : (
          <div className="void-overdue-card__reschedule">
            <LocaleDatePicker value={newDate} onChange={setNewDate} />
            <div className="void-overdue-card__actions">
              <button type="button" className="void-btn void-btn--initiate void-overdue-card__btn" disabled={saving} onClick={() => void handleReschedule()}>
                Save date
              </button>
              <button type="button" className="void-btn void-btn--ghost void-overdue-card__btn" onClick={() => setRescheduleOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
