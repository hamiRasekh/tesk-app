"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(120), server_default="Discipline Seeker"),
        sa.Column("rank", sa.String(120), server_default="ETHEREAL RANK: TIER I"),
        sa.Column("streak", sa.Integer(), server_default="0"),
        sa.Column("level", sa.Integer(), server_default="1"),
        sa.Column("xp", sa.Integer(), server_default="0"),
        sa.Column("xp_to_next", sa.Integer(), server_default="300"),
        sa.Column("total_focus_minutes", sa.Integer(), server_default="0"),
        sa.Column("completed_tasks", sa.Integer(), server_default="0"),
        sa.Column("jobs", postgresql.JSONB(astext_type=sa.Text()), server_default="[]"),
        sa.Column("goals", postgresql.JSONB(astext_type=sa.Text()), server_default="[]"),
        sa.Column("active_timer_task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("timer_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text(), server_default=""),
        sa.Column("color", sa.String(32), server_default="#8b5cf6"),
        sa.Column("level", sa.Integer(), server_default="1"),
        sa.Column("realm", sa.String(32), server_default="network"),
        sa.Column("created_at", sa.Date(), server_default=sa.text("CURRENT_DATE")),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), server_default=""),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("priority", sa.String(16), server_default="medium"),
        sa.Column("status", sa.String(16), server_default="pending"),
        sa.Column("estimated_minutes", sa.Integer(), server_default="30"),
        sa.Column("logged_minutes", sa.Integer(), server_default="0"),
        sa.Column("attachments", postgresql.JSONB(astext_type=sa.Text()), server_default="[]"),
        sa.Column("created_at", sa.Date(), server_default=sa.text("CURRENT_DATE")),
    )
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"])
    op.create_index("ix_tasks_project_id", "tasks", ["project_id"])


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("projects")
    op.drop_table("users")
