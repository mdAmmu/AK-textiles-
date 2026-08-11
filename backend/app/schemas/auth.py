from pydantic import BaseModel


class SyncUserRequest(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None


class UserOut(BaseModel):
    id: str
    clerk_user_id: str
    name: str
    email: str | None = None
    phone: str | None = None
    role: str
    group_id: str | None = None

    class Config:
        from_attributes = True
