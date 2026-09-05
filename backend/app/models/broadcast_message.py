import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class BroadcastAudience(Base):
    """A reusable, named list of customers an admin can broadcast to again."""

    __tablename__ = "broadcast_audiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    members = relationship(
        "BroadcastAudienceMember", back_populates="audience", cascade="all, delete-orphan"
    )


class BroadcastAudienceMember(Base):
    __tablename__ = "broadcast_audience_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audience_id = Column(
        UUID(as_uuid=True), ForeignKey("broadcast_audiences.id", ondelete="CASCADE"), nullable=False
    )
    contact_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    audience = relationship("BroadcastAudience", back_populates="members")

    __table_args__ = (UniqueConstraint("audience_id", "contact_id", name="uq_audience_member"),)


class BroadcastMessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    DOCUMENT = "document"


class BroadcastStatus(str, enum.Enum):
    DRAFT = "draft"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIALLY_COMPLETED = "partially_completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Broadcast(Base):
    """A single 'compose once' broadcast that fans out into independent
    1-to-1 messages — one per recipient snapshot row. Never a group chat.
    """

    __tablename__ = "broadcasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=True)
    status = Column(
        Enum(
            BroadcastStatus,
            name="chat_broadcast_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=BroadcastStatus.DRAFT,
    )

    audience_id = Column(UUID(as_uuid=True), ForeignKey("broadcast_audiences.id"), nullable=True)
    # Selection that produced the recipient snapshot (group_ids/user_ids/audience_ids),
    # kept only so "Duplicate" can pre-fill the composer — not re-resolved on send.
    selection = Column(JSONB, nullable=True)

    message_type = Column(
        Enum(
            BroadcastMessageType,
            name="chat_broadcast_message_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=BroadcastMessageType.TEXT,
    )
    # TEXT: text holds the message. IMAGE/DOCUMENT: media_url is the
    # uploaded file (file_name is the original filename for documents);
    # text is unused for media broadcasts in this version (no caption).
    text = Column(Text, nullable=True)
    media_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    # Shared across a batch of image broadcasts sent together (one Broadcast
    # row per image), so each recipient's delivered messages render grouped
    # in their own chat — mirrors Message.image_group_id.
    image_group_id = Column(UUID(as_uuid=True), nullable=True)

    # When set, each recipient's delivered message quote-replies to *that
    # same recipient's own copy* of the referenced broadcast — resolved via
    # broadcast_recipients at send time (see _deliver_to_recipient).
    reply_to_broadcast_id = Column(UUID(as_uuid=True), ForeignKey("broadcasts.id"), nullable=True)

    total_recipients = Column(Integer, nullable=False, default=0)
    sent_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)

    idempotency_key = Column(String(100), nullable=True, unique=True)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    recipients = relationship(
        "BroadcastRecipient", back_populates="broadcast", cascade="all, delete-orphan"
    )


class BroadcastRecipientStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BroadcastRecipient(Base):
    """The recipient snapshot: one immutable row per user targeted at
    creation time, regardless of later audience edits.
    """

    __tablename__ = "broadcast_recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    broadcast_id = Column(
        UUID(as_uuid=True), ForeignKey("broadcasts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status = Column(
        Enum(
            BroadcastRecipientStatus,
            name="chat_broadcast_recipient_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=BroadcastRecipientStatus.PENDING,
    )

    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)

    failure_reason = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    broadcast = relationship("Broadcast", back_populates="recipients")

    __table_args__ = (
        UniqueConstraint("broadcast_id", "recipient_id", name="uq_broadcast_recipient"),
    )
