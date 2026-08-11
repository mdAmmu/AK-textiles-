from pydantic import BaseModel


class UserListItem(BaseModel):
    id: str
    name: str
    phone: str | None = None
    email: str | None = None
    role: str
    group_id: str | None = None
