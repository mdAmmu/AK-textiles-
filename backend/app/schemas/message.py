from datetime import datetime

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: str
    conversation_id: str | None = None
    group_id: str | None = None
    sender_id: str
    message_type: str
    text: str | None = None
    product_id: str | None = None
    price: float | None = None
    product_name: str | None = None
    product_image: str | None = None
    product_description: str | None = None
    image_group_id: str | None = None
    created_at: datetime
    read_at: datetime | None = None


class SendMessageRequest(BaseModel):
    text: str


class SendProductMessageRequest(BaseModel):
    product_id: str


class DeleteMessagesRequest(BaseModel):
    message_ids: list[str]


class ForwardMessagesRequest(BaseModel):
    message_ids: list[str]
    group_ids: list[str]
