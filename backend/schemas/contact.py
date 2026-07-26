from datetime import datetime
from pydantic import BaseModel
from schemas.user import UserResponse


class ContactCreate(BaseModel):
    contact_username: str
    nickname: str | None = None


class ContactResponse(BaseModel):
    id: int
    owner_id: int
    contact_id: int
    nickname: str | None = None
    created_at: datetime
    contact_user: UserResponse

    class Config:
        from_attributes = True
