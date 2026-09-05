"""add reply-to support for conversation messages and broadcasts

Revision ID: c7d8e9f0a1b2
Revises: b6c7d8e9f0a1
Create Date: 2026-09-03 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = 'b6c7d8e9f0a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('reply_to_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'messages_reply_to_id_fkey', 'messages', 'messages', ['reply_to_id'], ['id']
    )

    op.add_column(
        'broadcasts', sa.Column('reply_to_broadcast_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'broadcasts_reply_to_broadcast_id_fkey', 'broadcasts', 'broadcasts',
        ['reply_to_broadcast_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('broadcasts_reply_to_broadcast_id_fkey', 'broadcasts', type_='foreignkey')
    op.drop_column('broadcasts', 'reply_to_broadcast_id')

    op.drop_constraint('messages_reply_to_id_fkey', 'messages', type_='foreignkey')
    op.drop_column('messages', 'reply_to_id')
