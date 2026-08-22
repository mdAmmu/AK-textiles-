"""Template management: list what's registered on the WABA, and create new
product-announcement-shaped templates for Meta's approval.

We don't let admins design arbitrary templates — every template created
here follows the same fixed shape our send flow (whatsapp_send_service)
knows how to fill in:
    HEADER  = product image
    BODY    {{1}} = product name, {{2}} = quantity in bundle, {{3}} = rate
    BUTTON  {{1}} = broadcast id (for the deep-link redirect)
"""

from app.core.config import settings
from app.services import whatsapp_api_service

BODY_TEMPLATE_TEXT = (
    "🆕 {{1}}\n\nQuantity in bundle: {{2}}\nRate: {{3}}\n\nTap below to view full details and order."
)

# Every template we create is prefixed so the campaign UI can tell our own
# product-announcement-shaped templates apart from other templates that
# might already exist on the WABA (Meta's sample templates, hand-made ones
# with a different shape, etc.) — sending through this app assumes the
# fixed HEADER-image + 3-body-variable + URL-button shape, so anything not
# created here must never be selectable in the campaign picker.
NAME_PREFIX = "ak_broadcast_"


def is_our_template(name: str) -> bool:
    return name.startswith(NAME_PREFIX)


async def list_templates() -> list[dict]:
    return await whatsapp_api_service.get_templates()


async def create_product_template(
    *,
    name: str,
    category: str,
    language_code: str,
    button_text: str,
    image_bytes: bytes,
    image_content_type: str,
    image_filename: str,
) -> dict:
    handle = await whatsapp_api_service.upload_template_header_image(
        image_bytes, image_content_type, image_filename
    )

    redirect_base = f"{settings.frontend_base_url}/w"
    full_name = name if is_our_template(name) else f"{NAME_PREFIX}{name}"

    payload = {
        "name": full_name,
        "language": language_code,
        "category": category,
        "components": [
            {
                "type": "HEADER",
                "format": "IMAGE",
                "example": {"header_handle": [handle]},
            },
            {
                "type": "BODY",
                "text": BODY_TEMPLATE_TEXT,
                "example": {"body_text": [["Sample Product Name", "12 pcs / box", "₹500"]]},
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {
                        "type": "URL",
                        "text": button_text,
                        "url": f"{redirect_base}/{{{{1}}}}",
                        "example": [f"{redirect_base}/sample-broadcast-id"],
                    }
                ],
            },
        ],
    }

    return await whatsapp_api_service.create_template(payload)


# Group-chat message templates (Message Templates admin screen) all reuse
# ONE Meta template shape with a variable header + variable body, rather
# than creating (and waiting for approval on) a brand-new Meta template per
# admin-created template. Meta only needs to approve the *shape* once —
# after that, every send just fills {{1}} in the header and {{1}} in the
# body with that template's own name/message, the same way the product
# broadcast feature fills in per-product variables on its own approved
# template. This is what makes "create a template, click Send, it goes out
# now" actually possible (a fresh custom template would sit in Meta review
# for anywhere from minutes to ~24h *every single time*).
GROUP_MESSAGE_TEMPLATE_NAME = "ak_group_message_v2"
GROUP_MESSAGE_LANGUAGE = "en_US"


# Meta rejects a HEADER component that contains any formatting/emoji, and
# rejects a BODY that's just a bare variable (no literal text around it, or
# too high a variable-to-word ratio) — so instead of a HEADER, the bold
# title is done with WhatsApp's own *bold* markdown inside the BODY, and
# the single {{1}} variable (the fully composed "*title*\n\nmessage" text,
# see build_body_text) is wrapped in static lead-in/trailing text to satisfy
# both of those rules.
BODY_TEMPLATE_TEXT = "Hello, we have an update for you.\n\n{{1}}\n\nTap below to open the app."


def build_body_text(title: str, message: str) -> str:
    return f"*{title}*\n\n{message}"


async def ensure_group_message_template(button_text: str = "View Product Detail") -> dict:
    """Idempotent: returns the shared template's current entry on the WABA,
    creating it (for one-time Meta review) only if it doesn't exist yet.
    """
    existing = await list_templates()
    match = next((t for t in existing if t.get("name") == GROUP_MESSAGE_TEMPLATE_NAME), None)
    if match is not None:
        return match

    payload = {
        "name": GROUP_MESSAGE_TEMPLATE_NAME,
        "language": GROUP_MESSAGE_LANGUAGE,
        "category": "MARKETING",
        "components": [
            {
                "type": "BODY",
                "text": BODY_TEMPLATE_TEXT,
                "example": {
                    "body_text": [
                        [build_body_text("Today's Product", "New products available now.")]
                    ]
                },
            },
            {
                "type": "BUTTONS",
                "buttons": [
                    {"type": "URL", "text": button_text, "url": settings.frontend_base_url}
                ],
            },
        ],
    }
    return await whatsapp_api_service.create_template(payload)
