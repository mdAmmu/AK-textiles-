"""replace clerk auth with phone+password auth

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-08-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.drop_index(op.f('ix_users_clerk_user_id'), table_name='users')
    op.drop_column('users', 'clerk_user_id')
    op.alter_column('users', 'phone', existing_type=sa.VARCHAR(length=20), nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('users', 'phone', existing_type=sa.VARCHAR(length=20), nullable=True)
    op.add_column('users', sa.Column('clerk_user_id', sa.VARCHAR(length=150), nullable=False))
    op.create_index(op.f('ix_users_clerk_user_id'), 'users', ['clerk_user_id'], unique=True)
    op.drop_column('users', 'password_hash')
