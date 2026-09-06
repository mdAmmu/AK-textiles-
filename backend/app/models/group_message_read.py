from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GroupMessageRead(Base):
    """Per-member read receipt for a single group message - powers the
    WhatsApp-style "Message info" screen (who has read this, who hasn't yet).
    Separate from GroupRead, which only tracks an admin's last-opened
    timestamp for the group's unread badge.
    """

    __tablename__ = "group_message_reads"

    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    read_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
