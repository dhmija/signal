from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.message import MessageCreate, MessageResponse, MessageStatusUpdate
from services import message as message_service
from websocket.manager import manager

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = message_service.create_message(db, current_user.id, payload)

    # Get conversation participant IDs to broadcast WS event
    participant_ids = message_service.get_conversation_participant_ids(db, payload.conversation_id)
    recipient_ids = set(participant_ids) - {current_user.id}

    # Broadcast new_message to other participants
    await manager.broadcast_to_users(
        user_ids=recipient_ids,
        event_type="new_message",
        payload=message.model_dump(mode="json"),
    )

    return message


@router.get("", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int = Query(...),
    limit: int = Query(50, le=100),
    before_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return message_service.get_messages(
        db, conversation_id=conversation_id, user_id=current_user.id, limit=limit, before_id=before_id
    )


@router.post("/read", status_code=status.HTTP_200_OK)
async def mark_read(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation_id = payload.get("conversation_id")
    if not conversation_id:
        return {"updated_count": 0}

    updated_ids = message_service.mark_messages_as_read(db, conversation_id, current_user.id)

    if updated_ids:
        participant_ids = message_service.get_conversation_participant_ids(db, conversation_id)
        recipient_ids = set(participant_ids) - {current_user.id}

        await manager.broadcast_to_users(
            user_ids=recipient_ids,
            event_type="message_status",
            payload={
                "conversation_id": conversation_id,
                "message_ids": updated_ids,
                "status": "read",
            },
        )

    return {"updated_count": len(updated_ids)}
