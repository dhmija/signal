from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.user import UserResponse


class ConversationCreate(BaseModel):
    type: str = Field(default="direct", pattern="^(direct|group)$")
    participant_ids: List[int]
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class AddMemberRequest(BaseModel):
    user_id: int
    role: str = Field(default="member", pattern="^(member|admin)$")


class MemberResponse(BaseModel):
    id: int
    conversation_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: int
    disappearing_timer: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    participants: List[UserResponse] = []
    unread_count: int = 0
    last_message: Optional[dict] = None

    class Config:
        from_attributes = True
