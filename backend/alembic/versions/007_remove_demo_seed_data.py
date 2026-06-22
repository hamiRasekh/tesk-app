"""remove legacy demo seed projects/tasks

Revision ID: 007_remove_demo_seed
Revises: 006_progression
Create Date: 2026-06-22
"""

from typing import Sequence, Union

from alembic import op

revision: str = "007_remove_demo_seed"
down_revision: Union[str, None] = "006_progression"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Names from removed seed_demo_data() in backend/app/services.py
DEMO_PROJECT_NAMES = (
    "System Architecture",
    "Nexus Protocol",
    "Void Core",
    "Aveno Core",
)


def upgrade() -> None:
    bind = op.get_bind()
    from app.models.focus_session import FocusSession
    from app.models.project import Project
    from app.models.task import Task
    from app.models.user import User
    from app.progression import rebuild_user_progression
    from sqlalchemy.orm import Session

    session = Session(bind=bind)
    affected_users: set = set()
    try:
        demo_projects = session.query(Project).filter(Project.name.in_(DEMO_PROJECT_NAMES)).all()
        for project in demo_projects:
            affected_users.add(project.user_id)
            task_ids = [
                row[0]
                for row in session.query(Task.id).filter(Task.project_id == project.id).all()
            ]
            if task_ids:
                session.query(FocusSession).filter(FocusSession.task_id.in_(task_ids)).delete(
                    synchronize_session=False
                )
                session.query(Task).filter(Task.id.in_(task_ids)).delete(synchronize_session=False)
            session.delete(project)

        for user_id in affected_users:
            user = session.query(User).filter(User.id == user_id).first()
            if user:
                rebuild_user_progression(user, session)

        session.commit()
    finally:
        session.close()


def downgrade() -> None:
    pass
