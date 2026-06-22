"use client";

import { useCallback, useRef } from "react";
import { scaleHeatColor } from "@/lib/void-utils";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function ScaleSlider({ label, value, onChange, min = 1, max = 10 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const heat = scaleHeatColor(value, min, max);

  const pick = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const next = Math.round(min + ratio * (max - min));
      onChange(next);
    },
    [max, min, onChange]
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pick(e.clientX);
  }

  const thumbPct = ((value - min) / (max - min)) * 100;
  const tickCount = max - min + 1;

  return (
    <div className="void-scale">
      <div className="void-scale__head">
        <span className="void-scale__label">{label}</span>
        <span className="void-scale__value" style={{ color: heat.color }}>
          {value}
        </span>
      </div>
      <div
        ref={trackRef}
        className="void-scale__track"
        style={{ borderColor: heat.border }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className="void-scale__fill" style={{ width: `${thumbPct}%`, background: heat.fill }} />
        <div className="void-scale__ticks" style={{ gridTemplateColumns: `repeat(${tickCount}, 1fr)` }}>
          {Array.from({ length: tickCount }, (_, i) => min + i).map((n) => (
            <button
              key={n}
              type="button"
              className={`void-scale__tick${n === value ? " void-scale__tick--active" : ""}`}
              style={n === value ? { ["--tick-color" as string]: heat.color } : undefined}
              onClick={() => onChange(n)}
              aria-label={`${label} ${n}`}
            />
          ))}
        </div>
        <div
          className="void-scale__thumb"
          style={{ left: `${thumbPct}%`, background: heat.thumb, boxShadow: heat.glow }}
        />
      </div>
    </div>
  );
}
