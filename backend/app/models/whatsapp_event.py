import uuid

from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WhatsAppEvent(Base):
    """Idempotency log for incoming webhook events (status updates etc.)."""

    __tablename__ = "whatsapp_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_event_id = Column(String(200), nullable=False, unique=True, index=True)
    event_type = Column(String(50), nullable=False)
    processed = Column(Boolean, nullable=False, default=False, server_default="false")
    processed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
