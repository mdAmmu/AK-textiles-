import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.supabase_client import upload_chat_image
from app.models.group import Group
from app.models.message import Message
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.group import AssignGroupRequest, CreateGroupRequest, GroupOut, GroupUserOut
from app.schemas.message import (
    DeleteMessagesRequest,
    ForwardMessagesRequest,
    MessageOut,
    SendMessageRequest,
    SendProductMessageRequest,
)
from app.services.chat_service import (
    delete_group,
    delete_group_messages,
    forward_group_messages,
    send_group_image_message,
    send_group_product_message,
    send_group_text_message,
    serialize_message,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/mine", response_model=GroupOut | None)
def get_my_group(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.group_id is None:
        return None
    group = db.query(Group).filter(Group.id == user.group_id).first()
    if group is None:
        return None
    count = (
        db.query(func.count(User.id))
        .filter(User.group_id == group.id, User.role == UserRole.USER)
        .scalar()
    )
    return GroupOut(id=str(group.id), name=group.name, description=group.description, customer_count=count)


@router.get("/mine/messages", response_model=list[MessageOut])
def get_my_group_messages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.group_id is None:
        return []
    messages = (
        db.query(Message)
        .filter(Message.group_id == user.group_id)
        .order_by(Message.created_at)
        .all()
    )
    return [serialize_message(m) for m in messages]


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


@router.post("", response_model=GroupOut)
def create_group(
    body: CreateGroupRequest, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group name is required")
    if db.query(Group).filter(func.lower(Group.name) == name.lower()).first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group already exists")

    group = Group(name=name, description=body.description)
    db.add(group)
    db.commit()
    db.refresh(group)
    return GroupOut(id=str(group.id), name=group.name, description=group.description, customer_count=0)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_group(
    group_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    group = _get_group_or_404(db, group_id)
    await delete_group(db, group)


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


@router.get("/{group_id}/messages", response_model=list[MessageOut])
def list_group_messages(
    group_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    _get_group_or_404(db, group_id)
    messages = (
        db.query(Message).filter(Message.group_id == group_id).order_by(Message.created_at).all()
    )
    return [serialize_message(m) for m in messages]


@router.post("/{group_id}/messages", response_model=MessageOut)
async def admin_send_group_message(
    group_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    group = _get_group_or_404(db, group_id)
    message = await send_group_text_message(db, group, admin.id, body.text)
    return serialize_message(message)


@router.post("/{group_id}/messages/product", response_model=list[MessageOut])
async def admin_send_group_product_message(
    group_id: str,
    body: SendProductMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    group = _get_group_or_404(db, group_id)
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    messages = await send_group_product_message(db, group, admin.id, product)
    return [serialize_message(m) for m in messages]


@router.post("/{group_id}/messages/image", response_model=MessageOut)
async def admin_send_group_image_message(
    group_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    group = _get_group_or_404(db, group_id)

    content = await file.read()
    extension = (file.filename or "").rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    filename = f"{group_id}/{uuid.uuid4()}.{extension}"
    url = upload_chat_image(filename, content, file.content_type or "image/jpeg")

    message = await send_group_image_message(db, group, admin.id, url)
    return serialize_message(message)


@router.post("/{group_id}/messages/delete", response_model=list[str])
async def admin_delete_group_messages(
    group_id: str,
    body: DeleteMessagesRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    group = _get_group_or_404(db, group_id)
    return await delete_group_messages(db, group, body.message_ids)


@router.post("/{group_id}/messages/forward", response_model=list[MessageOut])
async def admin_forward_group_messages(
    group_id: str,
    body: ForwardMessagesRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    _get_group_or_404(db, group_id)
    source_messages = (
        db.query(Message)
        .filter(Message.group_id == group_id, Message.id.in_(body.message_ids))
        .order_by(Message.created_at)
        .all()
    )
    if not source_messages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Messages not found")

    target_groups = db.query(Group).filter(Group.id.in_(body.group_ids)).all()
    if not target_groups:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No target groups found")

    forwarded = await forward_group_messages(db, source_messages, target_groups, admin.id)
    return [serialize_message(m) for m in forwarded]


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
