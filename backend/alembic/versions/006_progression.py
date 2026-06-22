"""progression rebuild + last_active_date

Revision ID: 006_progression
Revises: 005_timer_accumulated
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_progression"
down_revision: Union[str, None] = "005_timer_accumulated"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_active_date", sa.Date(), nullable=True))

    # Rebuild inflated / seeded progression from real activity
    bind = op.get_bind()
    from app.models.focus_session import FocusSession
    from app.models.project import Project
    from app.models.task import Task
    from app.models.user import User
    from app.progression import rebuild_user_progression
    from sqlalchemy.orm import Session

    session = Session(bind=bind)
    try:
        for user in session.query(User).all():
            rebuild_user_progression(user, session)
        session.commit()
    finally:
        session.close()


def downgrade() -> None:
    op.drop_column("users", "last_active_date")
