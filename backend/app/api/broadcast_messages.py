import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.image_utils import normalize_image
from app.core.supabase_client import upload_chat_file, upload_chat_image
from app.models.broadcast_message import (
    Broadcast,
    BroadcastAudience,
    BroadcastMessageType,
    BroadcastRecipient,
    BroadcastStatus,
)
from app.models.user import User, UserRole
from app.schemas.broadcast_message import (
    BroadcastAudienceCreate,
    BroadcastAudienceDetailOut,
    BroadcastAudienceOut,
    BroadcastAudienceUpdate,
    BroadcastCreateRequest,
    BroadcastDetailOut,
    BroadcastOut,
    BroadcastRecipientOut,
)
from app.services import broadcast_message_service as service

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])

MAX_DOCUMENT_BYTES = 20 * 1024 * 1024  # 20 MB


class ForwardBroadcastRequest(BaseModel):
    group_ids: list[str]


# ---------------------------------------------------------------------------
# Audiences
# ---------------------------------------------------------------------------

@router.get("/audiences", response_model=list[BroadcastAudienceOut])
def get_audiences(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    audiences = service.list_audiences(db, admin)
    return [_audience_out(a) for a in audiences]


@router.post("/audiences", response_model=BroadcastAudienceOut)
def create_audience(
    body: BroadcastAudienceCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audience name is required")
    audience = service.create_audience(db, admin, name, body.user_ids, body.group_ids)
    return _audience_out(audience)


@router.get("/audiences/{audience_id}", response_model=BroadcastAudienceDetailOut)
def get_audience(
    audience_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    audience = _get_audience_or_404(db, admin, audience_id)
    return BroadcastAudienceDetailOut(
        **_audience_out(audience).model_dump(),
        member_ids=[str(m.contact_id) for m in audience.members],
    )


@router.patch("/audiences/{audience_id}", response_model=BroadcastAudienceOut)
def update_audience(
    audience_id: str,
    body: BroadcastAudienceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    audience = _get_audience_or_404(db, admin, audience_id)
    audience = service.update_audience(db, audience, body.name, body.user_ids, body.group_ids)
    return _audience_out(audience)


@router.delete("/audiences/{audience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audience(
    audience_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    audience = _get_audience_or_404(db, admin, audience_id)
    service.delete_audience(db, audience)


# ---------------------------------------------------------------------------
# Broadcasts
# ---------------------------------------------------------------------------

@router.get("", response_model=list[BroadcastOut])
def get_broadcasts(
    status_filter: str | None = None,
    audience_id: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    broadcasts = service.list_broadcasts(db, admin, status_filter, audience_id)
    read_counts = service.get_read_counts(db, [str(b.id) for b in broadcasts])
    return [_broadcast_out(b, read_counts) for b in broadcasts]


@router.post("", response_model=BroadcastOut)
async def create_broadcast(
    body: BroadcastCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    try:
        broadcast = service.create_broadcast(db, admin, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if broadcast.status == BroadcastStatus.QUEUED:
        # Delivery happens after the response is sent — the browser must
        # never wait for hundreds of private messages to go out.
        background_tasks.add_task(service.run_broadcast, str(broadcast.id))

    return _broadcast_out(broadcast, {})


@router.post("/audiences/{audience_id}/media", response_model=list[BroadcastOut])
async def send_media_broadcast(
    audience_id: str,
    files: list[UploadFile],
    background_tasks: BackgroundTasks,
    reply_to_broadcast_id: str | None = Form(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Uploads each image/document once, then fans each out as an
    independent private message to every recipient in this audience — the
    media equivalent of POST /broadcasts for the broadcast thread UI.

    Multiple images sent together share an image_group_id so they render
    grouped in each recipient's chat, like a normal multi-image send.
    """
    _get_audience_or_404(db, admin, audience_id)

    image_count = sum(1 for f in files if (f.content_type or "").startswith("image/"))
    shared_image_group_id = uuid.uuid4() if image_count > 1 else None

    broadcasts = []
    for file in files:
        content_type = file.content_type or "application/octet-stream"
        is_image = content_type.startswith("image/")

        content = await file.read()
        if len(content) > MAX_DOCUMENT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="File is too large (max 20MB)"
            )

        if is_image:
            content, content_type, extension = normalize_image(content, content_type, file.filename)
            storage_name = f"broadcasts/{audience_id}/{uuid.uuid4()}.{extension}"
            url = upload_chat_image(storage_name, content, content_type)
            message_type = BroadcastMessageType.IMAGE
            image_group_id = shared_image_group_id
        else:
            original_name = file.filename or "document"
            extension = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
            storage_name = f"broadcasts/{audience_id}/{uuid.uuid4()}.{extension}"
            url = upload_chat_file(storage_name, content, content_type)
            message_type = BroadcastMessageType.DOCUMENT
            image_group_id = None

        try:
            broadcast = service.create_media_broadcast(
                db,
                admin,
                audience_id,
                message_type,
                url,
                file.filename,
                idempotency_key=f"auto:{uuid.uuid4()}",
                reply_to_broadcast_id=reply_to_broadcast_id,
                image_group_id=image_group_id,
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        if broadcast.status == BroadcastStatus.QUEUED:
            background_tasks.add_task(service.run_broadcast, str(broadcast.id))
        broadcasts.append(broadcast)

    return [_broadcast_out(b, {}) for b in broadcasts]


@router.get("/{broadcast_id}", response_model=BroadcastDetailOut)
def get_broadcast(
    broadcast_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    return _broadcast_detail_out(db, broadcast)


@router.get("/{broadcast_id}/recipients", response_model=list[BroadcastRecipientOut])
def get_broadcast_recipients(
    broadcast_id: str,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    return _recipient_rows(db, broadcast, status_filter)


@router.post("/{broadcast_id}/retry-failed", response_model=BroadcastOut)
async def retry_failed(
    broadcast_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    background_tasks.add_task(service.retry_failed, str(broadcast.id))
    return _broadcast_out(broadcast, {})


@router.post("/{broadcast_id}/cancel", response_model=BroadcastOut)
def cancel_broadcast(
    broadcast_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    try:
        broadcast = service.cancel_broadcast(db, broadcast)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _broadcast_out(broadcast, {})


@router.post("/{broadcast_id}/duplicate", response_model=BroadcastOut)
def duplicate_broadcast(
    broadcast_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    source = _get_broadcast_or_404(db, admin, broadcast_id)
    draft = service.duplicate_broadcast(db, admin, source)
    return _broadcast_out(draft, {})


@router.post("/{broadcast_id}/forward", status_code=status.HTTP_204_NO_CONTENT)
async def forward_broadcast(
    broadcast_id: str,
    body: ForwardBroadcastRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    await service.forward_broadcast_to_groups(db, broadcast, body.group_ids)


@router.delete("/{broadcast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_broadcast(
    broadcast_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    broadcast = _get_broadcast_or_404(db, admin, broadcast_id)
    try:
        service.delete_broadcast(db, broadcast)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _get_audience_or_404(db: Session, admin: User, audience_id: str) -> BroadcastAudience:
    audience = service.get_audience(db, admin, audience_id)
    if audience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audience not found")
    return audience


def _get_broadcast_or_404(db: Session, admin: User, broadcast_id: str) -> Broadcast:
    broadcast = service.get_broadcast(db, admin, broadcast_id)
    if broadcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Broadcast not found")
    return broadcast


def _audience_out(audience: BroadcastAudience) -> BroadcastAudienceOut:
    return BroadcastAudienceOut(
        id=str(audience.id),
        name=audience.name,
        member_count=len(audience.members),
        created_at=audience.created_at,
        updated_at=audience.updated_at,
    )


def _broadcast_out(broadcast: Broadcast, read_counts: dict[str, int]) -> BroadcastOut:
    read_count = read_counts.get(str(broadcast.id), 0)
    return BroadcastOut(
        id=str(broadcast.id),
        name=broadcast.name,
        status=broadcast.status.value,
        message_type=broadcast.message_type.value,
        text=broadcast.text,
        media_url=broadcast.media_url,
        file_name=broadcast.file_name,
        reply_to_broadcast_id=str(broadcast.reply_to_broadcast_id) if broadcast.reply_to_broadcast_id else None,
        image_group_id=str(broadcast.image_group_id) if broadcast.image_group_id else None,
        total_recipients=broadcast.total_recipients,
        sent_count=broadcast.sent_count,
        failed_count=broadcast.failed_count,
        delivered_count=broadcast.sent_count,
        read_count=read_count,
        created_at=broadcast.created_at,
        started_at=broadcast.started_at,
        completed_at=broadcast.completed_at,
    )


def _broadcast_detail_out(db: Session, broadcast: Broadcast) -> BroadcastDetailOut:
    read_counts = service.get_read_counts(db, [str(broadcast.id)])
    base = _broadcast_out(broadcast, read_counts)
    return BroadcastDetailOut(**base.model_dump(), recipients=_recipient_rows(db, broadcast, None))


def _recipient_rows(
    db: Session, broadcast: Broadcast, status_filter: str | None
) -> list[BroadcastRecipientOut]:
    from app.models.message import Message

    query = (
        db.query(BroadcastRecipient, User, Message)
        .join(User, User.id == BroadcastRecipient.recipient_id)
        .outerjoin(Message, Message.id == BroadcastRecipient.message_id)
        .filter(BroadcastRecipient.broadcast_id == broadcast.id, User.role == UserRole.USER)
    )
    if status_filter:
        query = query.filter(BroadcastRecipient.status == status_filter)

    rows = query.order_by(User.name).all()
    return [
        BroadcastRecipientOut(
            id=str(recipient.id),
            recipient_id=str(recipient.recipient_id),
            recipient_name=user.name,
            recipient_phone=user.phone,
            status=recipient.status.value,
            failure_reason=recipient.failure_reason,
            sent_at=recipient.sent_at,
            read_at=message.read_at if message else None,
        )
        for recipient, user, message in rows
    ]
