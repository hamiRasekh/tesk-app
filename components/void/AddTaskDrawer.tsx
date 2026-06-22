"use client";

import { useState } from "react";
import { Drawer } from "./Drawer";
import { useVoid } from "@/lib/void-store";
import type { Priority } from "@/lib/void-types";

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
  const [priority, setPriority] = useState<Priority>("medium");
  const [projectId, setProjectId] = useState<string | "">(defaultProjectId ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState("45");

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setProjectId(defaultProjectId ?? "");
    setEstimatedMinutes("45");
  }

  function submit() {
    if (!title.trim()) return;
    void addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      projectId: projectId || null,
      dueDate: defaultDate ?? new Date().toISOString().slice(0, 10),
      estimatedMinutes: Number(estimatedMinutes) || 30,
      attachments: []
    }).then(() => {
      reset();
      onClose();
    });
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div className="void-drawer__body">
        <p className="void-section-title">Summon Task</p>
        <h2 className="void-drawer__title" style={{ marginBottom: 16 }}>
          New quest for today
        </h2>

        <label className="void-label">Quest Name</label>
        <input className="void-input void-input--pill" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter task name..." />

        <label className="void-label">Protocol</label>
        <input
          className="void-input void-input--pill"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What must be done?"
        />

        <label className="void-label">Priority</label>
        <select className="void-select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <label className="void-label">Realm / Project</label>
        <select className="void-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No realm</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label className="void-label">Duration (min)</label>
        <input
          className="void-input void-input--pill"
          type="number"
          min={5}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(e.target.value)}
        />
      </div>
      <div className="void-drawer__footer-cta">
        <button type="button" className="void-btn void-btn--initiate" onClick={submit}>
          Initiate Quest
        </button>
      </div>
    </Drawer>
  );
}
