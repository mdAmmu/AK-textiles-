"""Fan-out service: admin picks one product + one or more groups -> every
member with a usable phone number gets the product template sent to their
real WhatsApp number, individually.

This is the only place that turns a broadcast request into N Meta API
calls; whatsapp_api_service stays a dumb transport client.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.conversation import Conversation
from app.models.group import Group
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.whatsapp_broadcast import BroadcastStatus, WhatsAppBroadcast
from app.models.whatsapp_message import WhatsAppMessage, WhatsAppMessageStatus
from app.services import chat_service, whatsapp_api_service, whatsapp_template_service
from app.utils.whatsapp_phone import normalize_phone

logger = logging.getLogger("whatsapp")

# Sending is fanned out one recipient at a time (see run_broadcast) rather
# than concurrently, so a single slow/misbehaving recipient can't blow past
# Meta's per-number messaging rate limits. Fine at this scale; revisit with
# a real batching/concurrency control once broadcast sizes grow well past
# a few hundred recipients.

# A double-click / retried "Send" request within this window is treated as
# the same broadcast rather than a second one.
DUPLICATE_SUBMIT_WINDOW = timedelta(seconds=30)

# Meta's free, pre-approved utility template — used until our own
# "product_announcement" marketing template is submitted and approved.
DEFAULT_TEMPLATE_NAME = "hello_world"
DEFAULT_LANGUAGE_CODE = "en_US"


def resolve_recipients(db: Session, group_ids: list[str]) -> list[User]:
    """Members of the given groups who have a phone number we can message.
    Deduplicates by normalized phone in case a customer is reachable via
    more than one matching group membership.
    """
    members = (
        db.query(User)
        .filter(User.role == UserRole.USER, User.group_id.in_(group_ids))
        .all()
    )

    seen_phones: set[str] = set()
    recipients: list[User] = []
    for member in members:
        if not member.phone:
            continue
        normalized = normalize_phone(member.phone)
        if not normalized or normalized in seen_phones:
            continue
        seen_phones.add(normalized)
        recipients.append(member)

    return recipients


def build_deep_link(product_id, broadcast_id) -> str:
    from app.core.config import settings

    return f"{settings.frontend_base_url}/p/{product_id}?b={broadcast_id}"


def build_template_components(
    template_name: str, product: Product, broadcast_id, rate
) -> list[dict] | None:
    """Builds Meta template `components` for one of our own product
    templates: IMAGE header = the product's own image, BODY {{1}}/{{2}}/{{3}}
    = product name / quantity in bundle / rate, BUTTON {{1}} = broadcast id
    (resolved back to a product via
    /api/whatsapp/deep-link/by-broadcast/{broadcast_id} when tapped).

    hello_world (the free stand-in template) takes no variables, so this
    intentionally returns None for it.
    """
    if template_name == DEFAULT_TEMPLATE_NAME:
        return None

    quantity_text = product.quantity_in_bundle or "-"
    rate_text = f"₹{rate}" if rate is not None else "-"

    components = []
    if product.image_1:
        components.append(
            {
                "type": "header",
                "parameters": [{"type": "image", "image": {"link": product.image_1}}],
            }
        )
    components.append(
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": product.name},
                {"type": "text", "text": quantity_text},
                {"type": "text", "text": rate_text},
            ],
        }
    )
    components.append(
        {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [{"type": "text", "text": str(broadcast_id)}],
        }
    )
    return components


async def create_broadcast(
    db: Session,
    admin: User,
    product_id: str,
    group_ids: list[str],
    template_name: str = DEFAULT_TEMPLATE_NAME,
) -> WhatsAppBroadcast:
    """Validates the request and persists the broadcast + its queued
    recipient rows, then returns immediately. Does NOT talk to Meta — the
    caller (the API route) is responsible for scheduling `run_broadcast`
    (e.g. via FastAPI BackgroundTasks) to actually send the messages after
    the response has been returned to the browser. Keeping this function
    fast and Meta-call-free is what lets the request return instantly
    regardless of how many recipients a broadcast has.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise ValueError("Product not found")

    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    if len(groups) != len(group_ids):
        raise ValueError("One or more groups not found")

    if template_name != DEFAULT_TEMPLATE_NAME and not whatsapp_template_service.is_our_template(
        template_name
    ):
        raise ValueError(
            "This template wasn't created for product campaigns "
            "(wrong shape/variables) — create one via Templates first."
        )

    _reject_if_duplicate_submission(db, admin, product_id, group_ids)

    recipients = resolve_recipients(db, group_ids)

    broadcast = WhatsAppBroadcast(
        template_name=template_name,
        product_id=product.id,
        group_ids=group_ids,
        status=BroadcastStatus.DRAFT,
        total_recipients=len(recipients),
        created_by=admin.id,
    )
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    for recipient in recipients:
        phone = normalize_phone(recipient.phone)
        db.add(
            WhatsAppMessage(
                broadcast_id=broadcast.id,
                user_id=recipient.id,
                phone_number=phone,
                status=WhatsAppMessageStatus.QUEUED,
            )
        )
    db.commit()

    return broadcast


