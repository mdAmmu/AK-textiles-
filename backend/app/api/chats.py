import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.core.image_utils import normalize_image
from app.core.supabase_client import upload_chat_file, upload_chat_image
from app.models.conversation import Conversation
from app.models.group import Group
from app.models.message import Message
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.conversation import ConversationDetail, ConversationSummary
from app.schemas.message import (
    DeleteMessagesRequest,
    ForwardToGroupsRequest,
    MessageOut,
    SendMessageRequest,
    SendProductMessageRequest,
)
from app.services.chat_service import (
    delete_conversation_messages,
    forward_messages_to_groups,
    get_or_create_conversation,
    mark_conversation_read,
    send_document_message,
    send_image_message,
    send_product_message,
    send_text_message,
    serialize_message,
)

MAX_DOCUMENT_BYTES = 20 * 1024 * 1024  # 20 MB

router = APIRouter(prefix="/chats", tags=["chats"])


# ---------- User side: my own conversation with admin ----------


@router.get("/me", response_model=ConversationDetail)
def get_my_conversation(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversation = get_or_create_conversation(db, user)
    return _to_conversation_detail(db, conversation)


@router.post("/me/messages", response_model=MessageOut)
async def send_my_message(
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = get_or_create_conversation(db, user)
    message = await send_text_message(db, conversation, user.id, body.text, body.reply_to_id)
    return serialize_message(message)


@router.post("/me/messages/image", response_model=list[MessageOut])
async def send_my_image_message(
    files: list[UploadFile],
    reply_to_id: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = get_or_create_conversation(db, user)
    image_group_id = uuid.uuid4() if len(files) > 1 else None

    messages = []
    for file in files:
        content = await file.read()
        content, content_type, extension = normalize_image(content, file.content_type, file.filename)
        filename = f"{conversation.id}/{uuid.uuid4()}.{extension}"
        url = upload_chat_image(filename, content, content_type)

        message = await send_image_message(
            db, conversation, user.id, url, reply_to_id, image_group_id
        )
        messages.append(serialize_message(message))
    return messages


@router.post("/me/messages/document", response_model=MessageOut)
async def send_my_document_message(
    file: UploadFile,
    reply_to_id: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = get_or_create_conversation(db, user)
    original_name = file.filename or "document"

    content = await file.read()
    if len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is too large (max 20MB)")

    extension = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
    storage_name = f"{conversation.id}/{uuid.uuid4()}.{extension}"
    url = upload_chat_file(storage_name, content, file.content_type or "application/octet-stream")

    message = await send_document_message(db, conversation, user.id, url, original_name, reply_to_id)
    return serialize_message(message)


@router.post("/me/messages/delete", response_model=list[str])
async def delete_my_conversation_messages(
    body: DeleteMessagesRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = get_or_create_conversation(db, user)
    return await delete_conversation_messages(db, conversation, body.message_ids, user.id)


@router.post("/me/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_my_conversation_read(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    conversation = get_or_create_conversation(db, user)
    await mark_conversation_read(db, conversation, user.id)


# ---------- Admin side: list all conversations, chat with any customer ----------


class StartConversationRequest(BaseModel):
    user_id: str


@router.post("/start", response_model=ConversationSummary)
def start_conversation(
    body: StartConversationRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-initiated chat with a customer who hasn't messaged first —
    get_or_create_conversation() is otherwise only reached from the
    customer's own /chats/me routes."""
    customer = (
        db.query(User).filter(User.id == body.user_id, User.role == UserRole.USER).first()
    )
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    conversation = get_or_create_conversation(db, customer)
    return ConversationSummary(
        id=str(conversation.id),
        user_id=str(customer.id),
        user_name=customer.name,
    )


@router.get("", response_model=list[ConversationSummary])
def list_conversations(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    conversations = db.query(Conversation).all()
    summaries = []
    for c in conversations:
        last_message = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == c.id,
                Message.sender_id == c.user_id,
                Message.read_at.is_(None),
            )
            .count()
        )
        if last_message is None:
            # Opening the app creates a conversation row before the customer
            # ever sends anything — don't clutter the admin's chat list with it.
            continue
        customer = db.query(User).filter(User.id == c.user_id).first()
        summaries.append(
            ConversationSummary(
                id=str(c.id),
                user_id=str(c.user_id),
                user_name=customer.name if customer else "Unknown",
                last_message_text=last_message.text,
                last_message_type=last_message.message_type.value,
                last_message_at=last_message.created_at,
                unread_count=unread_count,
            )
        )
    epoch = datetime.min.replace(tzinfo=timezone.utc)
    summaries.sort(key=lambda s: s.last_message_at or epoch, reverse=True)
    return summaries


@router.get("/{conversation_id}/messages", response_model=ConversationDetail)
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    return _to_conversation_detail(db, conversation)


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def admin_send_message(
    conversation_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    message = await send_text_message(db, conversation, admin.id, body.text, body.reply_to_id)
    return serialize_message(message)


@router.post("/{conversation_id}/messages/product", response_model=list[MessageOut])
async def admin_send_product_message(
    conversation_id: str,
    body: SendProductMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    messages = await send_product_message(db, conversation, admin.id, product)
    return [serialize_message(m) for m in messages]


@router.post("/{conversation_id}/messages/image", response_model=list[MessageOut])
async def admin_send_image_message(
    conversation_id: str,
    files: list[UploadFile],
    reply_to_id: str | None = Form(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    image_group_id = uuid.uuid4() if len(files) > 1 else None

    messages = []
    for file in files:
        content = await file.read()
        content, content_type, extension = normalize_image(content, file.content_type, file.filename)
        filename = f"{conversation_id}/{uuid.uuid4()}.{extension}"
        url = upload_chat_image(filename, content, content_type)

        message = await send_image_message(
            db, conversation, admin.id, url, reply_to_id, image_group_id
        )
        messages.append(serialize_message(message))
    return messages


@router.post("/{conversation_id}/messages/document", response_model=MessageOut)
async def admin_send_document_message(
    conversation_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    original_name = file.filename or "document"

    content = await file.read()
    if len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is too large (max 20MB)")

    extension = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
    storage_name = f"{conversation_id}/{uuid.uuid4()}.{extension}"
    url = upload_chat_file(storage_name, content, file.content_type or "application/octet-stream")

    message = await send_document_message(db, conversation, admin.id, url, original_name)
    return serialize_message(message)


@router.post("/{conversation_id}/messages/delete", response_model=list[str])
async def admin_delete_conversation_messages(
    conversation_id: str,
    body: DeleteMessagesRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    return await delete_conversation_messages(db, conversation, body.message_ids, admin.id)


@router.post("/{conversation_id}/messages/forward", response_model=list[MessageOut])
async def admin_forward_conversation_messages(
    conversation_id: str,
    body: ForwardToGroupsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    source_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id, Message.id.in_(body.message_ids))
        .order_by(Message.created_at)
        .all()
    )
    if not source_messages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Messages not found")

    target_groups = db.query(Group).filter(Group.id.in_(body.group_ids)).all()
    if not target_groups:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No target groups found")

    forwarded = await forward_messages_to_groups(db, source_messages, target_groups, admin.id)
    return [serialize_message(m) for m in forwarded]


@router.post("/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_conversation_read_by_admin(
    conversation_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    await mark_conversation_read(db, conversation, admin.id)


def _get_conversation_or_404(db: Session, conversation_id: str) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


def _to_conversation_detail(db: Session, conversation: Conversation) -> ConversationDetail:
    customer = db.query(User).filter(User.id == conversation.user_id).first()
    return ConversationDetail(
        id=str(conversation.id),
        user_id=str(conversation.user_id),
        admin_id=str(conversation.admin_id),
        user_name=customer.name if customer else "Unknown",
        messages=[serialize_message(m) for m in conversation.messages],
    )
