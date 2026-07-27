from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from schemas.user import UserResponse


class AttachmentCreate(BaseModel):
    file_url: str
    file_name: str
    mime_type: str
    size_bytes: int


class AttachmentResponse(BaseModel):
    id: int
    message_id: int
    file_url: str
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReactionResponse(BaseModel):
    id: int
    message_id: int
    user_id: int
    emoji: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReactionToggleRequest(BaseModel):
    emoji: str = Field(..., min_length=1)


class MessageCreate(BaseModel):
    conversation_id: int
    body: str = Field(...)
    reply_to_id: Optional[int] = None
    attachments: Optional[List[AttachmentCreate]] = None


class QuotedMessageResponse(BaseModel):
    id: int
    sender_id: int
    body: str
    sender: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    reply_to_id: Optional[int] = None
    body: str
    status: str
    created_at: datetime
    sender: Optional[UserResponse] = None
    reply_to: Optional[QuotedMessageResponse] = None
    reactions: List[ReactionResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True
