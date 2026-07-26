from typing import List
from sqlalchemy.orm import Session
from models.user import User


def search_users(db: Session, query: str, current_user_id: int) -> List[User]:
    if not query.strip():
        return []
    pattern = f"%{query.strip()}%"
    return (
        db.query(User)
        .filter(
            User.id != current_user_id,
            (User.username.ilike(pattern) | User.display_name.ilike(pattern)),
        )
        .limit(20)
        .all()
    )
