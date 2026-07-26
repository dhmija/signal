from datetime import datetime
from typing import List, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from models.conversation import Conversation, ConversationMember
from models.message import Message
from schemas.message import MessageCreate, MessageResponse


def create_message(db: Session, sender_id: int, payload: MessageCreate) -> MessageResponse:
    # Verify membership
    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == payload.conversation_id,
            ConversationMember.user_id == sender_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )

    msg = Message(
        conversation_id=payload.conversation_id,
        sender_id=sender_id,
        body=payload.body,
        status="sent",
    )
    db.add(msg)

    # Update conversation updated_at timestamp
    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()

    db.commit()

    # Query back with sender loaded
    loaded_msg = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.id == msg.id)
        .first()
    )

    return MessageResponse.model_validate(loaded_msg)


def get_messages(
    db: Session, conversation_id: int, user_id: int, limit: int = 50, before_id: int | None = None
) -> List[MessageResponse]:
    # Verify membership
    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to conversation messages",
        )

    query = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.conversation_id == conversation_id)
    )

    if before_id:
        query = query.filter(Message.id < before_id)

    messages = query.order_by(Message.id.desc()).limit(limit).all()
    # Return in ascending order for display
    messages.reverse()
    return [MessageResponse.model_validate(m) for m in messages]


def mark_messages_as_read(db: Session, conversation_id: int, user_id: int) -> List[int]:
    # Mark messages sent by others in this conversation as 'read'
    unread_msgs = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.status != "read",
        )
        .all()
    )

    updated_ids = []
    for msg in unread_msgs:
        msg.status = "read"
        updated_ids.append(msg.id)

    if updated_ids:
        db.commit()

    return updated_ids


def get_conversation_participant_ids(db: Session, conversation_id: int) -> List[int]:
    members = (
        db.query(ConversationMember.user_id)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    return [m[0] for m in members]
