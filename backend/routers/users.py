from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.user import UserResponse
from services import user as user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return user_service.search_users(db, q, current_user.id)
