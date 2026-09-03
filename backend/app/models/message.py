import enum
import uuid

from sqlalchemy import Boolean, Column, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    PRODUCT = "PRODUCT"
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True, index=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.TEXT)

    text = Column(Text, nullable=True)

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    product_name = Column(String(200), nullable=True)
    product_image = Column(String(500), nullable=True)
    product_description = Column(Text, nullable=True)

    # DOCUMENT messages reuse product_image as the generic file URL; this
    # holds the original filename for display (e.g. "catalog.pdf").
    file_name = Column(String(255), nullable=True)

    image_group_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    reply_to_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    reply_to = relationship("Message", remote_side=[id], foreign_keys=[reply_to_id])

    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")
    is_edited = Column(Boolean, nullable=False, default=False, server_default="false")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
