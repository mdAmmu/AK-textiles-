from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenOut, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    phone = body.phone.strip()
    name = body.name.strip()
    if not phone or not name or not body.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name, phone and password are required")

    existing = db.query(User).filter(User.phone == phone).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")

    user = User(name=name, phone=phone, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=_to_user_out(user))


@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    phone = body.phone.strip()
    user = db.query(User).filter(User.phone == phone).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone number or password")

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=_to_user_out(user))


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _to_user_out(user)


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else user.role,
        group_id=str(user.group_id) if user.group_id else None,
    )
