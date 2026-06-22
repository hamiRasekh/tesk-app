from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.focus_session import FocusSession
from app.models.task import Task
from app.models.user import User
from app.services import task_to_dict

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def session_to_dict(s: FocusSession) -> dict:
    return {
        "id": str(s.id),
        "taskId": str(s.task_id),
        "taskTitle": s.task_title,
        "projectId": str(s.project_id) if s.project_id else None,
        "projectName": s.project_name or "No project",
        "startedAt": s.started_at.isoformat(),
        "endedAt": s.ended_at.isoformat(),
        "minutes": s.minutes,
        "completed": s.completed,
    }


@router.get("/day/{day}")
def calendar_day(day: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        target = date.fromisoformat(day)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    day_start = datetime.combine(target, datetime.min.time(), tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    sessions = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.started_at >= day_start,
            FocusSession.started_at < day_end,
        )
        .order_by(FocusSession.started_at.asc())
        .all()
    )

    scheduled = db.query(Task).filter(Task.user_id == user.id, Task.due_date == target).all()

    completed = (
        db.query(Task)
        .filter(
            Task.user_id == user.id,
            Task.status == "done",
            func.date(Task.completed_at) == target,
        )
        .all()
    )

    project_totals: dict[str, dict] = {}
    for s in sessions:
        key = str(s.project_id) if s.project_id else "none"
        if key not in project_totals:
            project_totals[key] = {
                "projectId": str(s.project_id) if s.project_id else None,
                "projectName": s.project_name or "No project",
                "minutes": 0,
            }
        project_totals[key]["minutes"] += s.minutes

    return {
        "date": day,
        "scheduledTasks": [task_to_dict(t) for t in scheduled],
        "completedTasks": [task_to_dict(t) for t in completed],
        "workSessions": [session_to_dict(s) for s in sessions],
        "projectTotals": sorted(project_totals.values(), key=lambda x: x["minutes"], reverse=True),
        "totalMinutes": sum(s.minutes for s in sessions),
    }
