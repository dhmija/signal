import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.message import MessageCreate, MessageResponse, ReactionToggleRequest
from services import message as message_service
from websocket.manager import manager

router = APIRouter(prefix="/messages", tags=["messages"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message_response = message_service.create_message(db, current_user.id, payload)

    participant_ids = message_service.get_conversation_participant_ids(db, payload.conversation_id)
    recipient_ids = set(participant_ids) - {current_user.id}

    await manager.broadcast_to_users(
        user_ids=recipient_ids,
        event_type="new_message",
        payload=message_response.model_dump(mode="json"),
    )

    return message_response


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


@router.post("/{message_id}/reactions", response_model=MessageResponse)
async def toggle_reaction(
    message_id: int,
    payload: ReactionToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message_response, action = message_service.toggle_reaction(db, message_id, current_user.id, payload.emoji)

    participant_ids = message_service.get_conversation_participant_ids(db, message_response.conversation_id)
    all_participant_ids = set(participant_ids)

    await manager.broadcast_to_users(
        user_ids=all_participant_ids,
        event_type="reaction",
        payload={
            "conversation_id": message_response.conversation_id,
            "message_id": message_id,
            "user_id": current_user.id,
            "emoji": payload.emoji,
            "action": action,
            "updated_message": message_response.model_dump(mode="json"),
        },
    )

    return message_response


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds 10MB size limit"
        )

    ext = os.path.splitext(file.filename or "")[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/{unique_filename}"

    return {
        "file_url": file_url,
        "file_name": file.filename or "attachment",
        "mime_type": file.content_type or "application/octet-stream",
        "size_bytes": len(contents),
    }


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
