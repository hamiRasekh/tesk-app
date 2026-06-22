"use client";

import { useState, type ReactNode } from "react";
import { Network, Rocket, Shield, Circle } from "lucide-react";
import { Drawer } from "./Drawer";
import { useVoid } from "@/lib/void-store";
import type { RealmIcon } from "@/lib/void-types";

type Props = {
  open: boolean;
  onClose: () => void;
};

const realms: { id: RealmIcon; icon: ReactNode; color: string }[] = [
  { id: "network", icon: <Network size={22} />, color: "#8b5cf6" },
  { id: "rocket", icon: <Rocket size={22} />, color: "#2dd4bf" },
  { id: "shield", icon: <Shield size={22} />, color: "#a78bfa" },
  { id: "core", icon: <Circle size={22} />, color: "#cfbdff" }
];

export function AddProjectDrawer({ open, onClose }: Props) {
  const { addProject } = useVoid();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [realm, setRealm] = useState<RealmIcon>("network");

  const selectedRealm = realms.find((r) => r.id === realm)!;

  function reset() {
    setName("");
    setDescription("");
    setRealm("network");
  }

  function submit() {
    if (!name.trim()) return;
    void addProject({
      name: name.trim(),
      description: description.trim(),
      color: selectedRealm.color,
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
          Forge New Quest
        </p>
        <h2 className="void-drawer__title" style={{ fontSize: "1.1rem", marginBottom: 20 }}>
          Create a new realm
        </h2>

        <label className="void-label">Quest Name</label>
        <input
          className="void-input void-input--pill"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter quest name..."
        />

        <label className="void-label">Spirit Realm</label>
        <div className="void-realm-row">
          {realms.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`void-realm-btn${realm === r.id ? " void-realm-btn--active" : ""}`}
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
          placeholder="What is this quest about?"
        />
      </div>
      <div className="void-drawer__footer-cta">
        <button type="button" className="void-btn void-btn--initiate" onClick={submit}>
          Initiate Forging
        </button>
      </div>
    </Drawer>
  );
}
