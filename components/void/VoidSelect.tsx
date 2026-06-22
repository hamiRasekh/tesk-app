"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type VoidSelectOption = {
  value: string;
  label: string;
  color?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: VoidSelectOption[];
  placeholder?: string;
  className?: string;
};

export function VoidSelect({ value, onChange, options, placeholder = "Select…", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`void-select-field${open ? " void-select-field--open" : ""} ${className}`.trim()}>
      <button
        type="button"
        className="void-select-field__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="void-select-field__value">
          {selected?.color ? <span className="void-select-field__dot" style={{ background: selected.color }} /> : null}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={18} className="void-select-field__chevron" />
      </button>

      {open && (
        <ul id={listId} className="void-select-field__menu" role="listbox">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li key={opt.value || "__none"} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`void-select-field__option${isActive ? " void-select-field__option--active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.color ? <span className="void-select-field__dot" style={{ background: opt.color }} /> : null}
                  <span>{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
