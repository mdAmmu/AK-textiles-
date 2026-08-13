from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GroupRead(Base):
    """Tracks when an admin last opened a given group's chat, so the
    dashboard can show a per-group unread badge (messages sent since then).
    """

    __tablename__ = "group_reads"

    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), primary_key=True)
    last_read_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
