"use client";

import { Plus } from "lucide-react";

type Props = {
  onClick: () => void;
  label?: string;
};

export function AddTaskFab({ onClick, label = "Add task" }: Props) {
  return (
    <button type="button" className="void-fab" onClick={onClick} aria-label={label}>
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
