from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.security import hash_password
from app.models.broadcast_message import BroadcastAudience, BroadcastAudienceMember
from app.models.group import Group
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserListItem

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserListItem)
def create_user(
    body: UserCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    """Creates a standalone user not tied to any group — used when adding a
    brand-new contact directly to a broadcast audience (audiences aren't
    groups, so there's no group to assign them into like
    createAndAssignCustomer does)."""
    name = body.name.strip()
    phone = body.phone.strip()
    if not name or not phone or not body.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Name, phone and password are required"
        )
    existing = db.query(User).filter(User.phone == phone).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")

    user = User(name=name, phone=phone, password_hash=hash_password(body.password), role=body.role)
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserListItem(
        id=str(user.id),
        name=user.name,
        phone=user.phone,
        email=user.email,
        role=user.role.value,
        group_id=None,
        group_name=None,
        audience_names=[],
    )


@router.get("", response_model=list[UserListItem])
def list_users(
    unassigned_only: bool = Query(False),
    not_in_any_audience: bool = Query(False),
    search: str | None = Query(None),
    role: UserRole = Query(UserRole.USER),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User).filter(User.role == role)

    if unassigned_only:
        query = query.filter(User.group_id.is_(None))

    if search:
        like = f"%{search}%"
        query = query.filter(
            (User.name.ilike(like)) | (User.email.ilike(like)) | (User.phone.ilike(like))
        )

    users = query.order_by(User.name).all()

    group_ids = {u.group_id for u in users if u.group_id}
    group_name_by_id = {}
    if group_ids:
        for g in db.query(Group).filter(Group.id.in_(group_ids)).all():
            group_name_by_id[g.id] = g.name

    user_ids = [u.id for u in users]
    audience_names_by_user: dict = {}
    if user_ids:
        rows = (
            db.query(BroadcastAudienceMember.contact_id, BroadcastAudience.name)
            .join(BroadcastAudience, BroadcastAudience.id == BroadcastAudienceMember.audience_id)
            .filter(BroadcastAudienceMember.contact_id.in_(user_ids))
            .all()
        )
        for contact_id, audience_name in rows:
            audience_names_by_user.setdefault(contact_id, []).append(audience_name)

    if not_in_any_audience:
        users = [u for u in users if not audience_names_by_user.get(u.id)]

    return [
        UserListItem(
            id=str(u.id),
            name=u.name,
            phone=u.phone,
            email=u.email,
            role=u.role.value,
            group_id=str(u.group_id) if u.group_id else None,
            group_name=group_name_by_id.get(u.group_id),
            audience_names=audience_names_by_user.get(u.id, []),
        )
        for u in users
    ]
