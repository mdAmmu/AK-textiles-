"""add image_group_id to broadcasts for multi-image batches

Revision ID: d8e9f0a1b2c3
Revises: c7d8e9f0a1b2
Create Date: 2026-09-03 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd8e9f0a1b2c3'
down_revision: Union[str, Sequence[str], None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'broadcasts', sa.Column('image_group_id', postgresql.UUID(as_uuid=True), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('broadcasts', 'image_group_id')
