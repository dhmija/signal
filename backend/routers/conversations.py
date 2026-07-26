from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.conversation import ConversationCreate, ConversationResponse
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
