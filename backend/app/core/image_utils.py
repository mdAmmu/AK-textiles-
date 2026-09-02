import io

from PIL import Image


def normalize_image(content: bytes, content_type: str | None, filename: str | None) -> tuple[bytes, str, str]:
    """Converts WebP images to JPEG, since WhatsApp's Cloud API rejects WebP
    for image messages and template headers. Returns (content, content_type, extension).
    """
    content_type = content_type or "image/jpeg"
    is_webp = content_type == "image/webp" or (filename or "").lower().endswith(".webp")

    if is_webp:
        with Image.open(io.BytesIO(content)) as img:
            buffer = io.BytesIO()
            img.convert("RGB").save(buffer, format="JPEG")
            content = buffer.getvalue()
        return content, "image/jpeg", "jpg"

    extension = (filename or "").rsplit(".", 1)[-1] if "." in (filename or "") else "jpg"
    return content, content_type, extension
