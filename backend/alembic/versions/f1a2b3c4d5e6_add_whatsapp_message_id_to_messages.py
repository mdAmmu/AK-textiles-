"""add whatsapp_message_id to messages

Revision ID: f1a2b3c4d5e6
Revises: de74befd8d99
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'de74befd8d99'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('whatsapp_message_id', sa.String(length=200), nullable=True))
    op.create_index(
        op.f('ix_messages_whatsapp_message_id'), 'messages', ['whatsapp_message_id'], unique=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_messages_whatsapp_message_id'), table_name='messages')
    op.drop_column('messages', 'whatsapp_message_id')
