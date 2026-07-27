from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.deps import get_current_user, get_db
from models.user import User
from schemas.auth import LoginRequest, RegisterRequest, ResetPasswordRequest, TokenResponse
from schemas.user import UserResponse
from services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/check-username")
def check_username(username: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username.ilike(username.strip())).first()
    return {"exists": user is not None}


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(payload, db)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(payload, db)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.reset_password(payload, db)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
