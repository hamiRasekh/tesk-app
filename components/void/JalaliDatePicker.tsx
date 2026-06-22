"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import {
  formatJalaliDate,
  gregorianToJalali,
  jalaliFromIso,
  jalaliMonthLength,
  jalaliToGregorianIso,
  JALALI_MONTHS_FA,
  todayJalali
} from "@/lib/jalali";
import { toPersianDigits } from "@/lib/persian-text";

type Props = {
  value: string;
  onChange: (gregorianIso: string) => void;
  className?: string;
};

export function JalaliDatePicker({ value, onChange, className = "" }: Props) {
  const { usePersianDigits } = useLocale();
  const parsed = useMemo(() => (value ? jalaliFromIso(value) : todayJalali()), [value]);

  const [jy, setJy] = useState(parsed.jy);
  const [jm, setJm] = useState(parsed.jm);
  const [jd, setJd] = useState(parsed.jd);

  useEffect(() => {
    const p = value ? jalaliFromIso(value) : todayJalali();
    setJy(p.jy);
    setJm(p.jm);
    setJd(p.jd);
  }, [value]);

  const years = useMemo(() => {
    const current = todayJalali().jy;
    return Array.from({ length: 11 }, (_, i) => current - 5 + i);
  }, []);

  const daysInMonth = jalaliMonthLength(jy, jm);

  function emit(y: number, m: number, d: number) {
    const clamped = Math.min(d, jalaliMonthLength(y, m));
    setJy(y);
    setJm(m);
    setJd(clamped);
    onChange(jalaliToGregorianIso(y, m, clamped));
  }

  function shiftMonth(delta: number) {
    let nm = jm + delta;
    let ny = jy;
    while (nm < 1) {
      nm += 12;
      ny -= 1;
    }
    while (nm > 12) {
      nm -= 12;
      ny += 1;
    }
    emit(ny, nm, jd);
  }

  const display = formatJalaliDate(jy, jm, jd, usePersianDigits);
  const digit = (n: number) => (usePersianDigits ? toPersianDigits(n) : String(n));

  return (
    <div className={`void-jalali-picker${className ? ` ${className}` : ""}`}>
      <div className="void-jalali-picker__head">
        <button type="button" className="void-jalali-picker__nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronRight size={18} />
        </button>
        <span className="void-jalali-picker__current">{display}</span>
        <button type="button" className="void-jalali-picker__nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="void-jalali-picker__fields">
        <label className="void-jalali-picker__field">
          <span className="void-label">سال</span>
          <select className="void-input void-input--pill" value={jy} onChange={(e) => emit(Number(e.target.value), jm, jd)}>
            {years.map((y) => (
              <option key={y} value={y}>
                {digit(y)}
              </option>
            ))}
          </select>
        </label>
        <label className="void-jalali-picker__field">
          <span className="void-label">ماه</span>
          <select className="void-input void-input--pill" value={jm} onChange={(e) => emit(jy, Number(e.target.value), jd)}>
            {JALALI_MONTHS_FA.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="void-jalali-picker__field">
          <span className="void-label">روز</span>
          <select className="void-input void-input--pill" value={jd} onChange={(e) => emit(jy, jm, Number(e.target.value))}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {digit(d)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function LocaleDatePicker({ value, onChange, className = "" }: Props) {
  const { useJalali } = useLocale();
  if (useJalali) {
    return <JalaliDatePicker value={value} onChange={onChange} className={className} />;
  }
  return (
    <input
      type="date"
      className={`void-input void-input--pill${className ? ` ${className}` : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Format ISO date for display in current locale/calendar */
export function formatLocaleDate(iso: string, useJalali: boolean, usePersianDigits: boolean) {
  if (!iso) return "";
  if (useJalali) {
    const { jy, jm, jd } = gregorianToJalali(iso);
    return formatJalaliDate(jy, jm, jd, usePersianDigits);
  }
  return new Date(iso + "T12:00:00").toLocaleDateString(usePersianDigits ? "fa-IR" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
