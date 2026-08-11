from datetime import datetime

from pydantic import BaseModel

from app.schemas.message import MessageOut


class ConversationSummary(BaseModel):
    id: str
    user_id: str
    user_name: str
    last_message_text: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0


class ConversationDetail(BaseModel):
    id: str
    user_id: str
    admin_id: str
    user_name: str
    messages: list[MessageOut]
