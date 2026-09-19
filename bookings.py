from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models, schemas
from deps import get_current_user

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=schemas.BookingOut)
def create_booking(payload: schemas.BookingIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    booking = models.Booking(user_id=user.id, **payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/me", response_model=list[schemas.BookingOut])
def my_bookings(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Booking)
        .filter(models.Booking.user_id == user.id)
        .order_by(desc(models.Booking.created_at))
        .all()
    )
