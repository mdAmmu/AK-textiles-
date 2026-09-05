from pydantic import BaseModel

from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: UserRole = UserRole.USER


class UserListItem(BaseModel):
    id: str
    name: str
    phone: str | None = None
    email: str | None = None
    role: str
    group_id: str | None = None
    group_name: str | None = None
    audience_names: list[str] = []
