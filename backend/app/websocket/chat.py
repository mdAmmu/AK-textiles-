from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.websocket.manager import manager

router = APIRouter()


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
    try:
        while True:
            # Client doesn't send anything meaningful; this just keeps the
            # connection open and detects disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
