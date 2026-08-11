from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.group import Group
from app.models.user import User, UserRole
from app.schemas.group import AssignGroupRequest, GroupOut, GroupUserOut

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupOut])
def list_groups(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    counts = dict(
        db.query(User.group_id, func.count(User.id))
        .filter(User.group_id.isnot(None))
        .group_by(User.group_id)
        .all()
    )
    groups = db.query(Group).order_by(Group.name).all()
    return [
        GroupOut(
            id=str(g.id),
            name=g.name,
            description=g.description,
            customer_count=counts.get(g.id, 0),
        )
        for g in groups
    ]


@router.get("/{group_id}/users", response_model=list[GroupUserOut])
def list_group_users(
    group_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    _get_group_or_404(db, group_id)
    users = (
        db.query(User)
        .filter(User.group_id == group_id, User.role == UserRole.USER)
        .order_by(User.name)
        .all()
    )
    return [
        GroupUserOut(id=str(u.id), name=u.name, phone=u.phone, email=u.email) for u in users
    ]


@router.patch("/users/{user_id}", response_model=GroupUserOut)
def assign_user_group(
    user_id: str,
    body: AssignGroupRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.USER).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.group_id is not None:
        _get_group_or_404(db, body.group_id)

    user.group_id = body.group_id
    db.commit()
    db.refresh(user)
    return GroupUserOut(id=str(user.id), name=user.name, phone=user.phone, email=user.email)


def _get_group_or_404(db: Session, group_id: str) -> Group:
    group = db.query(Group).filter(Group.id == group_id).first()
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group
