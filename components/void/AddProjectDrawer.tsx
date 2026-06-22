"use client";

import { useState, type ReactNode } from "react";
import { Network, Rocket, Shield, Circle } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { Drawer } from "./Drawer";
import { useVoid } from "@/lib/void-store";
import { DEFAULT_PROJECT_COLOR } from "@/lib/project-colors";
import type { RealmIcon } from "@/lib/void-types";

type Props = {
  open: boolean;
  onClose: () => void;
};

const realms: { id: RealmIcon; icon: ReactNode }[] = [
  { id: "network", icon: <Network size={22} /> },
  { id: "rocket", icon: <Rocket size={22} /> },
  { id: "shield", icon: <Shield size={22} /> },
  { id: "core", icon: <Circle size={22} /> }
];

export function AddProjectDrawer({ open, onClose }: Props) {
  const { addProject } = useVoid();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [realm, setRealm] = useState<RealmIcon>("network");
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);

  function reset() {
    setName("");
    setDescription("");
    setRealm("network");
    setColor(DEFAULT_PROJECT_COLOR);
  }

  function submit() {
    if (!name.trim()) return;
    void addProject({
      name: name.trim(),
      description: description.trim(),
      color,
      realm,
      level: 1
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
        <p className="void-section-title" style={{ marginBottom: 4 }}>
          New project
        </p>
        <h2 className="void-drawer__title" style={{ marginBottom: 20 }}>
          Organize tasks into a project
        </h2>

        <label className="void-label">Project name</label>
        <input
          className="void-input void-input--pill"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website redesign"
        />

        <label className="void-label">Project color</label>
        <ColorPicker value={color} onChange={setColor} />
        <p className="void-color-hint">Tasks in this project show this color beside them.</p>

        <label className="void-label">Icon style</label>
        <div className="void-realm-row">
          {realms.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`void-realm-btn${realm === r.id ? " void-realm-btn--active" : ""}`}
              style={realm === r.id ? { borderColor: color, color } : undefined}
              onClick={() => setRealm(r.id)}
              aria-label={r.id}
            >
              {r.icon}
            </button>
          ))}
        </div>

        <label className="void-label">Description</label>
        <input
          className="void-input void-input--pill"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
        />
      </div>
      <div className="void-drawer__footer-cta">
        <button type="button" className="void-btn void-btn--initiate" onClick={submit}>
          Create project
        </button>
      </div>
    </Drawer>
  );
}
