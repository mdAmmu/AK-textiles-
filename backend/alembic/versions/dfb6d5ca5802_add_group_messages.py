"""add group messages support

Revision ID: dfb6d5ca5802
Revises: 783405f4a5f9
Create Date: 2026-08-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'dfb6d5ca5802'
down_revision: Union[str, Sequence[str], None] = '783405f4a5f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('group_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_messages_group_id'), 'messages', ['group_id'], unique=False)
    op.create_foreign_key(
        'messages_group_id_fkey', 'messages', 'groups', ['group_id'], ['id']
    )
    op.alter_column('messages', 'conversation_id', existing_type=postgresql.UUID(as_uuid=True), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('messages', 'conversation_id', existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_constraint('messages_group_id_fkey', 'messages', type_='foreignkey')
    op.drop_index(op.f('ix_messages_group_id'), table_name='messages')
    op.drop_column('messages', 'group_id')
