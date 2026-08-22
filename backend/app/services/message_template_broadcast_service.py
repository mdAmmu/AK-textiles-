"""Sends a saved message template to a group: one in-app group message
(reusing the existing group chat) plus, in the background, the linked
WhatsApp template to every member with a usable phone number.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.message_template import MessageTemplate
from app.models.user import User, UserRole
from app.services import chat_service, whatsapp_api_service, whatsapp_template_service
from app.services.whatsapp_send_service import resolve_recipients
from app.utils.whatsapp_phone import normalize_phone

logger = logging.getLogger("whatsapp")

# A double-click / retried "Send" for the same template + group within this
# window is rejected rather than sent again. Simple in-memory guard is
# enough at this stage — a single backend process, no need for a DB-backed
# idempotency system yet.
DUPLICATE_SUBMIT_WINDOW = timedelta(seconds=10)
_last_sent_at: dict[tuple[str, str], datetime] = {}


def _reject_if_duplicate_submission(group_id, template_id) -> None:
    key = (str(group_id), str(template_id))
    now = datetime.now(timezone.utc)
    last = _last_sent_at.get(key)
    if last is not None and now - last < DUPLICATE_SUBMIT_WINDOW:
        raise ValueError("This template was just sent to this group. Please wait a moment.")
    _last_sent_at[key] = now


async def send_template_to_group(
    db: Session, group: Group, admin: User, template: MessageTemplate
) -> tuple[int, list[str]]:
    """Creates the in-app group message and resolves the WhatsApp-eligible
    recipients. Returns (total_group_members, eligible_phone_numbers) — the
    caller is responsible for scheduling the actual WhatsApp sends (e.g. via
    FastAPI BackgroundTasks) so this stays fast regardless of group size.
    """
    _reject_if_duplicate_submission(group.id, template.id)

    await chat_service.send_group_text_message(db, group, admin.id, template.message)

    total_members = (
        db.query(User).filter(User.group_id == group.id, User.role == UserRole.USER).count()
    )
    recipients = resolve_recipients(db, [str(group.id)])
    phone_numbers = [normalize_phone(r.phone) for r in recipients]

    return total_members, phone_numbers


async def send_whatsapp_template(phone_numbers: list[str], title: str, message: str) -> None:
    """Runs as a FastAPI background task, after the HTTP response for the
    send request has already gone back to the browser. Fills the one
    shared, pre-approved template's single body variable with this
    template's own name/message rather than sending a per-template Meta
    template — see whatsapp_template_service.ensure_group_message_template.
    """
    body_value = whatsapp_template_service.build_body_text(title, message)
    components = [
        {"type": "body", "parameters": [{"type": "text", "text": body_value}]},
    ]
    template_name = whatsapp_template_service.GROUP_MESSAGE_TEMPLATE_NAME
    language_code = whatsapp_template_service.GROUP_MESSAGE_LANGUAGE

    for phone in phone_numbers:
        try:
            await whatsapp_api_service.send_template_message(
                to=phone,
                template_name=template_name,
                language_code=language_code,
                components=components,
            )
        except whatsapp_api_service.WhatsAppApiError:
            logger.exception("Failed to send template to %s", phone)
        except Exception:
            # One recipient's unexpected failure must never stop the rest.
            logger.exception("Unexpected error sending template to %s", phone)
