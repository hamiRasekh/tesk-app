from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services import XP_BY_PRIORITY, award_xp, state_from_user, task_to_dict

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
def list_tasks(user: User = Depends(get_current_user)) -> list[dict]:
    return [task_to_dict(t) for t in user.tasks]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    project_id = None
    if payload.project_id:
        try:
            project_id = UUID(payload.project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project id")
        if not db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first():
            raise HTTPException(status_code=404, detail="Project not found")

    task = Task(
        user_id=user.id,
        project_id=project_id,
        title=payload.title.strip(),
        description=payload.description,
        due_date=date.fromisoformat(payload.due_date),
        priority=payload.priority,
        estimated_minutes=payload.estimated_minutes,
        attachments=payload.attachments,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_dict(task)


@router.patch("/{task_id}")
def update_task(
    task_id: UUID, payload: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.model_dump(exclude_unset=True, by_alias=False)
    if "project_id" in data:
        pid = data.pop("project_id")
        if pid is None:
            task.project_id = None
        else:
            try:
                project_id = UUID(pid)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid project id")
            if not db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first():
                raise HTTPException(status_code=404, detail="Project not found")
            task.project_id = project_id
    if "due_date" in data and data["due_date"]:
        task.due_date = date.fromisoformat(data.pop("due_date"))
    for key in ("title", "description", "priority", "status", "estimated_minutes", "logged_minutes", "attachments"):
        if key in data:
            setattr(task, key, data[key])

    db.commit()
    db.refresh(task)
    return task_to_dict(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.post("/{task_id}/timer/start")
def start_timer(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "in_progress"
    user.active_timer_task_id = task.id
    user.timer_started_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return state_from_user(user)


@router.post("/{task_id}/timer/stop")
def stop_timer(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.active_timer_task_id == task.id and user.timer_started_at:
        elapsed = int((datetime.now(timezone.utc) - user.timer_started_at).total_seconds() // 60)
        task.logged_minutes += max(0, elapsed)
        user.total_focus_minutes += max(0, elapsed)
    user.active_timer_task_id = None
    user.timer_started_at = None
    db.commit()
    db.refresh(user)
    return state_from_user(user)


@router.post("/{task_id}/complete")
def complete_task(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.active_timer_task_id == task.id and user.timer_started_at:
        elapsed = int((datetime.now(timezone.utc) - user.timer_started_at).total_seconds() // 60)
        task.logged_minutes += max(0, elapsed)
        user.total_focus_minutes += max(0, elapsed)
        user.active_timer_task_id = None
        user.timer_started_at = None
    if task.status != "done":
        award_xp(user, XP_BY_PRIORITY.get(task.priority, 50))
    task.status = "done"
    db.commit()
    db.refresh(user)
    return state_from_user(user)
