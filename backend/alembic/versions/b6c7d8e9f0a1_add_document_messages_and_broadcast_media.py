"""add DOCUMENT message type + file uploads for chat and broadcast

Revision ID: b6c7d8e9f0a1
Revises: a5b6c7d8e9f0
Create Date: 2026-09-03 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b6c7d8e9f0a1'
down_revision: Union[str, Sequence[str], None] = 'a5b6c7d8e9f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'DOCUMENT'")

    op.add_column('messages', sa.Column('file_name', sa.String(length=255), nullable=True))

    # Broadcasts can now carry an image/document instead of only text.
    op.alter_column('broadcasts', 'text', existing_type=sa.Text(), nullable=True)

    broadcast_message_type = postgresql.ENUM(
        'text', 'image', 'document', name='chat_broadcast_message_type'
    )
    broadcast_message_type.create(op.get_bind(), checkfirst=True)
    broadcast_message_type_novalidate = postgresql.ENUM(
        'text', 'image', 'document', name='chat_broadcast_message_type', create_type=False
    )

    op.add_column(
        'broadcasts',
        sa.Column(
            'message_type',
            broadcast_message_type_novalidate,
            nullable=False,
            server_default='text',
        ),
    )
    op.add_column('broadcasts', sa.Column('media_url', sa.String(length=500), nullable=True))
    op.add_column('broadcasts', sa.Column('file_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('broadcasts', 'file_name')
    op.drop_column('broadcasts', 'media_url')
    op.drop_column('broadcasts', 'message_type')
    postgresql.ENUM(name='chat_broadcast_message_type').drop(op.get_bind(), checkfirst=True)
    op.alter_column('broadcasts', 'text', existing_type=sa.Text(), nullable=False)
    op.drop_column('messages', 'file_name')
