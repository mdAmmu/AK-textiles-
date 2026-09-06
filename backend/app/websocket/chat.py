import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.conversation import Conversation
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter()

# How long to wait after a disconnect before treating the user as actually
# offline. Covers brief drops (phone locks, tab backgrounds, a page reload)
# without flashing "Last seen just now" every time that happens.
OFFLINE_GRACE_SECONDS = 5


def _related_user_ids(db, user_id: str) -> set[str]:
    """The other participant in every conversation this user is part of -
    the set of people who should be told when their online status changes."""
    convos = (
        db.query(Conversation)
        .filter((Conversation.user_id == user_id) | (Conversation.admin_id == user_id))
        .all()
    )
    related: set[str] = set()
    for c in convos:
        other = str(c.admin_id) if str(c.user_id) == user_id else str(c.user_id)
        related.add(other)
    return related


async def _broadcast_presence(user_id: str, online: bool, last_seen_at: datetime | None = None) -> None:
    db = SessionLocal()
    try:
        related = _related_user_ids(db, user_id)
    finally:
        db.close()

    payload = {
        "type": "presence",
        "user_id": user_id,
        "online": online,
        "last_seen_at": last_seen_at.isoformat() if last_seen_at else None,
    }
    for related_id in related:
        await manager.send_to_user(related_id, payload)


async def _handle_disconnect(user_id: str) -> None:
    await asyncio.sleep(OFFLINE_GRACE_SECONDS)
    if manager.is_online(user_id):
        return  # reconnected (or another tab/device is still open) - not offline

    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None:
            user.last_seen_at = now
            db.commit()
    finally:
        db.close()

    await _broadcast_presence(user_id, online=False, last_seen_at=now)


@router.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = decode_access_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload["sub"]).first()
    finally:
        db.close()

    if user is None:
        await websocket.close(code=4403)
        return

    user_id = str(user.id)
    await manager.connect(user_id, websocket)
    await _broadcast_presence(user_id, online=True)
    try:
        while True:
            # Client doesn't send anything meaningful; this just keeps the
            # connection open and detects disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        asyncio.create_task(_handle_disconnect(user_id))
