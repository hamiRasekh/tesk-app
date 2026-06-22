"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetCalendarDay, isOfflineError } from "@/lib/api";
import { loadCachedCalendarDay, saveCachedCalendarDay } from "@/lib/offline-cache";
import type { CalendarDayData } from "@/lib/void-types";
import { useLocale } from "@/lib/locale";
import { gregorianToJalali, JALALI_MONTHS_FA } from "@/lib/jalali";
import { toPersianDigits } from "@/lib/persian-text";
import { formatMinutes, formatTime } from "@/lib/void-utils";

type Props = {
  date: string;
};

function buildHourlyBuckets(sessions: CalendarDayData["workSessions"]) {
  const buckets = Array.from({ length: 24 }, () => 0);
  sessions.forEach((s) => {
    const hour = new Date(s.startedAt).getHours();
    buckets[hour] += s.minutes;
  });
  return buckets;
}

export function CalendarDayInsight({ date }: Props) {
  const { useJalali, usePersianDigits, isFa } = useLocale();
  const [data, setData] = useState<CalendarDayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offlineView, setOfflineView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = loadCachedCalendarDay(date);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    setOfflineView(false);

    apiGetCalendarDay(date)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          saveCachedCalendarDay(date, d);
          setOfflineView(false);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (isOfflineError(e)) {
          if (cached) {
            setOfflineView(true);
            setError(null);
          } else {
            setError("Offline — no saved report for this day yet.");
          }
          return;
        }
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const hourly = useMemo(() => buildHourlyBuckets(data?.workSessions ?? []), [data]);
  const peakHour = useMemo(() => {
    let max = 0;
    let hour = -1;
    hourly.forEach((m, h) => {
      if (m > max) {
        max = m;
        hour = h;
      }
    });
    return hour >= 0 ? { hour, minutes: max } : null;
  }, [hourly]);
  const maxBucket = Math.max(...hourly, 1);

  const label = useMemo(() => {
    if (useJalali) {
      const { jy, jm, jd } = gregorianToJalali(date);
      const weekday = new Date(date + "T12:00:00").toLocaleDateString("fa-IR", { weekday: "long" });
      const dayPart = usePersianDigits ? toPersianDigits(`${jd} ${JALALI_MONTHS_FA[jm - 1]} ${jy}`) : `${jd} ${JALALI_MONTHS_FA[jm - 1]} ${jy}`;
      return `${weekday} · ${dayPart}`;
    }
    return new Date(date + "T12:00:00").toLocaleDateString(isFa ? "fa-IR" : "en", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }, [date, useJalali, usePersianDigits, isFa]);

  if (loading) {
    return (
      <div className="void-day-insight">
        <p className="void-day-insight__loading">Loading day report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="void-day-insight">
        <p className="void-day-insight__error">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const hasWork = data.workSessions.length > 0;
  const hasCompleted = data.completedTasks.length > 0;
  const hasScheduled = data.scheduledTasks.length > 0;

  return (
    <div className="void-day-insight">
      <div className="void-day-insight__header">
        <div>
          <p className="void-section-title">{label}</p>
          <p className="void-day-insight__sub">
            {offlineView ? "Offline — showing last saved report" : hasWork ? `${formatMinutes(data.totalMinutes)} focused` : "No focus sessions recorded"}
          </p>
        </div>
        {peakHour && (
          <div className="void-day-insight__peak">
            <span className="void-day-insight__peak-label">Peak hour</span>
            <span className="void-day-insight__peak-value">
              {peakHour.hour === 0 ? "12" : peakHour.hour > 12 ? peakHour.hour - 12 : peakHour.hour}
              {peakHour.hour >= 12 ? "pm" : "am"}
            </span>
          </div>
        )}
      </div>

      {hasWork && (
        <>
          <div className="void-hour-chart">
            <p className="void-hour-chart__title">Work by hour</p>
            <div className="void-hour-chart__bars">
              {hourly.map((minutes, hour) => {
                const height = Math.max(4, (minutes / maxBucket) * 100);
                const isPeak = peakHour?.hour === hour && minutes > 0;
                return (
                  <div key={hour} className="void-hour-chart__col" title={`${hour}:00 — ${formatMinutes(minutes)}`}>
                    <div
                      className={`void-hour-chart__bar${isPeak ? " void-hour-chart__bar--peak" : ""}`}
                      style={{ height: `${height}%` }}
                    />
                    {hour % 3 === 0 && <span className="void-hour-chart__tick">{hour}</span>}
                  </div>
                );
              })}
            </div>
            <p className="void-hour-chart__hint">
              {peakHour
                ? `Most focus time logged around ${peakHour.hour}:00 — ${formatMinutes(peakHour.minutes)} total in that hour.`
                : "Bars show minutes logged in each hour of the day."}
            </p>
          </div>

          {data.projectTotals.length > 0 && (
            <div className="void-day-insight__block">
              <p className="void-day-insight__block-title">Hours by project</p>
              {data.projectTotals.map((p) => (
                <div key={p.projectId ?? "none"} className="void-day-insight__project">
                  <span>{p.projectName}</span>
                  <span>{formatMinutes(p.minutes)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="void-day-insight__block">
            <p className="void-day-insight__block-title">Focus sessions</p>
            {data.workSessions.map((s) => (
              <div key={s.id} className="void-day-insight__session">
                <div className="void-day-insight__session-top">
                  <span className="void-day-insight__session-title">{s.taskTitle}</span>
                  {s.completed && <span className="void-day-insight__badge">Done</span>}
                </div>
                <p className="void-day-insight__session-meta">
                  {s.projectName} · {formatTime(s.startedAt)} – {formatTime(s.endedAt)} · {formatMinutes(s.minutes)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {hasCompleted && (
        <div className="void-day-insight__block">
          <p className="void-day-insight__block-title">Completed tasks</p>
          {data.completedTasks.map((t) => (
            <div key={t.id} className="void-day-insight__session">
              <div className="void-day-insight__session-top">
                <span className="void-day-insight__session-title">{t.title}</span>
                <span className="void-day-insight__badge void-day-insight__badge--done">✓</span>
              </div>
              {t.completedAt && (
                <p className="void-day-insight__session-meta">
                  Finished at {formatTime(t.completedAt)} · {formatMinutes(t.loggedMinutes)} total
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasScheduled && (
        <div className="void-day-insight__block">
          <p className="void-day-insight__block-title">Scheduled</p>
          {data.scheduledTasks.map((t) => (
            <div key={t.id} className="void-day-insight__session">
              <span className="void-day-insight__session-title">{t.title}</span>
              <p className="void-day-insight__session-meta">
                {t.status === "done" ? "Completed" : t.status.replace("_", " ")} · est. {formatMinutes(t.estimatedMinutes)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!hasWork && !hasCompleted && !hasScheduled && (
        <p className="void-empty">No tasks or focus time on this day.</p>
      )}
    </div>
  );
}
