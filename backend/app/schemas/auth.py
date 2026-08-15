from pydantic import BaseModel


class RegisterRequest(BaseModel):
    name: str
    phone: str
    password: str


class LoginRequest(BaseModel):
    phone: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    role: str
    group_id: str | None = None

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
