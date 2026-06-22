from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.analytics.project_analytics import build_project_analytics
from app.database import get_db
from app.deps import get_current_user
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services import project_to_dict

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
def list_projects(user: User = Depends(get_current_user)) -> list[dict]:
    return [project_to_dict(p) for p in user.projects]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    project = Project(
        user_id=user.id,
        name=payload.name.strip(),
        description=payload.description,
        color=payload.color,
        realm=payload.realm,
        level=1,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_dict(project)


@router.get("/{project_id}/analytics")
def project_analytics(
    project_id: UUID,
    period: str = Query("week", pattern="^(week|month|quarter|year|all)$"),
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return build_project_analytics(db, project, period=period, date_from=date_from, date_to=date_to)


@router.patch("/{project_id}")
def update_project(
    project_id: UUID, payload: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project_to_dict(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
