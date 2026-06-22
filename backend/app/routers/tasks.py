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
from app.progression import grant_focus_xp, grant_task_completion_xp, sync_project_level
from app.services import flush_timer, state_from_user, task_to_dict

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
        difficulty=payload.difficulty,
        importance=payload.importance,
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
    for key in ("title", "description", "priority", "difficulty", "importance", "status", "estimated_minutes", "logged_minutes", "attachments"):
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
    project_id = task.project_id
    if task.status == "done":
        user.completed_tasks = max(0, user.completed_tasks - 1)
    db.delete(task)
    db.commit()
    if project_id:
        project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
        if project:
            sync_project_level(project, db)
            db.commit()


@router.post("/{task_id}/timer/start")
def start_timer(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    now = datetime.now(timezone.utc)
    if user.active_timer_task_id == task.id:
        if user.timer_started_at:
            return state_from_user(user)
        user.timer_started_at = now
    else:
        if user.active_timer_task_id and user.active_timer_task_id != task.id:
            old = db.query(Task).filter(Task.id == user.active_timer_task_id, Task.user_id == user.id).first()
            if old:
                flush_timer(user, old, db)
        task.status = "in_progress"
        user.active_timer_task_id = task.id
        user.timer_accumulated_seconds = 0
        user.timer_started_at = now
    db.commit()
    db.refresh(user)
    return state_from_user(user)


@router.post("/{task_id}/timer/pause")
def pause_timer(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.active_timer_task_id != task.id:
        raise HTTPException(status_code=400, detail="Timer not active for this task")
    if user.timer_started_at:
        now = datetime.now(timezone.utc)
        user.timer_accumulated_seconds = (user.timer_accumulated_seconds or 0) + int(
            (now - user.timer_started_at).total_seconds()
        )
        user.timer_started_at = None
    db.commit()
    db.refresh(user)
    return state_from_user(user)


@router.post("/{task_id}/timer/stop")
def stop_timer(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    minutes = 0
    if user.active_timer_task_id == task.id:
        minutes = flush_timer(user, task, db, completed=False)
        if minutes:
            grant_focus_xp(user, minutes)
    db.commit()
    db.refresh(user)
    return state_from_user(user)


@router.post("/{task_id}/complete")
def complete_task(task_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    ended = datetime.now(timezone.utc)
    flushed_minutes = 0
    if user.active_timer_task_id == task.id:
        flushed_minutes = flush_timer(user, task, db, completed=True)
        if flushed_minutes:
            grant_focus_xp(user, flushed_minutes, ended)
    if task.status != "done":
        task.completed_at = ended
        grant_task_completion_xp(user, task)
        user.completed_tasks += 1
        if task.project_id:
            project = db.query(Project).filter(Project.id == task.project_id, Project.user_id == user.id).first()
            if project:
                sync_project_level(project, db)
    task.status = "done"
    if not task.completed_at:
        task.completed_at = ended
    db.commit()
    db.refresh(user)
    return state_from_user(user)
