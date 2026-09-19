from typing import Optional
from fastapi import APIRouter, Depends, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models, schemas
from deps import get_current_user
from storage import save_upload

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=schemas.PaymentOut)
def submit_payment(
    method: str = Form(...),
    transaction_id: str = Form(...),
    amount: float = Form(...),
    invoice_id: Optional[int] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    screenshot_url = save_upload(screenshot, "payments") if screenshot else None
    payment = models.Payment(
        user_id=user.id,
        invoice_id=invoice_id,
        method=method,
        amount=amount,
        transaction_id=transaction_id,
        screenshot_url=screenshot_url,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/me", response_model=list[schemas.PaymentOut])
def my_payments(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Payment)
        .filter(models.Payment.user_id == user.id)
        .order_by(desc(models.Payment.created_at))
        .all()
    )
