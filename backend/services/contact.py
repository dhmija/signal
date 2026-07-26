from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from models.contact import Contact
from models.user import User
from schemas.contact import ContactCreate


def add_contact(db: Session, owner_id: int, payload: ContactCreate) -> Contact:
    target_user = db.query(User).filter(User.username == payload.contact_username).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if target_user.id == owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a contact"
        )

    existing = (
        db.query(Contact)
        .filter(Contact.owner_id == owner_id, Contact.contact_id == target_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Contact already exists"
        )

    contact = Contact(
        owner_id=owner_id,
        contact_id=target_user.id,
        nickname=payload.nickname,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def get_contacts(db: Session, owner_id: int) -> List[Contact]:
    return (
        db.query(Contact)
        .options(joinedload(Contact.contact_user))
        .filter(Contact.owner_id == owner_id)
        .order_by(Contact.created_at.desc())
        .all()
    )


def delete_contact(db: Session, owner_id: int, contact_id: int) -> None:
    contact = (
        db.query(Contact)
        .filter(Contact.owner_id == owner_id, Contact.id == contact_id)
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )
    db.delete(contact)
    db.commit()
