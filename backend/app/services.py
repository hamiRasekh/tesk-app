from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


def profile_from_user(user: User) -> dict:
    return {
        "name": user.name,
        "email": user.email,
        "title": user.title,
        "rank": user.rank,
        "streak": user.streak,
        "level": user.level,
        "xp": user.xp,
        "xpToNext": user.xp_to_next,
        "totalFocusMinutes": user.total_focus_minutes,
        "completedTasks": user.completed_tasks,
    }


def project_to_dict(p: Project) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "color": p.color,
        "level": p.level,
        "realm": p.realm,
        "createdAt": p.created_at.isoformat() if p.created_at else date.today().isoformat(),
    }


def task_to_dict(t: Task) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "description": t.description,
        "projectId": str(t.project_id) if t.project_id else None,
        "dueDate": t.due_date.isoformat(),
        "priority": t.priority,
        "difficulty": t.difficulty,
        "importance": t.importance,
        "status": t.status,
        "estimatedMinutes": t.estimated_minutes,
        "loggedMinutes": t.logged_minutes,
        "completedAt": t.completed_at.isoformat() if t.completed_at else None,
        "attachments": t.attachments or [],
        "createdAt": t.created_at.isoformat() if t.created_at else date.today().isoformat(),
    }


def state_from_user(user: User) -> dict:
    return {
        "profile": profile_from_user(user),
        "projects": [project_to_dict(p) for p in user.projects],
        "tasks": [task_to_dict(t) for t in user.tasks],
        "activeTimerTaskId": str(user.active_timer_task_id) if user.active_timer_task_id else None,
        "timerStartedAt": int(user.timer_started_at.timestamp() * 1000) if user.timer_started_at else None,
        "timerAccumulatedSeconds": user.timer_accumulated_seconds or 0,
    }


def timer_elapsed_seconds(user: User) -> int:
    total = user.timer_accumulated_seconds or 0
    if user.timer_started_at:
        total += int((datetime.now(timezone.utc) - user.timer_started_at).total_seconds())
    return max(0, total)


def flush_timer(user: User, task: Task, db: Session, *, completed: bool = False) -> int:
    total_seconds = timer_elapsed_seconds(user)
    if total_seconds < 1:
        user.timer_accumulated_seconds = 0
        user.active_timer_task_id = None
        user.timer_started_at = None
        return 0
    ended = datetime.now(timezone.utc)
    started = ended - timedelta(seconds=total_seconds)
    minutes = log_focus_session(db, user, task, started, ended, completed=completed)
    task.logged_minutes += minutes
    user.total_focus_minutes += minutes
    user.timer_accumulated_seconds = 0
    user.active_timer_task_id = None
    user.timer_started_at = None
    return minutes


def log_focus_session(
    db: Session,
    user: User,
    task: Task,
    started_at: datetime | None,
    ended_at: datetime,
    *,
    completed: bool = False,
) -> int:
    if not started_at:
        return 0
    minutes = max(1, int((ended_at - started_at).total_seconds() // 60))
    project_name = ""
    if task.project_id and task.project:
        project_name = task.project.name
    elif task.project_id:
        project = db.query(Project).filter(Project.id == task.project_id).first()
        project_name = project.name if project else ""

    db.add(
        FocusSession(
            user_id=user.id,
            task_id=task.id,
            project_id=task.project_id,
            task_title=task.title,
            project_name=project_name,
            started_at=started_at,
            ended_at=ended_at,
            minutes=minutes,
            completed=completed,
        )
    )
    return minutes
