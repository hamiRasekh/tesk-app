/** Persian / Arabic script detection and digit helpers */

const PERSIAN_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasPersianText(text: string): boolean {
  return PERSIAN_RE.test(text);
}

export function resolveInputDir(text: string): "rtl" | "ltr" {
  const trimmed = text.trim();
  if (!trimmed) return "ltr";
  return hasPersianText(trimmed) ? "rtl" : "ltr";
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function formatDateFa(isoDate: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("fa-IR", options);
}
