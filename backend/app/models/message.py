import enum
import uuid

from sqlalchemy import Column, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    PRODUCT = "PRODUCT"
    IMAGE = "IMAGE"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.TEXT)

    text = Column(Text, nullable=True)

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    product_name = Column(String(200), nullable=True)
    product_image = Column(String(500), nullable=True)
    product_description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
