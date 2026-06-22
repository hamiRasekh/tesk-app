"""Real XP, levels, ranks, streaks — earned only from app activity."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.project import Project
from app.models.task import Task
from app.models.user import User

XP_BY_PRIORITY = {"critical": 120, "high": 80, "medium": 50, "low": 30}

RANK_TIERS: list[tuple[int, str, str]] = [
    (1, "AVENO RANK: TIER I", "Discipline Seeker"),
    (5, "AVENO RANK: TIER II", "Focus Apprentice"),
    (10, "AVENO RANK: TIER III", "Task Adept"),
    (15, "AVENO RANK: TIER IV", "Flow Walker"),
    (20, "AVENO RANK: TIER V", "Deep Worker"),
    (30, "AVENO RANK: TIER VI", "Aveno Veteran"),
    (40, "AVENO RANK: TIER VII", "Aveno Master"),
    (50, "AVENO RANK: TIER VIII", "Legend of Focus"),
    (75, "AVENO RANK: TIER IX", "Aveno Paragon"),
    (100, "AVENO RANK: TIER X", "Eternal Focus"),
]


def xp_required_for_level(level: int) -> int:
    """XP needed to advance from `level` to level+1."""
    return max(100, round(100 * (1.18 ** max(0, level - 1))))


def rank_title_for_level(level: int) -> tuple[str, str]:
    rank, title = RANK_TIERS[0][1], RANK_TIERS[0][2]
    for min_level, r, t in RANK_TIERS:
        if level >= min_level:
            rank, title = r, t
    return rank, title


def apply_rank(user: User) -> None:
    rank, title = rank_title_for_level(user.level)
    user.rank = rank
    user.title = title


def award_xp(user: User, amount: int) -> int:
    """Add XP and level up. Returns total XP actually granted."""
    if amount < 1:
        return 0
    user.xp += amount
    while user.xp >= user.xp_to_next:
        user.xp -= user.xp_to_next
        user.level += 1
        user.xp_to_next = xp_required_for_level(user.level)
    apply_rank(user)
    return amount


def xp_for_focus_minutes(minutes: int) -> int:
    return max(1, minutes)


def xp_for_task_completion(task: Task) -> int:
    """Task XP only — focus time is rewarded separately via grant_focus_xp."""
    base = XP_BY_PRIORITY.get(task.priority, 50)
    difficulty_bonus = task.difficulty * 4
    importance_bonus = task.importance * 3
    on_time = 0
    if task.completed_at and task.completed_at.date() <= task.due_date:
        on_time = 20
    return base + difficulty_bonus + importance_bonus + on_time


def streak_bonus(streak: int) -> int:
    if streak < 2:
        return 0
    return min(50, streak * 5)


def record_daily_activity(user: User, activity_day: date) -> int:
    """Update streak; return streak bonus XP (0 if none)."""
    last = user.last_active_date
    bonus = 0
    if last is None:
        user.streak = 1
    elif activity_day == last:
        pass
    elif activity_day == last + timedelta(days=1):
        user.streak += 1
        bonus = streak_bonus(user.streak)
    else:
        user.streak = 1
    user.last_active_date = activity_day
    return bonus


def sync_project_level(project: Project, db: Session) -> None:
    done = (
        db.query(Task)
        .filter(Task.project_id == project.id, Task.status == "done")
        .count()
    )
    project.level = min(99, 1 + done // 2)


def grant_focus_xp(user: User, minutes: int, activity_at: datetime | None = None) -> int:
    when = activity_at or datetime.now(timezone.utc)
    bonus = record_daily_activity(user, when.date())
    total = award_xp(user, xp_for_focus_minutes(minutes))
    if bonus:
        total += award_xp(user, bonus)
    return total


def grant_task_completion_xp(user: User, task: Task) -> int:
    when = task.completed_at or datetime.now(timezone.utc)
    bonus = record_daily_activity(user, when.date() if isinstance(when, datetime) else when)
    total = award_xp(user, xp_for_task_completion(task))
    if bonus:
        total += award_xp(user, bonus)
    return total


def rebuild_user_progression(user: User, db: Session) -> None:
    """Recalculate level/XP/streak from real tasks and focus sessions (fixes seeded accounts)."""
    user.level = 1
    user.xp = 0
    user.xp_to_next = xp_required_for_level(1)
    user.streak = 0
    user.last_active_date = None
    user.completed_tasks = 0
    user.total_focus_minutes = 0

    events: list[tuple[datetime, str, object]] = []

    for session in db.query(FocusSession).filter(FocusSession.user_id == user.id).all():
        events.append((session.ended_at, "focus", session))

    for task in db.query(Task).filter(Task.user_id == user.id, Task.status == "done").all():
        if task.completed_at:
            events.append((task.completed_at, "complete", task))

    events.sort(key=lambda e: e[0])

    for _when, kind, obj in events:
        if kind == "focus":
            session = obj  # type: FocusSession
            grant_focus_xp(user, session.minutes, session.ended_at)
        else:
            task = obj  # type: Task
            grant_task_completion_xp(user, task)

    user.completed_tasks = (
        db.query(Task).filter(Task.user_id == user.id, Task.status == "done").count()
    )
    user.total_focus_minutes = sum(
        s.minutes for s in db.query(FocusSession).filter(FocusSession.user_id == user.id).all()
    ) or sum(t.logged_minutes for t in db.query(Task).filter(Task.user_id == user.id).all())
    apply_rank(user)

    for project in db.query(Project).filter(Project.user_id == user.id).all():
        sync_project_level(project, db)
