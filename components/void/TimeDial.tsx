"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";

const HOUR_VALUES = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTE_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;

type Mode = "hours" | "minutes";

type Props = {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
};

function pointerToIndex(clientX: number, clientY: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return Math.round(deg / 30) % 12;
}

function valueToIndex(values: readonly number[], value: number) {
  const idx = values.indexOf(value);
  return idx >= 0 ? idx : 0;
}

function handDegrees(index: number) {
  return index * 30;
}

function clockCoords(index: number, radiusPct: number) {
  const rad = ((index * 30 - 90) * Math.PI) / 180;
  return {
    left: `${50 + radiusPct * Math.cos(rad)}%`,
    top: `${50 + radiusPct * Math.sin(rad)}%`
  };
}

export function TimeDial({ hours, minutes, onChange }: Props) {
  const { isFa } = useLocale();
  const faceRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("hours");
  const [dragging, setDragging] = useState(false);

  const values = mode === "hours" ? HOUR_VALUES : MINUTE_VALUES;
  const selected = mode === "hours" ? hours : minutes;
  const selectedIndex =
    mode === "hours"
      ? hours === 0
        ? null
        : valueToIndex(HOUR_VALUES, hours)
      : valueToIndex(MINUTE_VALUES, minutes);

  const pickAt = useCallback(
    (clientX: number, clientY: number) => {
      const face = faceRef.current;
      if (!face) return;
      const idx = pointerToIndex(clientX, clientY, face.getBoundingClientRect());
      if (mode === "hours") {
        onChange(HOUR_VALUES[idx], minutes);
      } else {
        onChange(hours, MINUTE_VALUES[idx]);
      }
    },
    [hours, minutes, mode, onChange]
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    pickAt(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pickAt(e.clientX, e.clientY);
  }

  function onPointerUp() {
    setDragging(false);
  }

  function selectValue(value: number) {
    if (mode === "hours") onChange(value, minutes);
    else onChange(hours, value);
  }

  const total = Math.max(0, hours * 60 + minutes);

  return (
    <div className="void-time-dial-wrap">
      <span className="void-label">{isFa ? "زمان تخمینی" : "Estimated time"}</span>

      <div className="void-clock-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "hours"}
          className={`void-clock-tab${mode === "hours" ? " void-clock-tab--active" : ""}`}
          onClick={() => setMode("hours")}
        >
          <span className="void-clock-tab__label">{isFa ? "ساعت" : "Hours"}</span>
          <span className="void-clock-tab__value">{hours}h</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "minutes"}
          className={`void-clock-tab${mode === "minutes" ? " void-clock-tab--active" : ""}`}
          onClick={() => setMode("minutes")}
        >
          <span className="void-clock-tab__label">{isFa ? "دقیقه" : "Minutes"}</span>
          <span className="void-clock-tab__value">{minutes}m</span>
        </button>
      </div>

      <div
        ref={faceRef}
        className={`void-clock-face${dragging ? " void-clock-face--dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="void-clock-face__ring" aria-hidden="true" />

        {values.map((value, index) => {
          const pos = clockCoords(index, 38);
          const active = selected === value;
          return (
            <button
              key={value}
              type="button"
              className={`void-clock-num${active ? " void-clock-num--active" : ""}`}
              style={{ left: pos.left, top: pos.top }}
              onClick={(e) => {
                e.stopPropagation();
                selectValue(value);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {mode === "minutes" && value === 0 ? "00" : value}
            </button>
          );
        })}

        {selectedIndex !== null && (
          <div
            className="void-clock-hand"
            style={{ transform: `translate(-50%, -100%) rotate(${handDegrees(selectedIndex)}deg)` }}
            aria-hidden="true"
          >
            <span className="void-clock-hand__shaft" />
            <span className="void-clock-hand__tip" />
          </div>
        )}

        <div className="void-clock-face__hub">
          <span className="void-clock-face__total">{total} min</span>
          {mode === "hours" && (
            <button
              type="button"
              className={`void-clock-zero${hours === 0 ? " void-clock-zero--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(0, minutes);
              }}
            >
              0h
            </button>
          )}
        </div>
      </div>

      <p className="void-time-dial__hint">
        {isFa
          ? "عقربه را بچرخانید یا روی عدد بزنید — ساعت ۱ تا ۱۲، دقیقه پله‌های ۵ دقیقه‌ای"
          : "Drag the hand or tap a number — hours 1–12, minutes in 5-min steps"}
      </p>
    </div>
  );
}

export function timeToEstimatedMinutes(hours: number, minutes: number) {
  return Math.max(5, hours * 60 + minutes);
}
