from datetime import date, datetime
from uuid import UUID

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
        "status": t.status,
        "estimatedMinutes": t.estimated_minutes,
        "loggedMinutes": t.logged_minutes,
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
    }


XP_BY_PRIORITY = {"critical": 120, "high": 80, "medium": 50, "low": 30}


def award_xp(user: User, amount: int) -> None:
    user.xp += amount
    while user.xp >= user.xp_to_next:
        user.xp -= user.xp_to_next
        user.level += 1
        user.xp_to_next = max(100, round(user.xp_to_next * 1.15))
    user.completed_tasks += 1


def seed_demo_data(user: User) -> None:
    if user.projects:
        return

    today = date.today()
    p1 = Project(
        user_id=user.id,
        name="System Architecture",
        description="Core void engine structure and mana-flow protocols.",
        color="#8b5cf6",
        level=12,
        realm="network",
        created_at=today,
    )
    p2 = Project(
        user_id=user.id,
        name="Nexus Protocol",
        description="Cross-realm integrations and essence synchronization.",
        color="#2dd4bf",
        level=8,
        realm="rocket",
        created_at=today,
    )
    p3 = Project(
        user_id=user.id,
        name="Void Core",
        description="Central spirit engine deployment.",
        color="#2dd4bf",
        level=22,
        realm="core",
        created_at=today,
    )
    user.projects.extend([p1, p2, p3])

    user.tasks.extend(
        [
            Task(
                user_id=user.id,
                project=p1,
                title="Deep Work Protocol",
                description="Complete the architectural audit of the Void Engine core.",
                due_date=today,
                priority="critical",
                attachments=["Blueprint.void", "Energy_Logs.txt"],
            ),
            Task(
                user_id=user.id,
                project=p1,
                title="Neural Path Mapping",
                description="Map focus timer flows and spirit mood transitions.",
                due_date=today,
                priority="high",
                status="in_progress",
                logged_minutes=25,
            ),
            Task(
                user_id=user.id,
                project=p2,
                title="Essence Link Copy",
                description="Write launch copy for cosmic onboarding.",
                due_date=today,
                priority="medium",
                attachments=["draft-v2.md"],
            ),
            Task(
                user_id=user.id,
                project=p3,
                title="Void Core Seal",
                description="Finalize the central spirit engine deployment.",
                due_date=today,
                priority="low",
                status="done",
                logged_minutes=30,
            ),
        ]
    )

    user.name = user.name or "Grandmaster Void"
    user.title = "Ethereal Rank: Tier VII"
    user.rank = "ETHEREAL RANK: TIER VII"
    user.level = 42
    user.xp = 2450
    user.xp_to_next = 3000
    user.streak = 12
    user.total_focus_minutes = 9840
    user.completed_tasks = 842
