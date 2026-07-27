from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from models.conversation import Conversation, ConversationMember
from models.message import Message
from models.user import User
from schemas.conversation import (
    AddMemberRequest,
    ConversationCreate,
    ConversationResponse,
    GroupUpdate,
    MemberResponse,
)
from services.contact import ensure_mutual_contact


def _format_conversation(db: Session, conv: Conversation, current_user_id: int) -> ConversationResponse:
    participants = [m.user for m in conv.members]

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.id.desc())
        .first()
    )

    last_msg_dict = None
    if last_msg:
        last_msg_dict = {
            "id": last_msg.id,
            "body": last_msg.body,
            "sender_id": last_msg.sender_id,
            "status": last_msg.status,
            "created_at": last_msg.created_at.isoformat(),
        }

    unread_count = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.status != "read",
        )
        .count()
    )

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
        unread_count=unread_count,
        last_message=last_msg_dict,
    )


def create_conversation(
    db: Session, current_user_id: int, payload: ConversationCreate
) -> ConversationResponse:
    all_participant_ids = list(set(payload.participant_ids + [current_user_id]))

    if payload.type == "direct":
        if len(all_participant_ids) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct conversations must have exactly 2 participants",
            )
        existing = _find_existing_direct(db, all_participant_ids[0], all_participant_ids[1])
        if existing:
            return _format_conversation(db, existing, current_user_id)

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

    # Automatically add mutual contact relationship when users are added to the same group or direct chat
    for uid1 in all_participant_ids:
        for uid2 in all_participant_ids:
            if uid1 != uid2:
                ensure_mutual_contact(db, uid1, uid2)

    db.commit()

    conv_loaded = (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id == conv.id)
        .first()
    )
    return _format_conversation(db, conv_loaded, current_user_id)


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

    return [_format_conversation(db, c, current_user_id) for c in convs]


def get_conversation_by_id(
    db: Session, conversation_id: int, current_user_id: int
) -> ConversationResponse:
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

    return _format_conversation(db, conv, current_user_id)


def update_group_info(
    db: Session, conversation_id: int, current_user_id: int, payload: GroupUpdate
) -> ConversationResponse:
    conv, membership = _get_group_and_check_admin(db, conversation_id, current_user_id)

    if payload.name is not None:
        conv.name = payload.name
    if payload.avatar_url is not None:
        conv.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(conv)
    return _format_conversation(db, conv, current_user_id)


def get_group_members(db: Session, conversation_id: int, current_user_id: int) -> List[MemberResponse]:
    user_mem = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user_id,
        )
        .first()
    )
    if not user_mem:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    members = (
        db.query(ConversationMember)
        .options(selectinload(ConversationMember.user))
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    return [MemberResponse.model_validate(m) for m in members]


def add_group_member(
    db: Session, conversation_id: int, current_user_id: int, payload: AddMemberRequest
) -> MemberResponse:
    conv, _ = _get_group_and_check_admin(db, conversation_id, current_user_id)

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == payload.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already in group"
        )

    member = ConversationMember(
        conversation_id=conversation_id, user_id=payload.user_id, role=payload.role
    )
    db.add(member)

    # Ensure all group members become mutual contacts when a new member joins
    all_members = (
        db.query(ConversationMember.user_id)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    member_ids = list(set([m[0] for m in all_members] + [payload.user_id]))
    for uid1 in member_ids:
        for uid2 in member_ids:
            if uid1 != uid2:
                ensure_mutual_contact(db, uid1, uid2)

    db.commit()

    loaded_mem = (
        db.query(ConversationMember)
        .options(selectinload(ConversationMember.user))
        .filter(ConversationMember.id == member.id)
        .first()
    )
    return MemberResponse.model_validate(loaded_mem)


def remove_group_member(
    db: Session, conversation_id: int, current_user_id: int, target_user_id: int
) -> None:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv or conv.type != "group":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation is not a group"
        )

    current_mem = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user_id,
        )
        .first()
    )
    if not current_mem:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    if target_user_id != current_user_id and current_mem.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can remove other members",
        )

    target_mem = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == target_user_id,
        )
        .first()
    )
    if not target_mem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in group"
        )

    db.delete(target_mem)
    db.commit()


def delete_conversation(db: Session, conversation_id: int, current_user_id: int) -> None:
    conv, _ = _get_group_and_check_admin(db, conversation_id, current_user_id)
    db.delete(conv)
    db.commit()


def _get_group_and_check_admin(
    db: Session, conversation_id: int, current_user_id: int
) -> tuple[Conversation, ConversationMember]:
    conv = (
        db.query(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if not conv or conv.type != "group":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation is not a group"
        )

    membership = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user_id,
        )
        .first()
    )
    if not membership or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can perform this action",
        )

    return conv, membership
