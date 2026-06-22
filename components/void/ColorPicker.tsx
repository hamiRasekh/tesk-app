"use client";

import { PROJECT_COLORS } from "@/lib/project-colors";

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="void-color-grid" role="listbox" aria-label="Project color">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="option"
          aria-selected={value === color}
          className={`void-color-swatch${value === color ? " void-color-swatch--active" : ""}`}
          style={{ ["--swatch" as string]: color }}
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
        />
      ))}
    </div>
  );
}
