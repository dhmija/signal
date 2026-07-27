from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token, hash_password, verify_password
from models.user import User
from schemas.auth import MOCK_OTP, LoginRequest, RegisterRequest, ResetPasswordRequest, TokenResponse


def register(payload: RegisterRequest, db: Session) -> TokenResponse:
    # OTP check is server-side so it can be swapped for real SMS verification
    # without changing the API contract
    if payload.otp != MOCK_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    avatar = (
        payload.avatar_url
        or f"https://api.dicebear.com/9.x/thumbs/svg?seed={payload.username}"
    )

    user = User(
        username=payload.username,
        display_name=payload.display_name,
        avatar_url=avatar,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


def login(payload: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username).first()

    # Deliberate vague error — don't reveal whether the username exists
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user.is_online = True
    user.last_seen = datetime.now(timezone.utc)
    db.commit()

    return TokenResponse(access_token=create_access_token(user.id))


def reset_password(payload: ResetPasswordRequest, db: Session) -> dict:
    if payload.otp != MOCK_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    user = db.query(User).filter(User.username.ilike(payload.username.strip())).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully"}
