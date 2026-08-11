from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.clerk import verify_clerk_token
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import SyncUserRequest, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post("/sync", response_model=UserOut)
def sync_user(
    body: SyncUserRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Call this once right after a user completes Clerk sign-in (Google for now,
    phone OTP later). Creates the local user row on first login, otherwise
    returns the existing one.
    """
    payload = verify_clerk_token(credentials.credentials)
    clerk_user_id = payload["sub"]

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        user = User(
            clerk_user_id=clerk_user_id,
            name=body.name,
            email=body.email,
            phone=body.phone,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return _to_user_out(user)


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return _to_user_out(user)


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=str(user.id),
        clerk_user_id=user.clerk_user_id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else user.role,
        group_id=str(user.group_id) if user.group_id else None,
    )
