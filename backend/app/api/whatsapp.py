import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.api.deps import require_admin
from app.core.config import settings
from app.core.supabase_client import upload_product_image
from app.models.user import User
from app.schemas.whatsapp import WhatsAppMessageRequest
from app.services.whatsapp_service import ALLOWED_CAROUSEL_CARD_COUNTS, CAROUSEL_TEMPLATE_NAMES, whatsapp_service

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])
logger = logging.getLogger("whatsapp")


@router.post("/send")
async def send_whatsapp_message(data: WhatsAppMessageRequest, _admin: User = Depends(require_admin)):
    if not settings.whatsapp_access_token or not settings.whatsapp_phone_number_id:
        raise HTTPException(status_code=503, detail="WhatsApp service is not configured.")

    if data.message_type == "carousel":
        try:
            await whatsapp_service.ensure_carousel_template(data.image_urls or [])
        except Exception as error:
            logger.error("Carousel template setup failed: %s", error)
            raise HTTPException(status_code=502, detail=_friendly_error(str(error)))

    try:
        result = await whatsapp_service.send_message(
            phone_number=data.phone_number,
            message_type=data.message_type,
            message=data.message,
            image_url=data.image_url,
            image_urls=data.image_urls,
            preview_url=data.preview_url,
        )

        message_id = None
        messages = result.get("messages") if isinstance(result, dict) else None
        if messages:
            message_id = messages[0].get("id")

        return {
            "success": True,
            "message": "WhatsApp message sent successfully",
            "message_id": message_id,
        }

    except Exception as error:
        logger.error("WhatsApp send failed: %s", error)
        raise HTTPException(status_code=502, detail=_friendly_error(str(error)))


@router.get("/carousel-status")
async def carousel_status(_admin: User = Depends(require_admin)):
    """Each supported card count (3/4/5) is its own separate, independently
    -approved template (see whatsapp_service.ensure_carousel_template) —
    this reports each one's status so the UI can show which sizes are
    ready to send.
    """
    templates = await whatsapp_service.get_templates()
    by_name = {t.get("name"): t for t in templates}

    result = {}
    for count in ALLOWED_CAROUSEL_CARD_COUNTS:
        name = CAROUSEL_TEMPLATE_NAMES[count]
        match = by_name.get(name)
        result[str(count)] = (
            {"exists": False, "status": "NOT_CREATED"}
            if match is None
            else {"exists": True, "status": match.get("status", "UNKNOWN")}
        )
    return result


@router.post("/upload-image")
async def upload_whatsapp_image(file: UploadFile, _admin: User = Depends(require_admin)):
    """Uploads an image for a WhatsApp message and returns its public HTTPS
    URL — Meta needs a publicly reachable link, not a local file path, so
    this reuses the existing Supabase product-images storage rather than a
    new storage system.
    """
    content = await file.read()
    extension = (file.filename or "").rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    filename = f"whatsapp/{uuid.uuid4()}.{extension}"
    url = upload_product_image(filename, content, file.content_type or "image/jpeg")
    return {"url": url}


def _friendly_error(raw: str) -> str:
    lowered = raw.lower()
    if "authentication" in lowered or "access token" in lowered or "oauth" in lowered:
        return "WhatsApp authentication failed. Check server configuration."
    if "does not exist in the translation" in lowered or "template" in lowered and "pending" in lowered:
        return "The carousel template is still pending Meta's approval. Try again once it's approved."
    if "image" in lowered or "media" in lowered:
        return "WhatsApp could not access one of the images."
    if "recipient" in lowered or "phone" in lowered or "not a whatsapp user" in lowered:
        return "The WhatsApp recipient number is invalid or unavailable."
    return "Unable to send WhatsApp message."
