from datetime import datetime

from pydantic import BaseModel


class WhatsAppTestMessageRequest(BaseModel):
    to: str  # E.164 format, e.g. "918857950160"


class WhatsAppTestMessageResult(BaseModel):
    external_message_id: str | None
    raw: dict


class BroadcastCreateRequest(BaseModel):
    product_id: str
    group_ids: list[str]
    template_name: str | None = None  # defaults to whatsapp_send_service.DEFAULT_TEMPLATE_NAME


class BroadcastOut(BaseModel):
    id: str
    template_name: str
    product_id: str
    group_ids: list[str]
    status: str
    total_recipients: int
    sent_count: int
    failed_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime


class BroadcastRecipientOut(BaseModel):
    id: str
    user_id: str
    phone_number: str
    status: str
    error_code: str | None
    error_message: str | None
    external_message_id: str | None
    sent_at: datetime | None
    delivered_at: datetime | None
    read_at: datetime | None
    failed_at: datetime | None


class BroadcastDetailOut(BroadcastOut):
    recipients: list[BroadcastRecipientOut]


class TemplateOut(BaseModel):
    id: str | None = None
    name: str
    status: str
    category: str | None = None
    language: str | None = None
    is_ours: bool = False


class TemplateCreateResult(BaseModel):
    id: str | None = None
    status: str | None = None
