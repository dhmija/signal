from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    nickname: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now()
    )

    # String reference avoids a circular import with models/user.py
    contact_user: Mapped["User"] = relationship("User", foreign_keys=[contact_id])

    __table_args__ = (UniqueConstraint("owner_id", "contact_id"),)
