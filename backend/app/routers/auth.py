from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.security import create_access_token
from app.services import profile_from_user, seed_demo_data, state_from_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        phone=payload.phone,
        age=payload.age,
        jobs=payload.jobs,
        goals=payload.goals,
        title="Discipline Seeker",
        rank="ETHEREAL RANK: TIER I",
    )
    seed_demo_data(user)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=profile_from_user(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        user = User(
            email=payload.email.lower(),
            name=payload.email.split("@")[0].title(),
            title="Discipline Seeker",
            rank="ETHEREAL RANK: TIER I",
        )
        seed_demo_data(user)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, user=profile_from_user(user))


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return profile_from_user(user)
