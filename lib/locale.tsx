"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type AppLocale = "en" | "fa";
export type CalendarSystem = "gregorian" | "jalali";

const LOCALE_KEY = "aveno-locale";
const CALENDAR_KEY = "aveno-calendar";

type LocaleContextValue = {
  locale: AppLocale;
  calendar: CalendarSystem;
  isFa: boolean;
  useJalali: boolean;
  usePersianDigits: boolean;
  setLocale: (locale: AppLocale) => void;
  setCalendar: (calendar: CalendarSystem) => void;
  toggleCalendar: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("fa") || lang.startsWith("prs")) return "fa";
  return "en";
}

function initialLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "fa" || stored === "en") return stored;
  return detectBrowserLocale();
}

function initialCalendar(locale: AppLocale): CalendarSystem {
  if (typeof window === "undefined") return locale === "fa" ? "jalali" : "gregorian";
  const stored = localStorage.getItem(CALENDAR_KEY);
  if (stored === "jalali" || stored === "gregorian") return stored;
  return locale === "fa" ? "jalali" : "gregorian";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [calendar, setCalendarState] = useState<CalendarSystem>(() => initialCalendar(initialLocale()));

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
  }, []);

  const setCalendar = useCallback((next: CalendarSystem) => {
    setCalendarState(next);
    localStorage.setItem(CALENDAR_KEY, next);
  }, []);

  const toggleCalendar = useCallback(() => {
    setCalendarState((prev) => {
      const next = prev === "jalali" ? "gregorian" : "jalali";
      localStorage.setItem(CALENDAR_KEY, next);
      return next;
    });
  }, []);

  const isFa = locale === "fa";
  const useJalali = calendar === "jalali";
  const usePersianDigits = isFa;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      calendar,
      isFa,
      useJalali,
      usePersianDigits,
      setLocale,
      setCalendar,
      toggleCalendar
    }),
    [locale, calendar, isFa, useJalali, usePersianDigits, setLocale, setCalendar, toggleCalendar]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
