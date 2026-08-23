from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.services.whatsapp_service import ALLOWED_CAROUSEL_CARD_COUNTS


class WhatsAppMessageRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=20)
    message_type: Literal["text", "image", "carousel"] = "text"
    # Required for text; optional caption for image; lead/body text for carousel.
    message: str = Field(default="", max_length=4096)
    image_url: Optional[str] = None
    image_urls: Optional[list[str]] = None
    preview_url: bool = True

    @model_validator(mode="after")
    def validate_fields(self) -> "WhatsAppMessageRequest":
        if self.message_type == "text" and not self.message.strip():
            raise ValueError("message is required for text messages")

        if self.message_type == "image":
            if not self.image_url or not self.image_url.strip():
                raise ValueError("image_url is required when message_type is 'image'")
            if not self.image_url.startswith(("http://", "https://")):
                raise ValueError("image_url must be an http:// or https:// URL")

        if self.message_type == "carousel":
            if not self.message.strip():
                raise ValueError("message is required for carousel messages")
            if not self.image_urls or len(self.image_urls) not in ALLOWED_CAROUSEL_CARD_COUNTS:
                allowed = ", ".join(str(c) for c in ALLOWED_CAROUSEL_CARD_COUNTS)
                raise ValueError(f"carousel messages need {allowed} images")
            for url in self.image_urls:
                if not url.startswith(("http://", "https://")):
                    raise ValueError("every carousel image_url must be an http:// or https:// URL")

        return self
