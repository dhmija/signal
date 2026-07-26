import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
                event_type = data.get("type")
                payload = data.get("payload", {})

                # Handle client typing events
                if event_type in ["typing_start", "typing_stop"]:
                    conversation_id = payload.get("conversation_id")
                    recipient_id = payload.get("recipient_id")
                    if recipient_id:
                        await manager.send_personal_message(
                            user_id=recipient_id,
                            event_type=event_type,
                            payload={
                                "conversation_id": conversation_id,
                                "user_id": user_id,
                            },
                        )
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from user {user_id}")
            except Exception as e:
                logger.error(f"Error processing WS event from user {user_id}: {e}")

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id, websocket)
