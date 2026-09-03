"""add STAFF value to userrole enum

Revision ID: a5b6c7d8e9f0
Revises: e4f5a6b7c8d9
Create Date: 2026-09-03 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a5b6c7d8e9f0'
down_revision: Union[str, Sequence[str], None] = 'e4f5a6b7c8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE cannot run inside the transaction Alembic
    # normally wraps migrations in, so this needs an autocommit block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'STAFF'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct way to drop a single enum value. Leaving this
    # as a no-op is safe: no column will contain 'STAFF' after the app
    # itself stops writing it.
    pass
