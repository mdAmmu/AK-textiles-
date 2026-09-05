"""placeholder: bridges an untracked migration already applied to the shared DB

The original migration for this revision (WhatsApp Business API integration
tables: message_templates, wa_campaigns, wa_contacts, wa_automations, etc.)
was run against the shared database but its source file was never committed
to git — only stale __pycache__ remained. The tables already exist in the
database, so this placeholder is a no-op: it exists solely so this repo's
migration graph is complete and `alembic upgrade head` can proceed past the
DB's current alembic_version without re-running or altering anything.

Revision ID: f2a3b4c5d6e7
Revises: d1e2f3a4b5c6
Create Date: 2026-09-03 13:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op — the underlying tables already exist in the database."""
    pass


def downgrade() -> None:
    """No-op — this placeholder does not know the original schema well
    enough to safely drop it. Do not use this migration to remove the
    WhatsApp Business API tables.
    """
    pass
