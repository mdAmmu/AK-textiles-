from datetime import datetime

from pydantic import BaseModel, Field


class BroadcastAudienceCreate(BaseModel):
    name: str
    user_ids: list[str] = Field(default_factory=list)
    # Groups are only a convenience picker for building the audience —
    # their members are expanded into user_ids once, at creation time.
    # The audience itself stays a flat, static list of contact ids.
    group_ids: list[str] = Field(default_factory=list)


class BroadcastAudienceUpdate(BaseModel):
    name: str | None = None
    user_ids: list[str] | None = None
    group_ids: list[str] = Field(default_factory=list)


class BroadcastAudienceOut(BaseModel):
    id: str
    name: str
    member_count: int
    created_at: datetime
    updated_at: datetime


class BroadcastAudienceDetailOut(BroadcastAudienceOut):
    member_ids: list[str]


class BroadcastCreateRequest(BaseModel):
    name: str | None = None
    text: str
    group_ids: list[str] = Field(default_factory=list)
    user_ids: list[str] = Field(default_factory=list)
    audience_ids: list[str] = Field(default_factory=list)
    send_mode: str = "now"  # "now" | "draft"
    idempotency_key: str | None = None
    reply_to_broadcast_id: str | None = None


class BroadcastRecipientOut(BaseModel):
    id: str
    recipient_id: str
    recipient_name: str
    recipient_phone: str | None = None
    status: str
    failure_reason: str | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None


class BroadcastOut(BaseModel):
    id: str
    name: str | None = None
    status: str
    message_type: str = "text"
    text: str | None = None
    media_url: str | None = None
    file_name: str | None = None
    reply_to_broadcast_id: str | None = None
    image_group_id: str | None = None
    total_recipients: int
    sent_count: int
    failed_count: int
    delivered_count: int
    read_count: int
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class BroadcastDetailOut(BroadcastOut):
    recipients: list[BroadcastRecipientOut]
