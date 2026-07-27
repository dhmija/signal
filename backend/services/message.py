from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from models.conversation import Conversation, ConversationMember
from models.message import Attachment, Message, Reaction
from schemas.message import MessageCreate, MessageResponse, ReactionResponse
from services.contact import ensure_mutual_contact


def create_message(db: Session, sender_id: int, payload: MessageCreate) -> MessageResponse:
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
        reply_to_id=payload.reply_to_id,
        body=payload.body,
        status="sent",
    )
    db.add(msg)
    db.flush()

    if payload.attachments:
        for att in payload.attachments:
            db.add(
                Attachment(
                    message_id=msg.id,
                    file_url=att.file_url,
                    file_name=att.file_name,
                    mime_type=att.mime_type,
                    size_bytes=att.size_bytes,
                )
            )

    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()

    # Automatically ensure mutual contacts for all conversation members on first message
    all_members = (
        db.query(ConversationMember.user_id)
        .filter(ConversationMember.conversation_id == payload.conversation_id)
        .all()
    )
    member_ids = [m[0] for m in all_members]
    for uid1 in member_ids:
        for uid2 in member_ids:
            if uid1 != uid2:
                ensure_mutual_contact(db, uid1, uid2)

    db.commit()

    loaded_msg = (
        db.query(Message)
        .options(
            joinedload(Message.sender),
            joinedload(Message.reply_to).joinedload(Message.sender),
            selectinload(Message.reactions),
            selectinload(Message.attachments),
        )
        .filter(Message.id == msg.id)
        .first()
    )

    return MessageResponse.model_validate(loaded_msg)


def get_messages(
    db: Session, conversation_id: int, user_id: int, limit: int = 50, before_id: Optional[int] = None
) -> List[MessageResponse]:
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
        .options(
            joinedload(Message.sender),
            joinedload(Message.reply_to).joinedload(Message.sender),
            selectinload(Message.reactions),
            selectinload(Message.attachments),
        )
        .filter(Message.conversation_id == conversation_id)
    )

    if before_id:
        query = query.filter(Message.id < before_id)

    messages = query.order_by(Message.id.desc()).limit(limit).all()
    messages.reverse()
    return [MessageResponse.model_validate(m) for m in messages]


def toggle_reaction(
    db: Session, message_id: int, user_id: int, emoji: str
) -> tuple[MessageResponse, str]:
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    existing_same_emoji = (
        db.query(Reaction)
        .filter(
            Reaction.message_id == message_id,
            Reaction.user_id == user_id,
            Reaction.emoji == emoji,
        )
        .first()
    )

    if existing_same_emoji:
        db.delete(existing_same_emoji)
        action = "removed"
    else:
        db.query(Reaction).filter(
            Reaction.message_id == message_id,
            Reaction.user_id == user_id,
        ).delete(synchronize_session=False)

        reaction = Reaction(message_id=message_id, user_id=user_id, emoji=emoji)
        db.add(reaction)
        action = "added"

    db.commit()

    loaded_msg = (
        db.query(Message)
        .options(
            joinedload(Message.sender),
            joinedload(Message.reply_to).joinedload(Message.sender),
            selectinload(Message.reactions),
            selectinload(Message.attachments),
        )
        .filter(Message.id == message_id)
        .first()
    )

    return MessageResponse.model_validate(loaded_msg), action


def mark_messages_as_read(db: Session, conversation_id: int, user_id: int) -> List[int]:
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
