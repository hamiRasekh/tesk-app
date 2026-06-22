import * as jalaali from "jalaali-js";
import { toEnglishDigits, toPersianDigits } from "./persian-text";
import { toLocalDateStr } from "./void-utils";

export const JALALI_MONTHS_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
] as const;

/** Week starts Saturday (Iran) */
export const JALALI_WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;
export const GREGORIAN_WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export type JalaliParts = { jy: number; jm: number; jd: number };
export type GregorianParts = { gy: number; gm: number; gd: number };

export type CalendarCell = {
  /** Gregorian ISO date for API / storage */
  date: string;
  /** Day number shown in the cell */
  day: number;
  muted: boolean;
  jalali: JalaliParts;
};

export function gregorianToJalali(date: Date | string): JalaliParts {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function jalaliToGregorianIso(jy: number, jm: number, jd: number): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  return toLocalDateStr(new Date(g.gy, g.gm - 1, g.gd));
}

export function jalaliMonthLength(jy: number, jm: number) {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/** Saturday = 0 … Friday = 6 */
export function iranianWeekdayFromGregorian(date: Date): number {
  return (date.getDay() + 1) % 7;
}

export function getJalaliMonthGrid(jy: number, jm: number): CalendarCell[] {
  const g1 = jalaali.toGregorian(jy, jm, 1);
  const first = new Date(g1.gy, g1.gm - 1, g1.gd);
  const startPad = iranianWeekdayFromGregorian(first);
  const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);

  let prevJy = jy;
  let prevJm = jm - 1;
  if (prevJm < 1) {
    prevJm = 12;
    prevJy -= 1;
  }
  const prevLen = jalaali.jalaaliMonthLength(prevJy, prevJm);

  const cells: CalendarCell[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const jd = prevLen - i;
    const date = jalaliToGregorianIso(prevJy, prevJm, jd);
    cells.push({ date, day: jd, muted: true, jalali: { jy: prevJy, jm: prevJm, jd } });
  }

  for (let jd = 1; jd <= daysInMonth; jd++) {
    const date = jalaliToGregorianIso(jy, jm, jd);
    cells.push({ date, day: jd, muted: false, jalali: { jy, jm, jd } });
  }

  let nextJy = jy;
  let nextJm = jm + 1;
  if (nextJm > 12) {
    nextJm = 1;
    nextJy += 1;
  }
  let nextJd = 1;
  while (cells.length % 7 !== 0) {
    const date = jalaliToGregorianIso(nextJy, nextJm, nextJd);
    cells.push({ date, day: nextJd, muted: true, jalali: { jy: nextJy, jm: nextJm, jd: nextJd } });
    nextJd += 1;
  }

  return cells;
}

export function getGregorianMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -startPad + i + 1);
    const date = toLocalDateStr(d);
    cells.push({
      date,
      day: d.getDate(),
      muted: true,
      jalali: gregorianToJalali(d)
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const date = toLocalDateStr(d);
    cells.push({
      date,
      day,
      muted: false,
      jalali: gregorianToJalali(d)
    });
  }

  while (cells.length % 7 !== 0) {
    const last = new Date(cells[cells.length - 1].date + "T12:00:00");
    last.setDate(last.getDate() + 1);
    const date = toLocalDateStr(last);
    cells.push({
      date,
      day: last.getDate(),
      muted: true,
      jalali: gregorianToJalali(last)
    });
  }

  return cells;
}

export function formatJalaliMonthLabel(jy: number, jm: number, usePersianDigits: boolean) {
  const label = `${JALALI_MONTHS_FA[jm - 1]} ${jy}`;
  return usePersianDigits ? toPersianDigits(label) : label;
}

export function formatJalaliDate(jy: number, jm: number, jd: number, usePersianDigits: boolean) {
  const label = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
  return usePersianDigits ? toPersianDigits(label) : label;
}

export function parseJalaliInput(raw: string): JalaliParts | null {
  const normalized = toEnglishDigits(raw).trim().replace(/-/g, "/");
  const m = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null;
  return { jy, jm, jd };
}

export function todayJalali(): JalaliParts {
  return gregorianToJalali(new Date());
}

export function jalaliFromIso(iso: string): JalaliParts {
  return gregorianToJalali(iso);
}
