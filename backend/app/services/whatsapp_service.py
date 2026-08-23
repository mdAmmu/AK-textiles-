import httpx

from app.core.config import settings

CAROUSEL_TEMPLATE_NAME = "ak_carousel_message_v1"
CAROUSEL_TEMPLATE_LANGUAGE = "en_US"
CAROUSEL_CARD_COUNT = 3

# Meta rejects a body that's just a bare variable (no literal text around
# it, or too high a variable-to-word ratio), so the single {{1}} — the
# admin's typed description — is wrapped in static lead-in/trailing text.
CAROUSEL_BODY_TEMPLATE_TEXT = "Hello, we have an update for you.\n\n{{1}}\n\nTap a photo below to view more."


class WhatsAppService:
    async def send_text_message(self, phone_number: str, message: str, preview_url: bool = True):
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message,
            },
        }
        return await self._post_message(payload)

    async def send_image_message(self, phone_number: str, image_url: str, caption: str | None = None):
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "image",
            "image": {
                "link": image_url,
                "caption": caption,
            },
        }
        return await self._post_message(payload)

    async def send_message(
        self,
        phone_number: str,
        message_type: str,
        message: str,
        image_url: str | None = None,
        image_urls: list[str] | None = None,
        preview_url: bool = True,
    ):
        if message_type == "image":
            caption = message.strip() or None
            return await self.send_image_message(phone_number, image_url, caption=caption)
        if message_type == "carousel":
            return await self.send_carousel_message(phone_number, message, image_urls or [])
        return await self.send_text_message(phone_number, message, preview_url=preview_url)

    # ------------------------------------------------------------------
    # Carousel template
    # ------------------------------------------------------------------

    async def ensure_carousel_template(
        self, sample_image_urls: list[str], button_text: str = "View Product Detail"
    ) -> dict:
        """Idempotent: returns the shared carousel template's current entry
        on the WABA, creating it (one-time Meta review) only if it doesn't
        exist yet. Every future carousel send reuses this same approved
        template — only its variables (body text + each card's image) are
        filled in per send, so nothing after this first call needs a fresh
        review.
        """
        existing_templates = await self.get_templates()
        match = next(
            (t for t in existing_templates if t.get("name") == CAROUSEL_TEMPLATE_NAME), None
        )
        if match is not None:
            return match

        if len(sample_image_urls) != CAROUSEL_CARD_COUNT:
            raise ValueError(f"Need {CAROUSEL_CARD_COUNT} sample images to create the carousel template")

        handles = []
        async with httpx.AsyncClient(timeout=30) as client:
            for url in sample_image_urls:
                image_bytes, content_type = await self._download_image(client, url)
                handle = await self.upload_template_header_image(image_bytes, content_type, "card.jpg")
                handles.append(handle)

        # Unlike the send-time payload (send_carousel_message), template
        # *creation* rejects a "card_index" key on each card — card order
        # here is just the array position.
        cards = []
        for handle in handles:
            cards.append(
                {
                    "components": [
                        {
                            "type": "HEADER",
                            "format": "IMAGE",
                            "example": {"header_handle": [handle]},
                        },
                        {
                            "type": "BUTTONS",
                            "buttons": [
                                {"type": "URL", "text": button_text, "url": settings.frontend_base_url}
                            ],
                        },
                    ],
                }
            )

        payload = {
            "name": CAROUSEL_TEMPLATE_NAME,
            "language": CAROUSEL_TEMPLATE_LANGUAGE,
            "category": "MARKETING",
            "components": [
                {
                    "type": "BODY",
                    "text": CAROUSEL_BODY_TEMPLATE_TEXT,
                    "example": {
                        "body_text": [["New products available now. Please check the latest products."]]
                    },
                },
                {"type": "CAROUSEL", "cards": cards},
            ],
        }
        return await self.create_template(payload)

    async def send_carousel_message(
        self, phone_number: str, body_text: str, image_urls: list[str]
    ):
        if len(image_urls) != CAROUSEL_CARD_COUNT:
            raise ValueError(f"Carousel messages need exactly {CAROUSEL_CARD_COUNT} images")

        cards = []
        for index, url in enumerate(image_urls):
            cards.append(
                {
                    "card_index": index,
                    "components": [
                        {
                            "type": "header",
                            "parameters": [{"type": "image", "image": {"link": url}}],
                        }
                    ],
                }
            )

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "template",
            "template": {
                "name": CAROUSEL_TEMPLATE_NAME,
                "language": {"code": CAROUSEL_TEMPLATE_LANGUAGE},
                "components": [
                    {"type": "body", "parameters": [{"type": "text", "text": body_text}]},
                    {"type": "carousel", "cards": cards},
                ],
            },
        }
        return await self._post_message(payload)

    # ------------------------------------------------------------------
    # Low-level Meta Graph API helpers
    # ------------------------------------------------------------------

    async def get_templates(self) -> list[dict]:
        url = (
            f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
            f"{settings.whatsapp_business_account_id}/message_templates"
        )
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=self._headers())
        data = self._parse(response)
        return data.get("data", [])

    async def create_template(self, payload: dict) -> dict:
        url = (
            f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
            f"{settings.whatsapp_business_account_id}/message_templates"
        )
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, headers=self._headers(), json=payload)
        return self._parse(response)

    async def upload_template_header_image(
        self, file_bytes: bytes, content_type: str, filename: str
    ) -> str:
        """Uploads a sample image for a carousel card's IMAGE header via
        Meta's resumable upload API and returns the header handle Meta
        needs to review the template shape. This sample is only used for
        review — the real image sent to each recipient is supplied
        dynamically (send_carousel_message) every time the template is used.
        """
        session_url = (
            f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
            f"{settings.whatsapp_app_id}/uploads"
        )
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
            session_data = self._parse(session_resp)
            upload_session_id = session_data["id"]

            upload_resp = await client.post(
                f"https://graph.facebook.com/{settings.whatsapp_api_version}/{upload_session_id}",
                headers={
                    "Authorization": f"OAuth {settings.whatsapp_access_token}",
                    "file_offset": "0",
                },
                content=file_bytes,
            )
            upload_data = self._parse(upload_resp)
            return upload_data["h"]

    async def _download_image(self, client: httpx.AsyncClient, url: str) -> tuple[bytes, str]:
        response = await client.get(url)
        if response.is_error:
            raise Exception(f"Could not download sample image from {url}")
        content_type = response.headers.get("content-type", "image/jpeg")
        return response.content, content_type

    async def _post_message(self, payload: dict):
        url = (
            f"https://graph.facebook.com/"
            f"{settings.whatsapp_api_version}/"
            f"{settings.whatsapp_phone_number_id}/messages"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=self._headers(), json=payload)
        return self._parse(response)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {settings.whatsapp_access_token}",
            "Content-Type": "application/json",
        }

    def _parse(self, response: httpx.Response) -> dict:
        data = response.json()
        if response.is_error:
            raise Exception(data.get("error", {}).get("message", "WhatsApp API request failed"))
        return data


whatsapp_service = WhatsAppService()
