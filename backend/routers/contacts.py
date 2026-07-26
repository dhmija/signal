from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from core.deps import get_current_user, get_db
from models.user import User
from schemas.contact import ContactCreate, ContactResponse
from services import contact as contact_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contact_service.add_contact(db, current_user.id, payload)


@router.get("", response_model=List[ContactResponse])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contact_service.get_contacts(db, current_user.id)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact_service.delete_contact(db, current_user.id, contact_id)
