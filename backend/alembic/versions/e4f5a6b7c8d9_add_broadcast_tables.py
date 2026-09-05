"""add broadcast audiences, broadcasts and broadcast recipients tables

Revision ID: e4f5a6b7c8d9
Revises: d1e2f3a4b5c6
Create Date: 2026-09-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, Sequence[str], None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'broadcast_audiences',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_broadcast_audiences_owner_id', 'broadcast_audiences', ['owner_id'])

    op.create_table(
        'broadcast_audience_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('audience_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['audience_id'], ['broadcast_audiences.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['contact_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('audience_id', 'contact_id', name='uq_audience_member'),
    )
    op.create_index(
        'idx_audience_members_audience', 'broadcast_audience_members', ['audience_id']
    )
    op.create_index(
        'idx_audience_members_contact', 'broadcast_audience_members', ['contact_id']
    )

    # Named distinctly from the pre-existing `broadcaststatus` type (used by
    # the unrelated whatsapp_broadcasts table) to avoid a name collision.
    broadcast_status = postgresql.ENUM(
        'draft', 'queued', 'processing', 'completed', 'partially_completed', 'failed', 'cancelled',
        name='chat_broadcast_status',
    )
    broadcast_status.create(op.get_bind(), checkfirst=True)
    broadcast_status = postgresql.ENUM(
        'draft', 'queued', 'processing', 'completed', 'partially_completed', 'failed', 'cancelled',
        name='chat_broadcast_status',
        create_type=False,
    )

    op.create_table(
        'broadcasts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=True),
        sa.Column('status', broadcast_status, nullable=False),
        sa.Column('audience_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('selection', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('total_recipients', sa.Integer(), nullable=False),
        sa.Column('sent_count', sa.Integer(), nullable=False),
        sa.Column('failed_count', sa.Integer(), nullable=False),
        sa.Column('idempotency_key', sa.String(length=100), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.ForeignKeyConstraint(['audience_id'], ['broadcast_audiences.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key'),
    )
    op.create_index('idx_broadcasts_owner', 'broadcasts', ['owner_id'])
    op.create_index('idx_broadcasts_status', 'broadcasts', ['status'])
    op.create_index('ix_broadcasts_created_at', 'broadcasts', ['created_at'])

    recipient_status = postgresql.ENUM(
        'pending', 'sent', 'failed', 'cancelled', name='chat_broadcast_recipient_status'
    )
    recipient_status.create(op.get_bind(), checkfirst=True)
    recipient_status = postgresql.ENUM(
        'pending', 'sent', 'failed', 'cancelled',
        name='chat_broadcast_recipient_status',
        create_type=False,
    )

    op.create_table(
        'broadcast_recipients',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('broadcast_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', recipient_status, nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['broadcast_id'], ['broadcasts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id']),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('broadcast_id', 'recipient_id', name='uq_broadcast_recipient'),
    )
    op.create_index(
        'idx_broadcast_recipients_broadcast', 'broadcast_recipients', ['broadcast_id']
    )
    op.create_index(
        'idx_broadcast_recipients_status', 'broadcast_recipients', ['broadcast_id', 'status']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_broadcast_recipients_status', table_name='broadcast_recipients')
    op.drop_index('idx_broadcast_recipients_broadcast', table_name='broadcast_recipients')
    op.drop_table('broadcast_recipients')
    postgresql.ENUM(name='chat_broadcast_recipient_status').drop(op.get_bind(), checkfirst=True)

    op.drop_index('ix_broadcasts_created_at', table_name='broadcasts')
    op.drop_index('idx_broadcasts_status', table_name='broadcasts')
    op.drop_index('idx_broadcasts_owner', table_name='broadcasts')
    op.drop_table('broadcasts')
    postgresql.ENUM(name='chat_broadcast_status').drop(op.get_bind(), checkfirst=True)

    op.drop_index('idx_audience_members_contact', table_name='broadcast_audience_members')
    op.drop_index('idx_audience_members_audience', table_name='broadcast_audience_members')
    op.drop_table('broadcast_audience_members')

    op.drop_index('ix_broadcast_audiences_owner_id', table_name='broadcast_audiences')
    op.drop_table('broadcast_audiences')
