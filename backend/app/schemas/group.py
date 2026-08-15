from datetime import datetime

from pydantic import BaseModel


class GroupOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    customer_count: int
    last_message_at: datetime | None = None
    unread_count: int = 0


class GroupUserOut(BaseModel):
    id: str
    name: str
    phone: str | None = None
    email: str | None = None


class AssignGroupRequest(BaseModel):
    group_id: str | None = None


class CreateGroupRequest(BaseModel):
    name: str
    description: str | None = None


class CreateCustomerRequest(BaseModel):
    name: str
    phone: str
    password: str
