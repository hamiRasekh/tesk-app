from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileUpdate
from app.services import profile_from_user, state_from_user

router = APIRouter(prefix="/api", tags=["app"])


@router.get("/state")
def get_state(user: User = Depends(get_current_user)) -> dict:
    return state_from_user(user)


@router.patch("/profile")
def update_profile(
    payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    if payload.email and payload.email.lower() != user.email:
        taken = db.query(User).filter(User.email == payload.email.lower(), User.id != user.id).first()
        if taken:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        user.email = payload.email.lower()
    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.title is not None:
        user.title = payload.title
    if payload.rank is not None:
        user.rank = payload.rank
    db.commit()
    db.refresh(user)
    return profile_from_user(user)
