"use client";

import { useCallback, useRef, useState } from "react";

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Props = {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
};

export function TimeDial({ hours, minutes, onChange }: Props) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"hours" | "minutes" | null>(null);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const dial = dialRef.current;
      if (!dial) return;
      const rect = dial.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const side: "hours" | "minutes" = x < 0 ? "hours" : "minutes";
      const angle = Math.atan2(y, Math.abs(x) || 0.001);
      const normalized = (angle + Math.PI / 2) / Math.PI;

      if (side === "hours") {
        const h = Math.max(0, Math.min(8, Math.round(normalized * 8)));
        onChange(h, minutes);
      } else {
        const idx = Math.max(0, Math.min(MINUTE_STEPS.length - 1, Math.round(normalized * (MINUTE_STEPS.length - 1))));
        onChange(hours, MINUTE_STEPS[idx]);
      }
      return side;
    },
    [hours, minutes, onChange]
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const side = pick(e.clientX, e.clientY);
    setDragging(side ?? null);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pick(e.clientX, e.clientY);
  }

  function onPointerUp() {
    setDragging(null);
  }

  const total = Math.max(5, hours * 60 + minutes);

  return (
    <div className="void-time-dial-wrap">
      <span className="void-label">Estimated time</span>
      <div
        ref={dialRef}
        className={`void-time-dial${dragging ? ` void-time-dial--${dragging}` : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="void-time-dial__half void-time-dial__half--hours">
          <span className="void-time-dial__side-label">Hours</span>
          <span className="void-time-dial__side-value">{hours}h</span>
        </div>
        <div className="void-time-dial__half void-time-dial__half--minutes">
          <span className="void-time-dial__side-label">Minutes</span>
          <span className="void-time-dial__side-value">{minutes}m</span>
        </div>
        <div className="void-time-dial__center">
          <span className="void-time-dial__total">{total} min</span>
        </div>
        <div className="void-time-dial__ring" aria-hidden="true" />
      </div>
      <p className="void-time-dial__hint">Drag on the left for hours, right for minutes</p>
    </div>
  );
}

export function timeToEstimatedMinutes(hours: number, minutes: number) {
  return Math.max(5, hours * 60 + minutes);
}
