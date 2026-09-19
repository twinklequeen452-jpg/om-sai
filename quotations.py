from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models, schemas
from deps import get_current_user

router = APIRouter(prefix="/quotations", tags=["quotations"])


@router.post("", response_model=schemas.QuotationOut)
def request_quotation(payload: schemas.QuotationIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = models.Quotation(user_id=user.id, **payload.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/me", response_model=list[schemas.QuotationOut])
def my_quotations(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Quotation)
        .filter(models.Quotation.user_id == user.id)
        .order_by(desc(models.Quotation.created_at))
        .all()
    )
