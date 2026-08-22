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
