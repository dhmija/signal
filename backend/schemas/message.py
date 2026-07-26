from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.user import UserResponse


class MessageCreate(BaseModel):
    conversation_id: int
    body: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    status: str
    created_at: datetime
    sender: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class MessageStatusUpdate(BaseModel):
    message_ids: List[int]
    status: str = Field(..., pattern="^(delivered|read)$")