def _reject_if_duplicate_submission(
    db: Session, admin: User, product_id: str, group_ids: list[str]
) -> None:
    """Guards against a double-clicked/retried Send creating a second
    broadcast (and re-messaging every recipient) by rejecting an identical
    request from the same admin for the same product/groups made within
    DUPLICATE_SUBMIT_WINDOW of an existing non-terminal broadcast.
    """
    cutoff = datetime.now(timezone.utc) - DUPLICATE_SUBMIT_WINDOW
    same_group_set = set(str(g) for g in group_ids)

    recent = (
        db.query(WhatsAppBroadcast)
        .filter(
            WhatsAppBroadcast.created_by == admin.id,
            WhatsAppBroadcast.product_id == product_id,
            WhatsAppBroadcast.status.in_([BroadcastStatus.DRAFT, BroadcastStatus.SENDING]),
            WhatsAppBroadcast.created_at >= cutoff,
        )
        .all()
    )
    for candidate in recent:
        if set(str(g) for g in candidate.group_ids) == same_group_set:
            raise ValueError(
                "This broadcast was already submitted a moment ago and is still processing."
            )


async def run_broadcast(broadcast_id) -> None:
    """Sends every QUEUED recipient of a broadcast through the Meta Cloud
    API. Runs as a FastAPI background task, i.e. after the HTTP response
    that created the broadcast has already gone back to the browser — so it
    opens its own DB session rather than reusing the (by then closed)
    request-scoped one.
    """
    db = SessionLocal()
    try:
        broadcast = db.query(WhatsAppBroadcast).filter(WhatsAppBroadcast.id == broadcast_id).first()
        if broadcast is None:
            logger.error("run_broadcast: broadcast %s not found", broadcast_id)
            return

        product = db.query(Product).filter(Product.id == broadcast.product_id).first()
        if product is None:
            broadcast.status = BroadcastStatus.FAILED
            db.commit()
            return

        groups = db.query(Group).filter(Group.id.in_(broadcast.group_ids)).all()
        group_names_by_id = {str(g.id): g.name for g in groups}

        language_code = DEFAULT_LANGUAGE_CODE
        if broadcast.template_name != DEFAULT_TEMPLATE_NAME:
            try:
                remote_templates = await whatsapp_template_service.list_templates()
            except whatsapp_api_service.WhatsAppApiError:
                logger.exception("run_broadcast: failed to look up template status")
                broadcast.status = BroadcastStatus.FAILED
                db.commit()
                return
            matching = next(
                (t for t in remote_templates if t.get("name") == broadcast.template_name), None
            )
            if matching is None or matching.get("status") != "APPROVED":
                broadcast.status = BroadcastStatus.FAILED
                db.commit()
                return
            language_code = matching.get("language", DEFAULT_LANGUAGE_CODE)

        broadcast.status = BroadcastStatus.SENDING
        db.commit()

        pending = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.broadcast_id == broadcast.id,
                WhatsAppMessage.status == WhatsAppMessageStatus.QUEUED,
            )
            .all()
        )

        sent_count = 0
        failed_count = 0

        for wa_message in pending:
            recipient = db.query(User).filter(User.id == wa_message.user_id).first()
            group_name = group_names_by_id.get(str(recipient.group_id)) if recipient else None
            rate = product.price_for_group(group_name) if group_name else None
            components = build_template_components(
                broadcast.template_name, product, broadcast.id, rate
            )

            try:
                response = await whatsapp_api_service.send_template_message(
                    to=wa_message.phone_number,
                    template_name=broadcast.template_name,
                    language_code=language_code,
                    components=components,
                )
                external_id = response.get("messages", [{}])[0].get("id")
                wa_message.external_message_id = external_id
                wa_message.status = WhatsAppMessageStatus.SENT
                wa_message.sent_at = datetime.now(timezone.utc)
                sent_count += 1
            except whatsapp_api_service.WhatsAppApiError as exc:
                wa_message.status = WhatsAppMessageStatus.FAILED
                wa_message.error_code = exc.code
                wa_message.error_message = str(exc)
                wa_message.failed_at = datetime.now(timezone.utc)
                failed_count += 1
            except Exception:
                # Never let one recipient's unexpected failure kill the
                # whole broadcast loop.
                logger.exception(
                    "run_broadcast: unexpected error sending to %s", wa_message.phone_number
                )
                wa_message.status = WhatsAppMessageStatus.FAILED
                wa_message.error_code = "internal_error"
                wa_message.error_message = "Unexpected error while sending"
                wa_message.failed_at = datetime.now(timezone.utc)
                failed_count += 1

            db.commit()

        broadcast.sent_count = sent_count
        broadcast.failed_count = failed_count
        if sent_count == 0:
            broadcast.status = BroadcastStatus.FAILED
        elif failed_count > 0:
            broadcast.status = BroadcastStatus.PARTIALLY_COMPLETED
        else:
            broadcast.status = BroadcastStatus.COMPLETED
        db.commit()
    finally:
        db.close()


