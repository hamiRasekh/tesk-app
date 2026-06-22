"use client";

import { useState, type ReactNode } from "react";
import { Network, Rocket, Shield, Circle } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { Drawer } from "./Drawer";
import { VoidInput, VoidTextarea } from "./VoidInput";
import { useVoid } from "@/lib/void-store";
import { useLocale } from "@/lib/locale";
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
  const { isFa } = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [realm, setRealm] = useState<RealmIcon>("network");
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setRealm("network");
    setColor(DEFAULT_PROJECT_COLOR);
    setSaving(false);
    setError(null);
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setError(null);
    try {
      await addProject({
        name: trimmed,
        description: description.trim(),
        color,
        realm,
        level: 1
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isFa ? "خطا در ساخت پروژه" : "Could not create project");
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
      <form
        className="void-drawer__form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="void-drawer__body">
          <p className="void-section-title" style={{ marginBottom: 4 }}>
            New project
          </p>
          <h2 className="void-drawer__title" style={{ marginBottom: 20 }}>
            Organize tasks into a project
          </h2>

          <label className="void-label" htmlFor="project-name">
            Project name
          </label>
          <VoidInput
            id="project-name"
            className="void-input--pill"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website redesign"
            autoComplete="off"
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

          <label className="void-label" htmlFor="project-description">
            Description
          </label>
          <VoidTextarea
            id="project-description"
            className="void-input--pill"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
          />

          {error && <p className="void-form-hint void-form-hint--warn">{error}</p>}
        </div>

        <div className="void-drawer__footer-cta">
          <button
            type="submit"
            className="void-btn void-btn--initiate"
            disabled={!name.trim() || saving}
          >
            {saving ? (isFa ? "در حال ساخت…" : "Creating…") : isFa ? "ساخت پروژه" : "Create project"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
