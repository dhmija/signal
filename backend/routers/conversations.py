from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.conversation import (
    AddMemberRequest,
    ConversationCreate,
    ConversationResponse,
    GroupUpdate,
    MemberResponse,
)
from services import conversation as conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.list_conversations(db, current_user.id)


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.create_conversation(db, current_user.id, payload)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.get_conversation_by_id(db, conversation_id, current_user.id)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation_service.delete_conversation(db, conversation_id, current_user.id)


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def update_group_info(
    conversation_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.update_group_info(db, conversation_id, current_user.id, payload)


@router.get("/{conversation_id}/members", response_model=List[MemberResponse])
def get_group_members(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.get_group_members(db, conversation_id, current_user.id)


@router.post("/{conversation_id}/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_group_member(
    conversation_id: int,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.add_group_member(db, conversation_id, current_user.id, payload)


@router.delete("/{conversation_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_group_member(
    conversation_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation_service.remove_group_member(db, conversation_id, current_user.id, user_id)
