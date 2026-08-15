from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserListItem

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserListItem])
def list_users(
    unassigned_only: bool = Query(False),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User).filter(User.role == UserRole.USER)

    if unassigned_only:
        query = query.filter(User.group_id.is_(None))

    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.name.ilike(like)) | (User.email.ilike(like)) | (User.phone.ilike(like))
        )

    users = query.order_by(User.name).all()
    return [
        UserListItem(
            id=str(u.id),
            name=u.name,
            phone=u.phone,
            email=u.email,
            role=u.role.value,
            group_id=str(u.group_id) if u.group_id else None,
        )
        for u in users
    ]
