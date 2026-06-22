from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest
from app.security import create_access_token, hash_password, token_ttl_seconds, verify_password
from app.progression import xp_required_for_level
from app.services import profile_from_user

router = APIRouter(prefix="/auth", tags=["auth"])


def auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(str(user.id)),
        expires_in=token_ttl_seconds(),
        user=profile_from_user(user),
    )


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        phone=payload.phone,
        age=payload.age,
        jobs=payload.jobs,
        goals=payload.goals,
        title="Discipline Seeker",
        rank="AVENO RANK: TIER I",
        level=1,
        xp=0,
        xp_to_next=xp_required_for_level(1),
        streak=0,
        completed_tasks=0,
        total_focus_minutes=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.password_hash:
        user.password_hash = hash_password(payload.password)
        db.commit()
        db.refresh(user)
    elif not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return auth_response(user)


@router.post("/refresh", response_model=AuthResponse)
def refresh_session(user: User = Depends(get_current_user)) -> AuthResponse:
    """Issue a fresh JWT (same 1-year TTL) while the current token is still valid."""
    return auth_response(user)


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return profile_from_user(user)
