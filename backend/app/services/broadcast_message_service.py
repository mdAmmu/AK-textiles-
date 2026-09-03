import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.broadcast_message import (
    Broadcast,
    BroadcastAudience,
    BroadcastAudienceMember,
    BroadcastMessageType,
    BroadcastRecipient,
    BroadcastRecipientStatus,
    BroadcastStatus,
)
from app.models.group import Group
from app.models.message import Message
from app.models.user import User, UserRole
from app.schemas.broadcast_message import BroadcastCreateRequest
from app.services.chat_service import (
    get_or_create_conversation,
    send_document_message,
    send_image_message,
    send_text_message,
)


# ---------------------------------------------------------------------------
# Audiences (reusable, named recipient lists)
# ---------------------------------------------------------------------------

def list_audiences(db: Session, owner: User) -> list[BroadcastAudience]:
    return (
        db.query(BroadcastAudience)
        .filter(BroadcastAudience.owner_id == owner.id)
        .order_by(BroadcastAudience.name)
        .all()
    )


def get_audience(db: Session, owner: User, audience_id: str) -> BroadcastAudience | None:
    return (
        db.query(BroadcastAudience)
        .filter(BroadcastAudience.id == audience_id, BroadcastAudience.owner_id == owner.id)
        .first()
    )


def create_audience(
    db: Session, owner: User, name: str, user_ids: list[str], group_ids: list[str] | None = None
) -> BroadcastAudience:
    audience = BroadcastAudience(owner_id=owner.id, name=name.strip())
    db.add(audience)
    db.flush()
    _set_audience_members(db, audience, _expand_member_ids(db, user_ids, group_ids or []))
    db.commit()
    db.refresh(audience)
    return audience


def update_audience(
    db: Session,
    audience: BroadcastAudience,
    name: str | None,
    user_ids: list[str] | None,
    group_ids: list[str] | None = None,
) -> BroadcastAudience:
    if name is not None:
        audience.name = name.strip()
    if user_ids is not None:
        _set_audience_members(db, audience, _expand_member_ids(db, user_ids, group_ids or []))
    db.commit()
    db.refresh(audience)
    return audience


def delete_audience(db: Session, audience: BroadcastAudience) -> None:
    db.delete(audience)
    db.commit()


def add_audience_members(db: Session, audience: BroadcastAudience, user_ids: list[str]) -> BroadcastAudience:
    existing = {str(m.contact_id) for m in audience.members}
    valid_ids = {
        str(u.id)
        for u in db.query(User.id).filter(User.id.in_(user_ids), User.role == UserRole.USER).all()
    }
    for user_id in valid_ids - existing:
        db.add(BroadcastAudienceMember(audience_id=audience.id, contact_id=user_id))
    db.commit()
    db.refresh(audience)
    return audience


def remove_audience_member(db: Session, audience: BroadcastAudience, user_id: str) -> None:
    db.query(BroadcastAudienceMember).filter(
        BroadcastAudienceMember.audience_id == audience.id,
        BroadcastAudienceMember.contact_id == user_id,
    ).delete(synchronize_session=False)
    db.commit()


def _expand_member_ids(db: Session, user_ids: list[str], group_ids: list[str]) -> list[str]:
    """Groups are only a picker convenience — expand them into concrete user
    ids once, so the audience stays a flat, static list of contacts.
    """
    ids = set(user_ids)
    if group_ids:
        rows = db.query(User.id).filter(User.group_id.in_(group_ids), User.role == UserRole.USER).all()
        ids.update(str(r[0]) for r in rows)
    return list(ids)


def _set_audience_members(db: Session, audience: BroadcastAudience, user_ids: list[str]) -> None:
    db.query(BroadcastAudienceMember).filter(
        BroadcastAudienceMember.audience_id == audience.id
    ).delete(synchronize_session=False)
    valid_ids = {
        str(u.id)
        for u in db.query(User.id).filter(User.id.in_(user_ids), User.role == UserRole.USER).all()
    }
    for user_id in valid_ids:
        db.add(BroadcastAudienceMember(audience_id=audience.id, contact_id=user_id))


# ---------------------------------------------------------------------------
# Broadcasts
# ---------------------------------------------------------------------------

def list_broadcasts(
    db: Session, owner: User, status: str | None = None, audience_id: str | None = None
) -> list[Broadcast]:
    query = db.query(Broadcast).filter(Broadcast.owner_id == owner.id)
    if status:
        query = query.filter(Broadcast.status == status)
    if audience_id:
        query = query.filter(Broadcast.audience_id == audience_id)
    return query.order_by(Broadcast.created_at.desc()).all()


