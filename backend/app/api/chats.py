from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.product import Product
from app.models.user import User
from app.schemas.conversation import ConversationDetail, ConversationSummary
from app.schemas.message import MessageOut, SendMessageRequest, SendProductMessageRequest
from app.services.chat_service import (
    get_or_create_conversation,
    send_product_message,
    send_text_message,
    serialize_message,
)

router = APIRouter(prefix="/chats", tags=["chats"])


# ---------- User side: my own conversation with admin ----------


@router.get("/me", response_model=ConversationDetail)
def get_my_conversation(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversation = get_or_create_conversation(db, user)
    return _to_conversation_detail(conversation)


@router.post("/me/messages", response_model=MessageOut)
async def send_my_message(
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = get_or_create_conversation(db, user)
    message = await send_text_message(db, conversation, user.id, body.text)
    return serialize_message(message)


# ---------- Admin side: list all conversations, chat with any customer ----------


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
        customer = db.query(User).filter(User.id == c.user_id).first()
        summaries.append(
            ConversationSummary(
                id=str(c.id),
                user_id=str(c.user_id),
                user_name=customer.name if customer else "Unknown",
                last_message_text=last_message.text if last_message else None,
                last_message_at=last_message.created_at if last_message else None,
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
    return _to_conversation_detail(conversation)


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def admin_send_message(
    conversation_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    conversation = _get_conversation_or_404(db, conversation_id)
    message = await send_text_message(db, conversation, admin.id, body.text)
    return serialize_message(message)


@router.post("/{conversation_id}/messages/product", response_model=MessageOut)
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

    message = await send_product_message(db, conversation, admin.id, product)
    return serialize_message(message)


def _get_conversation_or_404(db: Session, conversation_id: str) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


def _to_conversation_detail(conversation: Conversation) -> ConversationDetail:
    return ConversationDetail(
        id=str(conversation.id),
        user_id=str(conversation.user_id),
        admin_id=str(conversation.admin_id),
        messages=[serialize_message(m) for m in conversation.messages],
    )
