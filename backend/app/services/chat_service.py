from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message, MessageType
from app.models.user import User, UserRole


def get_or_create_conversation(db: Session, user: User) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.user_id == user.id).first()
    if conversation is not None:
        return conversation

    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin is None:
        raise ValueError("No admin account exists yet")

    conversation = Conversation(user_id=user.id, admin_id=admin.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def send_text_message(
    db: Session, conversation: Conversation, sender_id, text: str
) -> Message:
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.TEXT,
        text=text,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
