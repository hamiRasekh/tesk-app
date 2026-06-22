"""focus sessions and task completed_at

Revision ID: 004_focus_sessions
Revises: 003_task_scales
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004_focus_sessions"
down_revision: Union[str, None] = "003_task_scales"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "focus_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("task_title", sa.String(200), server_default=""),
        sa.Column("project_name", sa.String(160), server_default=""),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("minutes", sa.Integer(), server_default="0"),
        sa.Column("completed", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_focus_sessions_user_id", "focus_sessions", ["user_id"])
    op.create_index("ix_focus_sessions_started_at", "focus_sessions", ["started_at"])


def downgrade() -> None:
    op.drop_table("focus_sessions")
    op.drop_column("tasks", "completed_at")
