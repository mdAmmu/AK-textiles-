from datetime import datetime

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    message_type: str
    text: str | None = None
    product_id: str | None = None
    price: float | None = None
    created_at: datetime
    read_at: datetime | None = None


class SendMessageRequest(BaseModel):
    text: str
