import enum
import uuid

from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WhatsAppMessageStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"


class WhatsAppMessage(Base):
    """Per-recipient delivery log for outbound WhatsApp template sends.

    Distinct from app.models.message.Message, which is the in-app chat the
    customer lands in after tapping the template's CTA button.
    """

    __tablename__ = "whatsapp_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    broadcast_id = Column(UUID(as_uuid=True), ForeignKey("whatsapp_broadcasts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    phone_number = Column(String(20), nullable=False)

    external_message_id = Column(String(200), nullable=True, unique=True, index=True)
    status = Column(Enum(WhatsAppMessageStatus), nullable=False, default=WhatsAppMessageStatus.QUEUED)
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)

    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
