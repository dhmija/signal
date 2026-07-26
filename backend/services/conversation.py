from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from models.conversation import Conversation, ConversationMember
from models.user import User
from schemas.conversation import ConversationCreate, ConversationResponse


def _format_conversation(conv: Conversation) -> ConversationResponse:
    participants = [m.user for m in conv.members]
    return ConversationResponse(
        id=conv.id,
        type=conv.type,
        name=conv.name,
        avatar_url=conv.avatar_url,
        created_by=conv.created_by,
        disappearing_timer=conv.disappearing_timer,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        participants=participants,
        unread_count=0,
        last_message=None,
    )


def create_conversation(
    db: Session, current_user_id: int, payload: ConversationCreate
) -> ConversationResponse:
    # Ensure current user is in participant list
    all_participant_ids = list(set(payload.participant_ids + [current_user_id]))

    if payload.type == "direct":
        if len(all_participant_ids) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct conversations must have exactly 2 participants",
            )
        # Check if direct conversation already exists
        existing = _find_existing_direct(db, all_participant_ids[0], all_participant_ids[1])
        if existing:
            return _format_conversation(existing)

    # Validate that all users exist
    users = db.query(User).filter(User.id.in_(all_participant_ids)).all()
    if len(users) != len(all_participant_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="One or more users not found"
        )

    conv = Conversation(
        type=payload.type,
        name=payload.name if payload.type == "group" else None,
        avatar_url=payload.avatar_url if payload.type == "group" else None,
        created_by=current_user_id,
    )
    db.add(conv)
    db.flush()

    for pid in all_participant_ids:
        role = "admin" if pid == current_user_id and payload.type == "group" else "member"
        member = ConversationMember(conversation_id=conv.id, user_id=pid, role=role)
        db.add(member)

    db.commit()

    # Re-query with members + users loaded
    conv_loaded = (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id == conv.id)
        .first()
    )
    return _format_conversation(conv_loaded)


def _find_existing_direct(db: Session, user1_id: int, user2_id: int) -> Optional[Conversation]:
    subq = (
        db.query(ConversationMember.conversation_id)
        .filter(ConversationMember.user_id.in_([user1_id, user2_id]))
        .group_by(ConversationMember.conversation_id)
        .having(func.count(ConversationMember.user_id) == 2)
        .subquery()
    )

    return (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id.in_(subq), Conversation.type == "direct")
        .first()
    )


def list_conversations(db: Session, current_user_id: int) -> List[ConversationResponse]:
    conv_ids = (
        db.query(ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == current_user_id)
        .all()
    )
    c_ids = [cid[0] for cid in conv_ids]

    if not c_ids:
        return []

    convs = (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id.in_(c_ids))
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [_format_conversation(c) for c in convs]


def get_conversation_by_id(
    db: Session, conversation_id: int, current_user_id: int
) -> ConversationResponse:
    # Ensure current user is a member
    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied",
        )

    conv = (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id == conversation_id)
        .first()
    )

    return _format_conversation(conv)
