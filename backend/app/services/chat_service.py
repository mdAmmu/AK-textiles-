from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.group import Group
from app.models.group_read import GroupRead
from app.models.message import Message, MessageType
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.message import MessageOut, ReplyPreview
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
    db: Session, conversation: Conversation, sender_id, text: str, reply_to_id=None
) -> Message:
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.TEXT,
        text=text,
        reply_to_id=reply_to_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_other_party(conversation, sender_id, message)
    return message


async def send_product_message(
    db: Session, conversation: Conversation, sender_id, product: Product
) -> list[Message]:
    """Sends all of the product's images one by one, followed by a final
    product detail card (name/description/price).

    Price is always resolved server-side from the customer's group —
    never trust a client-supplied price.
    """
    customer = db.query(User).filter(User.id == conversation.user_id).first()
    group = db.query(Group).filter(Group.id == customer.group_id).first() if customer else None
    price = product.price_for_group(group.name) if group else None

    messages: list[Message] = []

    image_urls = [product.image_1, product.image_2, product.image_3, product.image_4]
    for url in image_urls:
        if not url:
            continue
        image_message = Message(
            conversation_id=conversation.id,
            sender_id=sender_id,
            message_type=MessageType.IMAGE,
            product_id=product.id,
            product_image=url,
        )
        db.add(image_message)
        db.commit()
        db.refresh(image_message)
        await _notify_other_party(conversation, sender_id, image_message)
        messages.append(image_message)

    detail_message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.PRODUCT,
        product_id=product.id,
        price=price,
        product_name=product.name,
        product_image=product.image_1,
        product_description=product.description,
    )
    db.add(detail_message)
    db.commit()
    db.refresh(detail_message)
    await _notify_other_party(conversation, sender_id, detail_message)
    messages.append(detail_message)

    return messages


async def send_image_message(
    db: Session,
    conversation: Conversation,
    sender_id,
    image_url: str,
    reply_to_id=None,
    image_group_id=None,
) -> Message:
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.IMAGE,
        product_image=image_url,
        reply_to_id=reply_to_id,
        image_group_id=image_group_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_other_party(conversation, sender_id, message)
    return message


async def send_document_message(
    db: Session, conversation: Conversation, sender_id, file_url: str, file_name: str, reply_to_id=None
) -> Message:
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        message_type=MessageType.DOCUMENT,
        product_image=file_url,
        file_name=file_name,
        reply_to_id=reply_to_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_other_party(conversation, sender_id, message)
    return message


