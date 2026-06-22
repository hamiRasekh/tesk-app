"use client";

import { useMemo } from "react";
import {
  formatJalaliMonthLabel,
  getGregorianMonthGrid,
  getJalaliMonthGrid,
  GREGORIAN_WEEKDAYS_EN,
  gregorianToJalali,
  JALALI_WEEKDAYS_FA,
  type CalendarCell
} from "@/lib/jalali";
import { toPersianDigits } from "@/lib/persian-text";

type GridProps = {
  viewYear: number;
  viewMonth: number;
  viewJy: number;
  viewJm: number;
  useJalali: boolean;
  usePersianDigits: boolean;
  today: string;
  selectedDate: string;
  activityByDate: Record<string, number>;
  onSelectDate: (date: string) => void;
};

export function VoidCalendarGrid({
  useJalali,
  usePersianDigits,
  today,
  selectedDate,
  activityByDate,
  onSelectDate,
  viewYear,
  viewMonth,
  viewJy,
  viewJm
}: GridProps) {
  const grid: CalendarCell[] = useMemo(() => {
    if (useJalali) return getJalaliMonthGrid(viewJy, viewJm);
    return getGregorianMonthGrid(viewYear, viewMonth);
  }, [useJalali, viewJy, viewJm, viewYear, viewMonth]);

  const weekdays = useJalali ? JALALI_WEEKDAYS_FA : GREGORIAN_WEEKDAYS_EN;
  const showDay = (n: number) => (usePersianDigits ? toPersianDigits(n) : String(n));

  return (
    <div className="void-calendar">
      {weekdays.map((d) => (
        <div key={d} className="void-calendar__head">
          {d}
        </div>
      ))}
      {grid.map((cell) => {
        const count = activityByDate[cell.date] ?? 0;
        const isTodayCell = cell.date === today;
        const isSelected = cell.date === selectedDate;
        return (
          <button
            key={cell.date + cell.day}
            type="button"
            className={`void-calendar__day${cell.muted ? " void-calendar__day--muted" : ""}${isTodayCell ? " void-calendar__day--today" : ""}${isSelected ? " void-calendar__day--selected" : ""}${count > 0 ? " void-calendar__day--active" : ""}`}
            onClick={() => onSelectDate(cell.date)}
          >
            <span className="void-calendar__num">{showDay(cell.day)}</span>
            {count > 0 && (
              <span className="void-calendar__dots">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <span key={i} className="void-calendar__dot" />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CalendarMonthHeader({
  monthLabel,
  onPrevMonth,
  onNextMonth,
  useJalali,
  onToggleCalendar
}: {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  useJalali: boolean;
  onToggleCalendar?: () => void;
}) {
  return (
    <div className="void-section-head">
      <h2 className="void-section-head__title void-section-head__title--fa">{monthLabel}</h2>
      <div className="void-calendar-nav">
        {onToggleCalendar && (
          <button type="button" className="void-calendar-nav__mode" onClick={onToggleCalendar}>
            {useJalali ? "شمسی" : "میلادی"}
          </button>
        )}
        <button type="button" className="void-calendar-nav__btn" onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <button type="button" className="void-calendar-nav__btn" onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
      </div>
    </div>
  );
}

export function buildMonthLabel(
  useJalali: boolean,
  usePersianDigits: boolean,
  viewYear: number,
  viewMonth: number,
  viewJy: number,
  viewJm: number
) {
  if (useJalali) return formatJalaliMonthLabel(viewJy, viewJm, usePersianDigits);
  return new Date(viewYear, viewMonth).toLocaleString(usePersianDigits ? "fa-IR" : "en", {
    month: "long",
    year: "numeric"
  });
}

export function initCalendarState() {
  const now = new Date();
  const j = gregorianToJalali(now);
  return {
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
    viewJy: j.jy,
    viewJm: j.jm
  };
}
