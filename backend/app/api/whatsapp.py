import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.whatsapp_broadcast import WhatsAppBroadcast
from app.models.whatsapp_message import WhatsAppMessage
from app.schemas.conversation import ConversationDetail
from app.schemas.whatsapp import (
    BroadcastCreateRequest,
    BroadcastDetailOut,
    BroadcastOut,
    BroadcastRecipientOut,
    TemplateCreateResult,
    TemplateOut,
    WhatsAppTestMessageRequest,
    WhatsAppTestMessageResult,
)
from app.services.chat_service import serialize_message
from app.services import (
    whatsapp_api_service,
    whatsapp_send_service,
    whatsapp_template_service,
    whatsapp_webhook_service,
)

logger = logging.getLogger("whatsapp")

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


@router.get("/health")
def health():
    return {"module": "whatsapp", "status": "ok"}


@router.get("/webhook")
def verify_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("x-hub-signature-256")

    if not whatsapp_webhook_service.verify_signature(body, signature):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

    payload = await request.json()
    try:
        whatsapp_webhook_service.process_webhook_payload(db, payload)
    except Exception:
        logger.exception("Failed to process WhatsApp webhook payload")
        # Swallow: Meta retries on non-200, and a malformed/unknown event
        # must never crash or block subsequent legitimate events.

    return {"status": "ok"}


@router.post("/test-message", response_model=WhatsAppTestMessageResult)
async def send_test_message(
    body: WhatsAppTestMessageRequest, _admin: User = Depends(require_admin)
):
    """Admin-only Phase 2 smoke test: sends Meta's built-in hello_world
    template (needs no custom template approval) to prove
    Backend -> Meta -> WhatsApp works end to end. Not for production use.
    """
    response = await whatsapp_api_service.send_template_message(
        to=body.to,
        template_name="hello_world",
        language_code="en_US",
    )
    external_id = response.get("messages", [{}])[0].get("id")
    return WhatsAppTestMessageResult(external_message_id=external_id, raw=response)


@router.post("/broadcasts", response_model=BroadcastOut)
async def create_broadcast(
    body: BroadcastCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    template_name = body.template_name or whatsapp_send_service.DEFAULT_TEMPLATE_NAME
    try:
        broadcast = await whatsapp_send_service.create_and_send_broadcast(
            db,
            admin,
            product_id=body.product_id,
            group_ids=body.group_ids,
            template_name=template_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return _broadcast_to_out(broadcast)


@router.get("/broadcasts", response_model=list[BroadcastOut])
def list_broadcasts(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    broadcasts = db.query(WhatsAppBroadcast).order_by(WhatsAppBroadcast.created_at.desc()).all()
    return [_broadcast_to_out(b) for b in broadcasts]


@router.get("/broadcasts/{broadcast_id}", response_model=BroadcastDetailOut)
def get_broadcast(
    broadcast_id: str, _admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    broadcast = db.query(WhatsAppBroadcast).filter(WhatsAppBroadcast.id == broadcast_id).first()
    if broadcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Broadcast not found")

    recipients = (
        db.query(WhatsAppMessage).filter(WhatsAppMessage.broadcast_id == broadcast.id).all()
    )
    return BroadcastDetailOut(
        **_broadcast_to_out(broadcast).model_dump(),
        recipients=[
            BroadcastRecipientOut(
                id=str(r.id),
                user_id=str(r.user_id),
                phone_number=r.phone_number,
                status=r.status.value,
                error_code=r.error_code,
                error_message=r.error_message,
                external_message_id=r.external_message_id,
                sent_at=r.sent_at,
                delivered_at=r.delivered_at,
                read_at=r.read_at,
                failed_at=r.failed_at,
            )
            for r in recipients
        ],
    )


@router.post("/deep-link/{product_id}", response_model=ConversationDetail)
async def open_deep_link(
    product_id: str,
    broadcast_id: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Called by the PWA landing page when a customer taps a WhatsApp
    template's CTA button. Ensures their conversation exists and (once)
    injects the product into it, then returns the conversation so the
    frontend can drop the customer straight into chat.
    """
    try:
        conversation = await whatsapp_send_service.open_deep_link(
            db, user, product_id=product_id, broadcast_id=broadcast_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ConversationDetail(
        id=str(conversation.id),
        user_id=str(conversation.user_id),
        admin_id=str(conversation.admin_id),
        user_name=user.name,
        messages=[serialize_message(m) for m in conversation.messages],
    )


@router.post("/deep-link/by-broadcast/{broadcast_id}", response_model=ConversationDetail)
async def open_deep_link_by_broadcast(
    broadcast_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """What our real product templates' button URL points to (Meta only
    allows one dynamic suffix variable per URL button, so the product is
    resolved from the broadcast rather than passed directly).
    """
    try:
        conversation = await whatsapp_send_service.open_deep_link_by_broadcast(
            db, user, broadcast_id=broadcast_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ConversationDetail(
        id=str(conversation.id),
        user_id=str(conversation.user_id),
        admin_id=str(conversation.admin_id),
        user_name=user.name,
        messages=[serialize_message(m) for m in conversation.messages],
    )


@router.get("/templates", response_model=list[TemplateOut])
async def list_templates(_admin: User = Depends(require_admin)):
    try:
        templates = await whatsapp_template_service.list_templates()
    except whatsapp_api_service.WhatsAppApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return [
        TemplateOut(
            id=t.get("id"),
            name=t.get("name", ""),
            status=t.get("status", "UNKNOWN"),
            category=t.get("category"),
            language=t.get("language"),
            is_ours=whatsapp_template_service.is_our_template(t.get("name", "")),
        )
        for t in templates
    ]


@router.post("/templates", response_model=TemplateCreateResult)
async def create_template(
    name: str = Form(...),
    category: str = Form(...),
    language_code: str = Form("en_US"),
    button_text: str = Form("View Product Detail"),
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin),
):
    image_bytes = await file.read()
    try:
        result = await whatsapp_template_service.create_product_template(
            name=name,
            category=category,
            language_code=language_code,
            button_text=button_text,
            image_bytes=image_bytes,
            image_content_type=file.content_type or "image/jpeg",
            image_filename=file.filename or "header.jpg",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except whatsapp_api_service.WhatsAppApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return TemplateCreateResult(id=result.get("id"), status=result.get("status"))


def _broadcast_to_out(broadcast: WhatsAppBroadcast) -> BroadcastOut:
    return BroadcastOut(
        id=str(broadcast.id),
        template_name=broadcast.template_name,
        product_id=str(broadcast.product_id),
        group_ids=[str(g) for g in broadcast.group_ids],
        status=broadcast.status.value,
        total_recipients=broadcast.total_recipients,
        sent_count=broadcast.sent_count,
        failed_count=broadcast.failed_count,
        created_by=str(broadcast.created_by),
        created_at=broadcast.created_at,
        updated_at=broadcast.updated_at,
    )
