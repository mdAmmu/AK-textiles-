import enum
import uuid

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    # Manager/staff: interacts with the admin through the shared Group chat
    # (like the old customer experience). Customers (USER) instead get a
    # private 1-1/broadcast chat — see UserChat.tsx / CustomerChat.tsx.
    STAFF = "STAFF"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)
    # When set, this member's group chat only shows messages from this
    # moment onward (WhatsApp-style: no history from before you joined).
    # NULL means no cutoff — existing members from before this feature keep
    # seeing full history.
    group_joined_at = Column(DateTime(timezone=True), nullable=True)
    # Updated when the user's last WebSocket connection drops. NULL means
    # they've never connected (or are online right now) - presence status
    # is derived from the live connection manager, this is only the
    # fallback "last seen" timestamp shown while they're offline.
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    group = relationship("Group", back_populates="users")