def get_broadcast(db: Session, owner: User, broadcast_id: str) -> Broadcast | None:
    return (
        db.query(Broadcast)
        .filter(Broadcast.id == broadcast_id, Broadcast.owner_id == owner.id)
        .first()
    )


def resolve_recipient_ids(
    db: Session, owner: User, group_ids: list[str], user_ids: list[str], audience_ids: list[str]
) -> set[str]:
    """Resolve a selection (groups + individual users + saved audiences) into a
    deduplicated set of customer user ids. Never includes admins.
    """
    resolved: set[str] = set()

    if group_ids:
        rows = db.query(User.id).filter(User.group_id.in_(group_ids), User.role == UserRole.USER).all()
        resolved.update(str(r[0]) for r in rows)

    if user_ids:
        rows = db.query(User.id).filter(User.id.in_(user_ids), User.role == UserRole.USER).all()
        resolved.update(str(r[0]) for r in rows)

    if audience_ids:
        rows = (
            db.query(BroadcastAudienceMember.contact_id)
            .join(BroadcastAudience, BroadcastAudience.id == BroadcastAudienceMember.audience_id)
            .filter(
                BroadcastAudienceMember.audience_id.in_(audience_ids),
                BroadcastAudience.owner_id == owner.id,
            )
            .all()
        )
        resolved.update(str(r[0]) for r in rows)

    return resolved


def create_broadcast(db: Session, owner: User, body: BroadcastCreateRequest) -> Broadcast:
    # Idempotency: replaying the same client request must never create a
    # second broadcast (e.g. a slow network causing a double "Send" tap).
    if body.idempotency_key:
        existing = (
            db.query(Broadcast)
            .filter(
                Broadcast.owner_id == owner.id, Broadcast.idempotency_key == body.idempotency_key
            )
            .first()
        )
        if existing is not None:
            return existing

    text = body.text.strip()
    if not text:
        raise ValueError("Message text is required")

    recipient_ids = resolve_recipient_ids(db, owner, body.group_ids, body.user_ids, body.audience_ids)
    if body.send_mode != "draft" and not recipient_ids:
        raise ValueError("Select at least one recipient")

    is_draft = body.send_mode == "draft"

    # When the selection is exactly one saved audience, link the broadcast to
    # it directly — this is what lets a "broadcast thread" (one audience,
    # many sends over time) list its own message history.
    single_audience_id = body.audience_ids[0] if len(body.audience_ids) == 1 else None

    broadcast = Broadcast(
        owner_id=owner.id,
        name=(body.name or None),
        status=BroadcastStatus.DRAFT if is_draft else BroadcastStatus.QUEUED,
        audience_id=single_audience_id,
        text=text,
        reply_to_broadcast_id=body.reply_to_broadcast_id,
        selection={
            "group_ids": body.group_ids,
            "user_ids": body.user_ids,
            "audience_ids": body.audience_ids,
        },
        total_recipients=len(recipient_ids),
        idempotency_key=body.idempotency_key or f"auto:{uuid.uuid4()}",
    )
    db.add(broadcast)
    db.flush()

    # Recipient snapshot: frozen at creation time so later audience/group
    # edits never change who an already-created broadcast targets.
    for recipient_id in recipient_ids:
        db.add(
            BroadcastRecipient(
                broadcast_id=broadcast.id,
                recipient_id=recipient_id,
                status=BroadcastRecipientStatus.PENDING,
            )
        )

    db.commit()
    db.refresh(broadcast)
    return broadcast


def create_media_broadcast(
    db: Session,
    owner: User,
    audience_id: str,
    message_type: BroadcastMessageType,
    media_url: str,
    file_name: str | None,
    idempotency_key: str,
    reply_to_broadcast_id: str | None = None,
    image_group_id: str | None = None,
) -> Broadcast:
    """Same fan-out/snapshot rules as create_broadcast, but for a single
    already-uploaded image/document sent to one saved audience (the
    broadcast thread UI only ever sends within one audience at a time).
    """
    existing = (
        db.query(Broadcast)
        .filter(Broadcast.owner_id == owner.id, Broadcast.idempotency_key == idempotency_key)
        .first()
    )
    if existing is not None:
        return existing

    recipient_ids = resolve_recipient_ids(db, owner, [], [], [audience_id])
    if not recipient_ids:
        raise ValueError("Select at least one recipient")

    broadcast = Broadcast(
        owner_id=owner.id,
        status=BroadcastStatus.QUEUED,
        audience_id=audience_id,
        message_type=message_type,
        media_url=media_url,
        file_name=file_name,
        reply_to_broadcast_id=reply_to_broadcast_id,
        image_group_id=image_group_id,
        selection={"group_ids": [], "user_ids": [], "audience_ids": [audience_id]},
        total_recipients=len(recipient_ids),
        idempotency_key=idempotency_key,
    )
    db.add(broadcast)
    db.flush()

    for recipient_id in recipient_ids:
        db.add(
            BroadcastRecipient(
                broadcast_id=broadcast.id,
                recipient_id=recipient_id,
                status=BroadcastRecipientStatus.PENDING,
            )
        )

    db.commit()
    db.refresh(broadcast)
    return broadcast


