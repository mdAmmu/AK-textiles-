import enum
import uuid

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String(150), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(150), unique=True, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    group = relationship("Group", back_populates="users")