async def send_group_text_message(
    db: Session, group: Group, sender_id, text: str, reply_to_id=None
) -> Message:
    message = Message(
        group_id=group.id,
        sender_id=sender_id,
        message_type=MessageType.TEXT,
        text=text,
        reply_to_id=reply_to_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_group_members(db, group, message)
    return message


async def send_group_product_message(
    db: Session, group: Group, sender_id, product: Product
) -> list[Message]:
    """Same shape as send_product_message, but fans the message out to every
    member of the group instead of a single 1:1 conversation.
    """
    price = product.price_for_group(group.name)

    messages: list[Message] = []

    image_urls = [product.image_1, product.image_2, product.image_3, product.image_4]
    for url in image_urls:
        if not url:
            continue
        image_message = Message(
            group_id=group.id,
            sender_id=sender_id,
            message_type=MessageType.IMAGE,
            product_id=product.id,
            product_image=url,
        )
        db.add(image_message)
        db.commit()
        db.refresh(image_message)
        await _notify_group_members(db, group, image_message)
        messages.append(image_message)

    detail_message = Message(
        group_id=group.id,
        sender_id=sender_id,
        message_type=MessageType.PRODUCT,
        product_id=product.id,
        price=price,
        product_name=product.name,
        product_image=product.image_1,
        product_description=product.description,
    )
    db.add(detail_message)
    db.commit()
    db.refresh(detail_message)
    await _notify_group_members(db, group, detail_message)
    messages.append(detail_message)

    return messages


async def send_group_image_message(
    db: Session, group: Group, sender_id, image_url: str, image_group_id=None
) -> Message:
    message = Message(
        group_id=group.id,
        sender_id=sender_id,
        message_type=MessageType.IMAGE,
        product_image=image_url,
        image_group_id=image_group_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_group_members(db, group, message)
    return message


async def send_group_document_message(
    db: Session, group: Group, sender_id, file_url: str, file_name: str
) -> Message:
    message = Message(
        group_id=group.id,
        sender_id=sender_id,
        message_type=MessageType.DOCUMENT,
        product_image=file_url,
        file_name=file_name,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await _notify_group_members(db, group, message)
    return message


async def edit_group_message(db: Session, group: Group, message_id: str, text: str) -> Message:
    message = (
        db.query(Message)
        .filter(
            Message.group_id == group.id,
            Message.id == message_id,
            Message.message_type == MessageType.TEXT,
            Message.is_deleted.is_(False),
        )
        .first()
    )
    if message is None:
        raise ValueError("Message not found")

    message.text = text
    message.is_edited = True
    db.commit()
    db.refresh(message)

    await _notify_group_members(db, group, message, event_type="group_message_edited")
    return message


async def delete_group(db: Session, group: Group) -> list[str]:
    """Deletes a group along with its messages, and unassigns + kicks out its members."""
    members = db.query(User).filter(User.group_id == group.id).all()
    member_ids = [str(m.id) for m in members]

    db.query(Message).filter(Message.group_id == group.id).delete(synchronize_session=False)
    db.query(GroupRead).filter(GroupRead.group_id == group.id).delete(synchronize_session=False)
    db.query(User).filter(User.group_id == group.id).update(
        {User.group_id: None}, synchronize_session=False
    )
    db.delete(group)
    db.commit()

    for member_id in member_ids:
        await manager.send_to_user(
            member_id, {"type": "group_deleted", "group_id": str(group.id)}
        )

    return member_ids


async def delete_group_messages(db: Session, group: Group, message_ids: list[str]) -> list[str]:
    messages = (
        db.query(Message)
        .filter(Message.group_id == group.id, Message.id.in_(message_ids))
        .all()
    )
    deleted_ids = [str(m.id) for m in messages]
    for message in messages:
        # Soft delete: keep the row (with its timestamp) so the chat can show
        # a "You deleted this message" placeholder in its place.
        message.is_deleted = True
    db.commit()

    if deleted_ids:
        members = db.query(User).filter(User.group_id == group.id).all()
        payload = {
            "type": "group_messages_deleted",
            "group_id": str(group.id),
            "message_ids": deleted_ids,
        }
        for member in members:
            await manager.send_to_user(str(member.id), payload)

    return deleted_ids


async def forward_group_messages(
    db: Session,
    source_messages: list[Message],
    target_groups: list[Group],
    sender_id,
    image_group_id=None,
) -> list[Message]:
    """Forwards messages as-is by default, preserving each source message's own
    image_group_id (so an already-grouped batch stays grouped). When
    `image_group_id` is passed explicitly, every forwarded IMAGE message is
    stamped with it instead — used to fold images that weren't originally
    sent together into one new grid when the admin forwards a mixed
    selection as a single batch.
    """
    forwarded: list[Message] = []
    for target_group in target_groups:
        for source in source_messages:
            copy = Message(
                group_id=target_group.id,
                sender_id=sender_id,
                message_type=source.message_type,
                text=source.text,
                product_id=source.product_id,
                price=source.price,
                product_name=source.product_name,
                product_image=source.product_image,
                product_description=source.product_description,
                file_name=source.file_name,
                image_group_id=(
                    image_group_id
                    if image_group_id is not None and source.message_type == MessageType.IMAGE
                    else source.image_group_id
                ),
            )
            db.add(copy)
            db.commit()
            db.refresh(copy)
            await _notify_group_members(db, target_group, copy)
            forwarded.append(copy)
    return forwarded


async def _notify_group_members(
    db: Session, group: Group, message: Message, event_type: str = "new_group_message"
) -> None:
    """Real group chat: every member of the group (any role) sees every
    message, and every admin sees it live too — not just USER-role members.
    """
    members = db.query(User).filter(User.group_id == group.id).all()
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    recipient_ids = {str(u.id) for u in members} | {str(a.id) for a in admins}
    recipient_ids.discard(str(message.sender_id))

    payload = {
        "type": event_type,
        "group_id": str(group.id),
        "message": serialize_message(message).model_dump(mode="json"),
    }
    for recipient_id in recipient_ids:
        await manager.send_to_user(recipient_id, payload)


async def mark_conversation_read(db: Session, conversation: Conversation, reader_id) -> list[Message]:
    unread = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation.id,
            Message.sender_id != reader_id,
            Message.read_at.is_(None),
        )
        .all()
    )
    if not unread:
        return []

    now = datetime.now(timezone.utc)
    for message in unread:
        message.read_at = now
    db.commit()

    sender_ids = {str(m.sender_id) for m in unread}
    for sender_id in sender_ids:
        await manager.send_to_user(
            sender_id,
            {
                "type": "messages_read",
                "conversation_id": str(conversation.id),
                "message_ids": [str(m.id) for m in unread if str(m.sender_id) == sender_id],
            },
        )

    return unread


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
    reply_to = None
    if message.reply_to_id and message.reply_to is not None:
        r = message.reply_to
        reply_to = ReplyPreview(
            id=str(r.id),
            sender_id=str(r.sender_id),
            message_type=r.message_type.value,
            text=r.text,
            file_name=r.file_name,
            is_deleted=r.is_deleted,
        )

    return MessageOut(
        id=str(message.id),
        conversation_id=str(message.conversation_id) if message.conversation_id else None,
        group_id=str(message.group_id) if message.group_id else None,
        sender_id=str(message.sender_id),
        message_type=message.message_type.value,
        text=message.text,
        product_id=str(message.product_id) if message.product_id else None,
        price=float(message.price) if message.price is not None else None,
        product_name=message.product_name,
        product_image=message.product_image,
        product_description=message.product_description,
        file_name=message.file_name,
        image_group_id=str(message.image_group_id) if message.image_group_id else None,
        reply_to=reply_to,
        is_deleted=message.is_deleted,
        is_edited=message.is_edited,
        created_at=message.created_at,
        read_at=message.read_at,
    )


async def delete_conversation_messages(
    db: Session, conversation: Conversation, message_ids: list[str], deleter_id
) -> list[str]:
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id, Message.id.in_(message_ids))
        .all()
    )
    deleted_ids = [str(m.id) for m in messages]
    for message in messages:
        message.is_deleted = True
    db.commit()

    if deleted_ids:
        other_party_id = (
            str(conversation.admin_id)
            if str(deleter_id) == str(conversation.user_id)
            else str(conversation.user_id)
        )
        await manager.send_to_user(
            other_party_id,
            {
                "type": "conversation_messages_deleted",
                "conversation_id": str(conversation.id),
                "message_ids": deleted_ids,
            },
        )

    return deleted_ids


async def forward_messages_to_groups(
    db: Session,
    source_messages: list[Message],
    target_groups: list[Group],
    sender_id,
) -> list[Message]:
    """Forwards messages (from a 1-1 conversation or another group) into one
    or more groups, as fresh copies — never re-parented, never carrying the
    original reply_to across (the quoted message may not exist in the
    target group).
    """
    forwarded: list[Message] = []
    for target_group in target_groups:
        for source in source_messages:
            copy = Message(
                group_id=target_group.id,
                sender_id=sender_id,
                message_type=source.message_type,
                text=source.text,
                product_id=source.product_id,
                price=source.price,
                product_name=source.product_name,
                product_image=source.product_image,
                product_description=source.product_description,
                file_name=source.file_name,
            )
            db.add(copy)
            db.commit()
            db.refresh(copy)
            await _notify_group_members(db, target_group, copy)
            forwarded.append(copy)
    return forwarded
