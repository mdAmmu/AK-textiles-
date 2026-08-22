from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.message_template import MessageTemplate
from app.models.user import User
from app.schemas.message_template import (
    MessageTemplateCreate,
    MessageTemplateOut,
    MessageTemplateUpdate,
)
from app.services import whatsapp_api_service, whatsapp_template_service

router = APIRouter(prefix="/api/message-templates", tags=["message-templates"])


@router.get("", response_model=list[MessageTemplateOut])
def list_templates(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    templates = (
        db.query(MessageTemplate).order_by(MessageTemplate.created_at.desc()).all()
    )
    return [_to_out(t) for t in templates]


@router.get("/whatsapp-status")
async def whatsapp_status(_admin: User = Depends(require_admin)):
    """Every message template reuses one shared, pre-approved WhatsApp
    template (see whatsapp_template_service.ensure_group_message_template) —
    only that shared template's approval status matters for whether sending
    will actually work, not any individual template row.
    """
    try:
        shared = await whatsapp_template_service.ensure_group_message_template()
    except whatsapp_api_service.WhatsAppApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"status": shared.get("status", "UNKNOWN")}


@router.post("", response_model=MessageTemplateOut)
async def create_template(
    body: MessageTemplateCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Every template created here sends through the same shared, pre-
    approved WhatsApp template (created once, on first use) — a bold title
    (this template's name), the message as the body, and a "View Product
    Detail" button that opens the PWA. Creating a template does NOT queue a
    new Meta review; only the very first template ever created here does.
    """
    name = body.name.strip()
    message = body.message.strip()
    if not name or not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name and message are required")

    try:
        await whatsapp_template_service.ensure_group_message_template(
            button_text=body.button_text.strip() or "View Product Detail",
        )
    except whatsapp_api_service.WhatsAppApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    template = MessageTemplate(
        name=name,
        message=message,
        whatsapp_template_name=whatsapp_template_service.GROUP_MESSAGE_TEMPLATE_NAME,
        whatsapp_template_language=whatsapp_template_service.GROUP_MESSAGE_LANGUAGE,
        created_by=admin.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _to_out(template)


@router.get("/{template_id}", response_model=MessageTemplateOut)
def get_template(
    template_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    return _to_out(_get_template_or_404(db, template_id))


@router.put("/{template_id}", response_model=MessageTemplateOut)
def update_template(
    template_id: str,
    body: MessageTemplateUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Only updates the local name/message shown in-app — the WhatsApp
    template already submitted to Meta for this row is immutable once
    created, so it's left as-is. Create a new template for a different
    WhatsApp-side message.
    """
    template = _get_template_or_404(db, template_id)
    template.name = body.name.strip()
    template.message = body.message.strip()
    db.commit()
    db.refresh(template)
    return _to_out(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    template = _get_template_or_404(db, template_id)
    db.delete(template)
    db.commit()


def _get_template_or_404(db: Session, template_id: str) -> MessageTemplate:
    template = db.query(MessageTemplate).filter(MessageTemplate.id == template_id).first()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


def _to_out(template: MessageTemplate) -> MessageTemplateOut:
    return MessageTemplateOut(
        id=str(template.id),
        name=template.name,
        message=template.message,
        whatsapp_template_name=template.whatsapp_template_name,
        whatsapp_template_language=template.whatsapp_template_language,
        created_by=str(template.created_by),
        created_at=template.created_at,
        updated_at=template.updated_at,
    )
