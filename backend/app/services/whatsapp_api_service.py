"""Thin client for the Meta WhatsApp Cloud API.

Only this module talks to Meta directly (auth headers, timeouts, response
parsing, error normalization). Business logic (fan-out, DB writes) lives in
whatsapp_send_service.py and must never call httpx itself.
"""

import httpx

from app.core.config import settings


class WhatsAppApiError(Exception):
    """Normalized error for any failure talking to the Meta Cloud API."""

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _base_url() -> str:
    return f"https://graph.facebook.com/{settings.whatsapp_api_version}/{settings.whatsapp_phone_number_id}"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }


async def send_template_message(
    *,
    to: str,
    template_name: str,
    language_code: str = "en_US",
    components: list[dict] | None = None,
) -> dict:
    """Sends one WhatsApp template message to a single phone number.

    Returns the parsed Meta response (contains messages[0].id, the wamid to
    persist for later status-webhook matching).

    Raises WhatsAppApiError on any transport, timeout or Meta-side error.
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
        },
    }
    if components:
        payload["template"]["components"] = components

    return await _post("/messages", payload)


async def upload_template_header_image(
    file_bytes: bytes, content_type: str, filename: str
) -> str:
    """Uploads an example image for a template's IMAGE header via Meta's
    resumable upload API and returns the header handle to reference it in
    the template creation call. This is only the *sample* image Meta uses
    for template review — the real per-send image is supplied dynamically
    (the product's own image) when the template is actually sent.
    """
    session_url = f"https://graph.facebook.com/{settings.whatsapp_api_version}/{settings.whatsapp_app_id}/uploads"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            session_resp = await client.post(
                session_url,
                params={
                    "file_length": len(file_bytes),
                    "file_type": content_type,
                    "file_name": filename,
                    "access_token": settings.whatsapp_access_token,
                },
            )
            session_data = session_resp.json()
            if session_resp.status_code >= 400:
                raise _meta_error(session_resp.status_code, session_data)
            upload_session_id = session_data["id"]

            upload_resp = await client.post(
                f"https://graph.facebook.com/{settings.whatsapp_api_version}/{upload_session_id}",
                headers={
                    "Authorization": f"OAuth {settings.whatsapp_access_token}",
                    "file_offset": "0",
                },
                content=file_bytes,
            )
            upload_data = upload_resp.json()
            if upload_resp.status_code >= 400:
                raise _meta_error(upload_resp.status_code, upload_data)
            return upload_data["h"]
    except httpx.TimeoutException as exc:
        raise WhatsAppApiError("WhatsApp API timed out", code="timeout") from exc
    except httpx.HTTPError as exc:
        raise WhatsAppApiError(f"WhatsApp API request failed: {exc}", code="network_error") from exc


async def create_template(payload: dict) -> dict:
    url = f"https://graph.facebook.com/{settings.whatsapp_api_version}/{settings.whatsapp_business_account_id}/message_templates"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, headers=_headers(), json=payload)
    except httpx.TimeoutException as exc:
        raise WhatsAppApiError("WhatsApp API timed out", code="timeout") from exc
    except httpx.HTTPError as exc:
        raise WhatsAppApiError(f"WhatsApp API request failed: {exc}", code="network_error") from exc

    data = response.json()
    if response.status_code >= 400:
        raise _meta_error(response.status_code, data)
    return data


async def get_templates() -> list[dict]:
    """Lists templates registered on this WhatsApp Business Account."""
    url = f"https://graph.facebook.com/{settings.whatsapp_api_version}/{settings.whatsapp_business_account_id}/message_templates"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=_headers())
    except httpx.TimeoutException as exc:
        raise WhatsAppApiError("WhatsApp API timed out", code="timeout") from exc
    except httpx.HTTPError as exc:
        raise WhatsAppApiError(f"WhatsApp API request failed: {exc}", code="network_error") from exc

    data = response.json()
    if response.status_code >= 400:
        raise _meta_error(response.status_code, data)
    return data.get("data", [])


async def _post(path: str, payload: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(f"{_base_url()}{path}", headers=_headers(), json=payload)
    except httpx.TimeoutException as exc:
        raise WhatsAppApiError("WhatsApp API timed out", code="timeout") from exc
    except httpx.HTTPError as exc:
        raise WhatsAppApiError(f"WhatsApp API request failed: {exc}", code="network_error") from exc

    data = response.json()
    if response.status_code >= 400:
        raise _meta_error(response.status_code, data)
    return data


def _meta_error(status_code: int, data: dict) -> WhatsAppApiError:
    error = data.get("error", {})
    message = error.get("message", "Unknown WhatsApp API error")
    code = str(error.get("code", status_code))
    return WhatsAppApiError(message, code=code, status_code=status_code)
