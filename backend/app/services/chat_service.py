from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.group import Group
from app.models.message import Message, MessageType
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.message import MessageOut
from app.websocket.manager import manager


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


async def send_text_message(
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

    await _notify_other_party(conversation, sender_id, message)
    return message


async def send_product_message(
    db: Session, conversation: Conversation, sender_id, product: Product
) -> Message:
    """Price is always resolved server-side from the customer's group —
    never trust a client-supplied price."""
    customer = db.query(User).filter(User.id == conversation.user_id).first()
    group = db.query(Group).filter(Group.id == customer.group_id).first() if customer else None
    price = product.price_for_group(group.name) if group else None

    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.PRODUCT,
        product_id=product.id,
        price=price,
        product_name=product.name,
        product_image=product.image_1,
        product_description=product.description,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_other_party(conversation, sender_id, message)
    return message


async def _notify_other_party(conversation: Conversation, sender_id, message: Message) -> None:
    recipient_id = (
        str(conversation.admin_id)
        if str(sender_id) == str(conversation.user_id)
        else str(conversation.user_id)
    )
    await manager.send_to_user(
        recipient_id,
        {"type": "new_message", "message": serialize_message(message).model_dump(mode="json")},
    )


def serialize_message(message: Message) -> MessageOut:
    return MessageOut(
        id=str(message.id),
        conversation_id=str(message.conversation_id),
        sender_id=str(message.sender_id),
        message_type=message.message_type.value,
        text=message.text,
        product_id=str(message.product_id) if message.product_id else None,
        price=float(message.price) if message.price is not None else None,
        product_name=message.product_name,
        product_image=message.product_image,
        product_description=message.product_description,
        created_at=message.created_at,
        read_at=message.read_at,
    )
