"""add image_group_id to messages

Revision ID: a1b2c3d4e5f6
Revises: dfb6d5ca5802
Create Date: 2026-08-13 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'dfb6d5ca5802'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('image_group_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_messages_image_group_id'), 'messages', ['image_group_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_messages_image_group_id'), table_name='messages')
    op.drop_column('messages', 'image_group_id')