async def open_deep_link(
    db: Session, user: User, product_id: str, broadcast_id: str | None
) -> Conversation:
    """Customer tapped the WhatsApp template's CTA and landed in our PWA.

    Ensures the customer's conversation with admin exists and, on the
    *first* open for this (broadcast, user) pair, injects the product's
    images + detail card into that conversation so the admin sees it —
    same shape as an admin-sent product message, just attributed to the
    customer and stamped with the originating broadcast for analytics.
    Re-opening the same link (page refresh, revisit) does not resend.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise ValueError("Product not found")

    conversation = chat_service.get_or_create_conversation(db, user)

    wa_message = None
    if broadcast_id:
        wa_message = (
            db.query(WhatsAppMessage)
            .filter(
                WhatsAppMessage.broadcast_id == broadcast_id,
                WhatsAppMessage.user_id == user.id,
            )
            .first()
        )

    already_opened = wa_message is not None and wa_message.clicked_at is not None

    if not already_opened:
        if wa_message is not None:
            wa_message.clicked_at = datetime.now(timezone.utc)
            db.commit()

        await chat_service.send_product_message(
            db, conversation, user.id, product, whatsapp_broadcast_id=broadcast_id
        )

    db.refresh(conversation)
    return conversation


async def open_deep_link_by_broadcast(
    db: Session, user: User, broadcast_id: str
) -> Conversation:
    """Same as open_deep_link, but keyed by broadcast id alone — this is
    what our real product templates' button URL encodes (Meta only allows
    one dynamic suffix variable per URL button, so it can't carry both a
    product id and a broadcast id). The product is resolved from the
    broadcast itself.
    """
    broadcast = db.query(WhatsAppBroadcast).filter(WhatsAppBroadcast.id == broadcast_id).first()
    if broadcast is None:
        raise ValueError("Broadcast not found")

    return await open_deep_link(
        db, user, product_id=str(broadcast.product_id), broadcast_id=broadcast_id
    )
