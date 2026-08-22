import hashlib
import hmac
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.whatsapp_event import WhatsAppEvent
from app.models.whatsapp_message import WhatsAppMessage, WhatsAppMessageStatus


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


def process_webhook_payload(db: Session, payload: dict) -> None:
    """Processes a Meta webhook payload: status updates for outbound messages.

    Idempotent per external event id (a status object's message id + status
    combination is treated as the unique event).
    """
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for status_event in value.get("statuses", []):
                _process_status_event(db, status_event)


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
