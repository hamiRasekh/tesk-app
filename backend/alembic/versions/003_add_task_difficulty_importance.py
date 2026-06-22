"""add difficulty and importance to tasks

Revision ID: 003_task_scales
Revises: 002_add_password_hash
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_task_scales"
down_revision: Union[str, None] = "002_add_password_hash"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("difficulty", sa.Integer(), server_default="5", nullable=False))
    op.add_column("tasks", sa.Column("importance", sa.Integer(), server_default="5", nullable=False))


def downgrade() -> None:
    op.drop_column("tasks", "importance")
    op.drop_column("tasks", "difficulty")
