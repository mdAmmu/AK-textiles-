import hashlib
import hmac
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.whatsapp_event import WhatsAppEvent
from app.models.whatsapp_message import WhatsAppMessage, WhatsAppMessageStatus
from app.services import chat_service
from app.utils.whatsapp_phone import find_user_by_wa_number

logger = logging.getLogger("whatsapp")


def verify_signature(body: bytes, signature_header: str | None) -> bool:
    """Validates Meta's X-Hub-Signature-256 header against the raw request body."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        settings.whatsapp_app_secret.encode(), body, hashlib.sha256
    ).hexdigest()
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)


_STATUS_MAP = {
    "sent": WhatsAppMessageStatus.SENT,
    "delivered": WhatsAppMessageStatus.DELIVERED,
    "read": WhatsAppMessageStatus.READ,
    "failed": WhatsAppMessageStatus.FAILED,
}


async def process_webhook_payload(db: Session, payload: dict) -> None:
    """Processes a Meta webhook payload: status updates for outbound
    broadcast sends, and inbound text messages from customers.

    Idempotent — a status event is deduped by message id + status, and an
    inbound message is deduped by its wamid — so Meta redelivering the same
    webhook call (which it does on anything but a prompt 200) is safe.
    """
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for status_event in value.get("statuses", []):
                _process_status_event(db, status_event)
            for inbound_message in value.get("messages", []):
                await _process_inbound_message(db, inbound_message)


def _process_status_event(db: Session, status_event: dict) -> None:
    external_message_id = status_event.get("id")
    status_value = status_event.get("status")
    if not external_message_id or status_value not in _STATUS_MAP:
        return

    external_event_id = f"{external_message_id}:{status_value}"
    if db.query(WhatsAppEvent).filter(
        WhatsAppEvent.external_event_id == external_event_id
    ).first():
        return  # already processed, dedupe

    event = WhatsAppEvent(
        external_event_id=external_event_id,
        event_type=f"status.{status_value}",
        processed=True,
        processed_at=datetime.now(timezone.utc),
    )
    db.add(event)

    message = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.external_message_id == external_message_id)
        .first()
    )
    if message is not None:
        new_status = _STATUS_MAP[status_value]
        message.status = new_status
        now = datetime.now(timezone.utc)
        if new_status == WhatsAppMessageStatus.SENT:
            message.sent_at = now
        elif new_status == WhatsAppMessageStatus.DELIVERED:
            message.delivered_at = now
        elif new_status == WhatsAppMessageStatus.READ:
            message.read_at = now
        elif new_status == WhatsAppMessageStatus.FAILED:
            message.failed_at = now
            errors = status_event.get("errors", [])
            if errors:
                message.error_code = str(errors[0].get("code", ""))
                message.error_message = errors[0].get("title", "")

    db.commit()


async def _process_inbound_message(db: Session, inbound_message: dict) -> None:
    wa_message_id = inbound_message.get("id")
    from_number = inbound_message.get("from")
    message_type = inbound_message.get("type")
    if not wa_message_id or not from_number:
        return

    if message_type == "text":
        text = inbound_message.get("text", {}).get("body", "")
    else:
        # Media/location/interactive/etc. — not transcribed yet; still land
        # a placeholder so the admin knows the customer sent *something* and
        # can follow up on WhatsApp directly for now.
        text = f"[Customer sent a {message_type or 'unsupported'} message on WhatsApp]"

    customer = find_user_by_wa_number(db, from_number)
    if customer is None:
        logger.warning(
            "Inbound WhatsApp message from unregistered number %s (wamid=%s)",
            from_number,
            wa_message_id,
        )
        return

    await chat_service.receive_whatsapp_text_message(db, customer, text, wa_message_id)
