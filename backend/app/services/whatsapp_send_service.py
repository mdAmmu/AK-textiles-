"""Fan-out service: admin picks one product + one or more groups -> every
member with a usable phone number gets the product template sent to their
real WhatsApp number, individually.

This is the only place that turns a broadcast request into N Meta API
calls; whatsapp_api_service stays a dumb transport client.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.group import Group
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.whatsapp_broadcast import BroadcastStatus, WhatsAppBroadcast
from app.models.whatsapp_message import WhatsAppMessage, WhatsAppMessageStatus
from app.services import chat_service, whatsapp_api_service, whatsapp_template_service
from app.utils.whatsapp_phone import normalize_phone

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


async def create_and_send_broadcast(
    db: Session,
    admin: User,
    product_id: str,
    group_ids: list[str],
    template_name: str = DEFAULT_TEMPLATE_NAME,
) -> WhatsAppBroadcast:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise ValueError("Product not found")

    groups = db.query(Group).filter(Group.id.in_(group_ids)).all()
    if len(groups) != len(group_ids):
        raise ValueError("One or more groups not found")

    recipients = resolve_recipients(db, group_ids)
    group_names_by_id = {str(g.id): g.name for g in groups}

    language_code = DEFAULT_LANGUAGE_CODE
    if template_name != DEFAULT_TEMPLATE_NAME:
        if not whatsapp_template_service.is_our_template(template_name):
            raise ValueError(
                "This template wasn't created for product campaigns "
                "(wrong shape/variables) — create one via Templates first."
            )
        remote_templates = await whatsapp_template_service.list_templates()
        matching = next((t for t in remote_templates if t.get("name") == template_name), None)
        if matching is None or matching.get("status") != "APPROVED":
            raise ValueError("Template not found or not yet approved by Meta.")
        language_code = matching.get("language", DEFAULT_LANGUAGE_CODE)

    broadcast = WhatsAppBroadcast(
        template_name=template_name,
        product_id=product.id,
        group_ids=group_ids,
        status=BroadcastStatus.SENDING,
        total_recipients=len(recipients),
        created_by=admin.id,
    )
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    sent_count = 0
    failed_count = 0

    for recipient in recipients:
        phone = normalize_phone(recipient.phone)
        group_name = group_names_by_id.get(str(recipient.group_id))
        rate = product.price_for_group(group_name) if group_name else None
        components = build_template_components(template_name, product, broadcast.id, rate)

        wa_message = WhatsAppMessage(
            broadcast_id=broadcast.id,
            user_id=recipient.id,
            phone_number=phone,
            status=WhatsAppMessageStatus.QUEUED,
        )
        db.add(wa_message)
        db.commit()
        db.refresh(wa_message)

        try:
            response = await whatsapp_api_service.send_template_message(
                to=phone,
                template_name=template_name,
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

        db.commit()

    broadcast.sent_count = sent_count
    broadcast.failed_count = failed_count
    broadcast.status = BroadcastStatus.COMPLETED if sent_count > 0 else BroadcastStatus.FAILED
    db.commit()
    db.refresh(broadcast)

    return broadcast


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
