from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from database import get_db
import models, schemas
from deps import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get("/me", response_model=list[schemas.InvoiceOut])
def my_invoices(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Invoice)
        .options(joinedload(models.Invoice.items))
        .filter(models.Invoice.user_id == user.id)
        .order_by(desc(models.Invoice.created_at))
        .all()
    )
