"""timer accumulated seconds for pause/resume

Revision ID: 005_timer_accumulated
Revises: 004_focus_sessions
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_timer_accumulated"
down_revision: Union[str, None] = "004_focus_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("timer_accumulated_seconds", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "timer_accumulated_seconds")
