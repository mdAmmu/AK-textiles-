from datetime import datetime

from pydantic import BaseModel


class MessageTemplateCreate(BaseModel):
    name: str
    message: str
    button_text: str = "View Product Detail"


class MessageTemplateUpdate(BaseModel):
    name: str
    message: str


class MessageTemplateOut(BaseModel):
    id: str
    name: str
    message: str
    whatsapp_template_name: str
    whatsapp_template_language: str
    created_by: str
    created_at: datetime
    updated_at: datetime


class SendGroupTemplateRequest(BaseModel):
    template_id: str


class GroupTemplateSendResult(BaseModel):
    success: bool
    in_app_sent: int
    whatsapp_sent: int
    whatsapp_skipped: int
