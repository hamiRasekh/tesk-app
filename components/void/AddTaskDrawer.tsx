"use client";

import { useState } from "react";
import { Drawer } from "./Drawer";
import { ScaleSlider } from "./ScaleSlider";
import { TimeDial, timeToEstimatedMinutes } from "./TimeDial";
import { VoidSelect } from "./VoidSelect";
import { useVoid } from "@/lib/void-store";
import { importanceToPriority } from "@/lib/void-utils";
import { toLocalDateStr } from "@/lib/void-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string | null;
  defaultDate?: string;
};

export function AddTaskDrawer({ open, onClose, defaultProjectId = null, defaultDate }: Props) {
  const { state, addTask } = useVoid();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [importance, setImportance] = useState(6);
  const [projectId, setProjectId] = useState<string | "">(defaultProjectId ?? "");
  const [dueDate, setDueDate] = useState(defaultDate ?? toLocalDateStr(new Date()));
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [timeTouched, setTimeTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const estimatedMinutes = timeToEstimatedMinutes(hours, minutes);
  const timeValid = timeTouched && estimatedMinutes >= 5;

  function reset() {
    setTitle("");
    setDescription("");
    setDifficulty(5);
    setImportance(6);
    setProjectId(defaultProjectId ?? "");
    setDueDate(defaultDate ?? toLocalDateStr(new Date()));
    setHours(0);
    setMinutes(0);
    setTimeTouched(false);
    setSaving(false);
  }

  function handleTimeChange(h: number, m: number) {
    setHours(h);
    setMinutes(m);
    setTimeTouched(true);
  }

  async function submit() {
    if (!title.trim() || !timeValid || saving) return;
    setSaving(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority: importanceToPriority(importance),
        difficulty,
        importance,
        projectId: projectId || null,
        dueDate,
        estimatedMinutes,
        attachments: []
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div className="void-drawer__body void-task-form">
        <p className="void-section-title">New task</p>
        <h2 className="void-drawer__title void-task-form__title">Add a task to your day</h2>

        <label className="void-label">Task name</label>
        <input
          className="void-input void-input--pill void-task-form__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
        />

        <label className="void-label">Description</label>
        <input
          className="void-input void-input--pill void-task-form__input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details or notes"
        />

        <label className="void-label">Due date</label>
        <input
          type="date"
          className="void-input void-input--pill void-task-form__input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <ScaleSlider label="Difficulty" value={difficulty} onChange={setDifficulty} />
        <ScaleSlider label="Importance" value={importance} onChange={setImportance} />

        <label className="void-label">Project</label>
        <VoidSelect
          className="void-task-form__select"
          value={projectId}
          onChange={setProjectId}
          placeholder="No project"
          options={[
            { value: "", label: "No project" },
            ...state.projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))
          ]}
        />

        <TimeDial hours={hours} minutes={minutes} onChange={handleTimeChange} />
        {!timeTouched && <p className="void-form-hint void-form-hint--warn">Set estimated time on the dial (required).</p>}
        {timeTouched && estimatedMinutes < 5 && (
          <p className="void-form-hint void-form-hint--warn">Minimum estimate is 5 minutes.</p>
        )}
      </div>
      <div className="void-drawer__footer-cta">
        <button
          type="button"
          className="void-btn void-btn--initiate void-task-form__submit"
          disabled={!title.trim() || !timeValid || saving}
          onClick={() => void submit()}
        >
          {saving ? "Saving…" : "Create task"}
        </button>
      </div>
    </Drawer>
  );
}
