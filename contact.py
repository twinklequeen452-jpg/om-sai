from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("")
def send_message(payload: schemas.ContactIn, db: Session = Depends(get_db)):
    msg = models.ContactMessage(**payload.model_dump())
    db.add(msg)
    db.commit()
    # In production, also notify the team — e.g. email/Slack webhook.
    return {"message": "Message received. We'll get back to you within 24 hours."}
