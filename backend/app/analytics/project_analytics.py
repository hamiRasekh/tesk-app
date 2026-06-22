"""Project analytics — formulas and aggregations for Aveno."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from statistics import mean, pstdev
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.project import Project
from app.models.task import Task
from app.services import project_to_dict, task_to_dict

PERIOD_DAYS = {
    "week": 7,
    "month": 30,
    "quarter": 90,
    "year": 365,
    "all": None,
}


def _parse_period(period: str, date_from: date | None, date_to: date | None) -> tuple[date, date]:
    today = datetime.now(timezone.utc).date()
    if date_from and date_to:
        return date_from, date_to
    days = PERIOD_DAYS.get(period, 7)
    if days is None:
        return date(2020, 1, 1), today
    return today - timedelta(days=days - 1), today


def _expected_minutes_for_difficulty(difficulty: int, estimated: int) -> int:
    """Blend user estimate with difficulty baseline (difficulty 1→15m, 10→150m)."""
    baseline = difficulty * 15
    return max(5, round(estimated * 0.6 + baseline * 0.4))


def _calibration_label(ratio: float) -> str:
    if ratio < 0.75:
        return "overestimated"
    if ratio > 1.35:
        return "underestimated"
    if ratio > 1.15:
        return "slightly_harder"
    if ratio < 0.9:
        return "slightly_easier"
    return "accurate"


def _spirit_score(
    completion_rate: float,
    focus_consistency: float,
    estimation_accuracy: float,
    velocity: float,
) -> int:
    """Composite 0–100 score weighting completion, consistency, estimates, momentum."""
    raw = (
        completion_rate * 0.35
        + focus_consistency * 0.25
        + estimation_accuracy * 0.25
        + min(velocity, 1.0) * 0.15
    )
    return max(0, min(100, round(raw * 100)))


def build_project_analytics(
    db: Session,
    project: Project,
    *,
    period: str = "week",
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    start, end = _parse_period(period, date_from, date_to)
    start_dt = datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    tasks: list[Task] = (
        db.query(Task).filter(Task.project_id == project.id, Task.user_id == project.user_id).all()
    )
    sessions: list[FocusSession] = (
        db.query(FocusSession)
        .filter(
            FocusSession.project_id == project.id,
            FocusSession.user_id == project.user_id,
            FocusSession.started_at >= start_dt,
            FocusSession.started_at < end_dt,
        )
        .order_by(FocusSession.started_at.asc())
        .all()
    )

    # --- Time series (daily buckets) ---
    daily_minutes: dict[str, int] = defaultdict(int)
    hourly_minutes = [0] * 24
    d = start
    while d <= end:
        daily_minutes[d.isoformat()] = 0
        d += timedelta(days=1)
    for s in sessions:
        day_key = s.started_at.date().isoformat()
        if day_key in daily_minutes:
            daily_minutes[day_key] += s.minutes
        hourly_minutes[s.started_at.hour] += s.minutes

    time_series = [{"date": k, "minutes": v} for k, v in sorted(daily_minutes.items())]
    total_focus = sum(s.minutes for s in sessions)
    active_days = sum(1 for v in daily_minutes.values() if v > 0)
    avg_per_active_day = round(total_focus / active_days) if active_days else 0

    # --- Weekly rollup when range > 14 days ---
    weekly: list[dict] = []
    if (end - start).days > 14:
        week_buckets: dict[str, int] = defaultdict(int)
        for s in sessions:
            iso = s.started_at.isocalendar()
            key = f"{iso.year}-W{iso.week:02d}"
            week_buckets[key] += s.minutes
        weekly = [{"week": k, "minutes": v} for k, v in sorted(week_buckets.items())]

    # --- Task stats ---
    done_tasks = [t for t in tasks if t.status == "done"]
    open_tasks = [t for t in tasks if t.status != "done"]
    completion_rate = len(done_tasks) / len(tasks) if tasks else 0.0

    # --- Difficulty analysis ---
    difficulty_buckets: dict[int, dict] = {}
    calibration_rows: list[dict] = []

    for t in done_tasks:
        if t.logged_minutes <= 0:
            continue
        expected = _expected_minutes_for_difficulty(t.difficulty, t.estimated_minutes)
        ratio = t.logged_minutes / max(expected, 1)
        label = _calibration_label(ratio)

        if t.difficulty not in difficulty_buckets:
            difficulty_buckets[t.difficulty] = {
                "difficulty": t.difficulty,
                "taskCount": 0,
                "totalLogged": 0,
                "totalExpected": 0,
                "ratios": [],
            }
        b = difficulty_buckets[t.difficulty]
        b["taskCount"] += 1
        b["totalLogged"] += t.logged_minutes
        b["totalExpected"] += expected
        b["ratios"].append(ratio)

        calibration_rows.append(
            {
                "taskId": str(t.id),
                "title": t.title,
                "difficulty": t.difficulty,
                "importance": t.importance,
                "estimatedMinutes": t.estimated_minutes,
                "expectedMinutes": expected,
                "loggedMinutes": t.logged_minutes,
                "ratio": round(ratio, 2),
                "calibration": label,
                "completedAt": t.completed_at.isoformat() if t.completed_at else None,
            }
        )

    difficulty_breakdown = []
    for d_level in sorted(difficulty_buckets.keys()):
        b = difficulty_buckets[d_level]
        avg_ratio = mean(b["ratios"]) if b["ratios"] else 1.0
        difficulty_breakdown.append(
            {
                "difficulty": d_level,
                "taskCount": b["taskCount"],
                "avgLoggedMinutes": round(b["totalLogged"] / b["taskCount"]),
                "avgExpectedMinutes": round(b["totalExpected"] / b["taskCount"]),
                "avgRatio": round(avg_ratio, 2),
                "calibration": _calibration_label(avg_ratio),
            }
        )

    # Estimation accuracy: % of tasks within ±15% of expected
    accurate_count = sum(1 for r in calibration_rows if 0.85 <= r["ratio"] <= 1.15)
    estimation_accuracy = accurate_count / len(calibration_rows) if calibration_rows else 0.5

    # Focus consistency: inverse of coefficient of variation of daily minutes (on active days)
    daily_vals = [v for v in daily_minutes.values() if v > 0]
    if len(daily_vals) >= 2:
        avg_d = mean(daily_vals)
        std_d = pstdev(daily_vals)
        cv = std_d / avg_d if avg_d else 1.0
        focus_consistency = max(0.0, min(1.0, 1.0 - cv * 0.5))
    elif len(daily_vals) == 1:
        focus_consistency = 0.7
    else:
        focus_consistency = 0.0

    # Velocity: completions in period vs total open backlog
    completions_in_period = sum(
        1
        for t in done_tasks
        if t.completed_at and start <= t.completed_at.date() <= end
    )
    velocity = min(1.0, completions_in_period / max(len(open_tasks) + completions_in_period, 1))

    spirit_score = _spirit_score(completion_rate, focus_consistency, estimation_accuracy, velocity)

    # Priority & status distribution
    priority_dist = {p: sum(1 for t in tasks if t.priority == p) for p in ("critical", "high", "medium", "low")}
    status_dist = {s: sum(1 for t in tasks if t.status == s) for s in ("pending", "in_progress", "done")}

    # Importance vs difficulty scatter data
    scatter = [
        {
            "taskId": str(t.id),
            "title": t.title,
            "difficulty": t.difficulty,
            "importance": t.importance,
            "loggedMinutes": t.logged_minutes,
            "status": t.status,
        }
        for t in tasks
    ]

    peak_hour = hourly_minutes.index(max(hourly_minutes)) if any(hourly_minutes) else -1

    insights: list[str] = []
    if difficulty_breakdown:
        hardest = max(difficulty_breakdown, key=lambda x: x["avgRatio"])
        if hardest["avgRatio"] > 1.2:
            insights.append(
                f"Difficulty {hardest['difficulty']} tasks took {int((hardest['avgRatio'] - 1) * 100)}% longer than expected on average."
            )
        easiest = min(difficulty_breakdown, key=lambda x: x["avgRatio"])
        if easiest["avgRatio"] < 0.85 and easiest["taskCount"] >= 2:
            insights.append(f"You finish difficulty {easiest['difficulty']} tasks faster than you estimate.")

    if peak_hour >= 0 and max(hourly_minutes) > 0:
        insights.append(f"Peak focus hour for this project: {peak_hour}:00–{peak_hour + 1}:00.")

    if completion_rate >= 0.8 and len(tasks) >= 3:
        insights.append("Strong completion rate — you're closing most tasks in this project.")
    elif len(open_tasks) >= 5:
        insights.append(f"{len(open_tasks)} tasks still open — consider breaking down the hardest ones.")

    underest = sum(1 for r in calibration_rows if r["calibration"] in ("underestimated", "slightly_harder"))
    if underest >= 3:
        insights.append(f"{underest} tasks took longer than expected — bump difficulty ratings or time estimates.")

    return {
        "project": project_to_dict(project),
        "period": {"key": period, "from": start.isoformat(), "to": end.isoformat()},
        "summary": {
            "spiritScore": spirit_score,
            "totalFocusMinutes": total_focus,
            "activeDays": active_days,
            "avgMinutesPerActiveDay": avg_per_active_day,
            "tasksTotal": len(tasks),
            "tasksDone": len(done_tasks),
            "tasksOpen": len(open_tasks),
            "completionRate": round(completion_rate * 100, 1),
            "completionsInPeriod": completions_in_period,
            "estimationAccuracy": round(estimation_accuracy * 100, 1),
            "focusConsistency": round(focus_consistency * 100, 1),
            "peakHour": peak_hour,
        },
        "timeSeries": time_series,
        "weeklySeries": weekly,
        "hourlyDistribution": [{"hour": h, "minutes": m} for h, m in enumerate(hourly_minutes)],
        "difficultyBreakdown": difficulty_breakdown,
        "taskCalibration": sorted(calibration_rows, key=lambda x: x["ratio"], reverse=True),
        "priorityDistribution": priority_dist,
        "statusDistribution": status_dist,
        "taskScatter": scatter,
        "insights": insights[:5],
        "tasks": [task_to_dict(t) for t in tasks],
    }