def duplicate_broadcast(db: Session, owner: User, source: Broadcast) -> Broadcast:
    selection = source.selection or {}
    draft = Broadcast(
        owner_id=owner.id,
        name=f"{source.name} - Copy" if source.name else None,
        status=BroadcastStatus.DRAFT,
        message_type=source.message_type,
        text=source.text,
        media_url=source.media_url,
        file_name=source.file_name,
        selection=selection,
        total_recipients=0,
        idempotency_key=f"auto:{uuid.uuid4()}",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def delete_broadcast(db: Session, broadcast: Broadcast) -> None:
    """Removes the broadcast/recipient-snapshot metadata (so it disappears
    from the thread). The already-delivered private messages in each
    recipient's own conversation are never touched — per broadcast-working.md
    §35, a broadcast is only metadata about how a message was created.
    """
    if broadcast.status in (BroadcastStatus.QUEUED, BroadcastStatus.PROCESSING):
        raise ValueError("Wait for the broadcast to finish sending before deleting it")
    # Any later broadcast that quoted this one as a reply must not be left
    # pointing at a deleted row.
    db.query(Broadcast).filter(Broadcast.reply_to_broadcast_id == broadcast.id).update(
        {Broadcast.reply_to_broadcast_id: None}, synchronize_session=False
    )
    db.delete(broadcast)
    db.commit()


async def run_broadcast(broadcast_id: str) -> None:
    """Background delivery worker for one broadcast.

    Runs after the HTTP response has already been sent (see the `/broadcasts`
    endpoint) so the browser never blocks waiting for hundreds of sends.
    Uses its own DB session since the request-scoped session is closed by
    the time this executes.
    """
    db = SessionLocal()
    try:
        broadcast = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
        if broadcast is None or broadcast.status == BroadcastStatus.CANCELLED:
            return

        broadcast.status = BroadcastStatus.PROCESSING
        broadcast.started_at = datetime.now(timezone.utc)
        db.commit()

        pending = (
            db.query(BroadcastRecipient)
            .filter(
                BroadcastRecipient.broadcast_id == broadcast.id,
                BroadcastRecipient.status == BroadcastRecipientStatus.PENDING,
            )
            .all()
        )

        for recipient_row in pending:
            # Re-check for a cancellation requested mid-flight before each send.
            db.refresh(broadcast)
            if broadcast.status == BroadcastStatus.CANCELLED:
                break

            await _deliver_to_recipient(db, broadcast, recipient_row)

        _finalize_status(db, broadcast)
        db.commit()
    finally:
        db.close()


async def _deliver_to_recipient(db: Session, broadcast: Broadcast, recipient_row: BroadcastRecipient) -> None:
    user = db.query(User).filter(User.id == recipient_row.recipient_id, User.role == UserRole.USER).first()
    if user is None:
        recipient_row.status = BroadcastRecipientStatus.FAILED
        recipient_row.failure_reason = "Recipient no longer exists"
        broadcast.failed_count += 1
        db.commit()
        return

    try:
        conversation = get_or_create_conversation(db, user)

        reply_to_id = None
        if broadcast.reply_to_broadcast_id:
            # Quote *this same recipient's own copy* of the earlier broadcast
            # message — never another recipient's message id.
            source_recipient = (
                db.query(BroadcastRecipient)
                .filter(
                    BroadcastRecipient.broadcast_id == broadcast.reply_to_broadcast_id,
                    BroadcastRecipient.recipient_id == recipient_row.recipient_id,
                )
                .first()
            )
            if source_recipient is not None:
                reply_to_id = source_recipient.message_id

        if broadcast.message_type == BroadcastMessageType.IMAGE:
            message = await send_image_message(
                db,
                conversation,
                broadcast.owner_id,
                broadcast.media_url,
                reply_to_id,
                broadcast.image_group_id,
            )
        elif broadcast.message_type == BroadcastMessageType.DOCUMENT:
            message = await send_document_message(
                db,
                conversation,
                broadcast.owner_id,
                broadcast.media_url,
                broadcast.file_name or "document",
                reply_to_id,
            )
        else:
            message = await send_text_message(
                db, conversation, broadcast.owner_id, broadcast.text, reply_to_id
            )

        recipient_row.status = BroadcastRecipientStatus.SENT
        recipient_row.conversation_id = conversation.id
        recipient_row.message_id = message.id
        recipient_row.sent_at = message.created_at
        broadcast.sent_count += 1
    except Exception as exc:  # noqa: BLE001 - a single recipient failure must not abort the batch
        recipient_row.status = BroadcastRecipientStatus.FAILED
        recipient_row.failure_reason = str(exc)[:500]
        broadcast.failed_count += 1

    db.commit()


def _finalize_status(db: Session, broadcast: Broadcast) -> None:
    broadcast.completed_at = datetime.now(timezone.utc)
    if broadcast.status == BroadcastStatus.CANCELLED:
        return
    if broadcast.failed_count == 0:
        broadcast.status = BroadcastStatus.COMPLETED
    elif broadcast.sent_count == 0:
        broadcast.status = BroadcastStatus.FAILED
    else:
        broadcast.status = BroadcastStatus.PARTIALLY_COMPLETED


async def retry_failed(broadcast_id: str) -> None:
    """Requeue failed recipients (skips permanent failures) and re-run."""
    db = SessionLocal()
    try:
        broadcast = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
        if broadcast is None:
            return
        failed_rows = (
            db.query(BroadcastRecipient)
            .filter(
                BroadcastRecipient.broadcast_id == broadcast.id,
                BroadcastRecipient.status == BroadcastRecipientStatus.FAILED,
                BroadcastRecipient.failure_reason != "Recipient no longer exists",
            )
            .all()
        )
        for row in failed_rows:
            row.status = BroadcastRecipientStatus.PENDING
            row.failure_reason = None
            broadcast.failed_count = max(0, broadcast.failed_count - 1)
        db.commit()
    finally:
        db.close()

    await run_broadcast(broadcast_id)


def cancel_broadcast(db: Session, broadcast: Broadcast) -> Broadcast:
    if broadcast.status in (BroadcastStatus.COMPLETED, BroadcastStatus.CANCELLED):
        raise ValueError("Broadcast already finished")
    broadcast.status = BroadcastStatus.CANCELLED
    db.query(BroadcastRecipient).filter(
        BroadcastRecipient.broadcast_id == broadcast.id,
        BroadcastRecipient.status == BroadcastRecipientStatus.PENDING,
    ).update({BroadcastRecipient.status: BroadcastRecipientStatus.CANCELLED}, synchronize_session=False)
    db.commit()
    db.refresh(broadcast)
    return broadcast


async def forward_broadcast_to_groups(db: Session, broadcast: Broadcast, group_ids: list[str]) -> None:
    """Forwards a broadcast's own content (not any one recipient's private
    copy) into one or more Groups, as normal group messages.
    """
    from app.models.group import Group
    from app.services.chat_service import (
        send_group_document_message,
        send_group_image_message,
        send_group_text_message,
    )

    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    for group in groups:
        if broadcast.message_type == BroadcastMessageType.IMAGE:
            await send_group_image_message(db, group, broadcast.owner_id, broadcast.media_url)
        elif broadcast.message_type == BroadcastMessageType.DOCUMENT:
            await send_group_document_message(
                db, group, broadcast.owner_id, broadcast.media_url, broadcast.file_name or "document"
            )
        else:
            await send_group_text_message(db, group, broadcast.owner_id, broadcast.text or "")


def get_read_counts(db: Session, broadcast_ids: list[str]) -> dict[str, int]:
    """Reads are only ever taken from the existing message read-receipt
    system (Message.read_at) — never fabricated.
    """
    if not broadcast_ids:
        return {}
    rows = (
        db.query(BroadcastRecipient.broadcast_id, Message.id)
        .join(Message, Message.id == BroadcastRecipient.message_id)
        .filter(BroadcastRecipient.broadcast_id.in_(broadcast_ids), Message.read_at.isnot(None))
        .all()
    )
    counts: dict[str, int] = {}
    for broadcast_id, _ in rows:
        key = str(broadcast_id)
        counts[key] = counts.get(key, 0) + 1
    return counts
