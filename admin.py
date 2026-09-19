from datetime import datetime
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

from database import get_db
import models, schemas
from deps import get_current_admin
from storage import save_upload

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


# ================= ANALYTICS =================
@router.get("/stats", response_model=schemas.StatsOut)
def stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).filter(models.User.role == "user").count()
    total_bookings = db.query(models.Booking).count()
    total_revenue = db.query(func.coalesce(func.sum(models.Invoice.total), 0.0)).filter(models.Invoice.status == "paid").scalar()
    now = datetime.utcnow()
    monthly_revenue = (
        db.query(func.coalesce(func.sum(models.Invoice.total), 0.0))
        .filter(models.Invoice.status == "paid", func.strftime("%Y-%m", models.Invoice.created_at) == now.strftime("%Y-%m"))
        .scalar()
    )
    bookings = db.query(models.Booking.category, models.Booking.sub_service).all()
    counts = Counter(bookings)
    popular = [
        schemas.PopularService(category=c, sub_service=s, count=n)
        for (c, s), n in counts.most_common(5)
    ]
    return schemas.StatsOut(
        total_users=total_users,
        total_bookings=total_bookings,
        total_revenue=total_revenue or 0,
        monthly_revenue=monthly_revenue or 0,
        popular_services=popular,
    )


# ================= USERS =================
@router.get("/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(desc(models.User.created_at)).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an admin account.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted."}


# ================= BOOKINGS =================
@router.get("/bookings", response_model=list[schemas.BookingOut])
def list_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).order_by(desc(models.Booking.created_at)).all()


@router.patch("/bookings/{booking_id}", response_model=schemas.BookingOut)
def update_booking(booking_id: int, payload: schemas.BookingStatusIn, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if payload.status not in ("pending", "approved", "rejected", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status.")
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return booking


# ================= SERVICES (categories & subcategories) =================
@router.post("/services", response_model=schemas.CategoryOut)
def create_category(payload: schemas.CategoryIn, db: Session = Depends(get_db)):
    if db.query(models.ServiceCategory).filter(models.ServiceCategory.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="A category with this slug already exists.")
    cat = models.ServiceCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/services/{slug}", response_model=schemas.CategoryOut)
def update_category(slug: str, payload: schemas.CategoryIn, db: Session = Depends(get_db)):
    cat = db.query(models.ServiceCategory).filter(models.ServiceCategory.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    for k, v in payload.model_dump().items():
        if k == "slug":
            continue
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/services/{slug}")
def delete_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(models.ServiceCategory).filter(models.ServiceCategory.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted."}


@router.post("/services/{slug}/subcategories", response_model=schemas.SubcategoryOut)
def add_subcategory(slug: str, payload: schemas.SubcategoryIn, db: Session = Depends(get_db)):
    cat = db.query(models.ServiceCategory).filter(models.ServiceCategory.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")
    sub = models.ServiceSubcategory(
        category_id=cat.id, name=payload.name, desc=payload.desc,
        benefits=",".join(payload.benefits), price=payload.price, img=payload.img,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return schemas.SubcategoryOut(id=sub.id, name=sub.name, desc=sub.desc, benefits=payload.benefits, price=sub.price, img=sub.img)


@router.put("/services/{slug}/subcategories/{sub_id}", response_model=schemas.SubcategoryOut)
def update_subcategory(slug: str, sub_id: int, payload: schemas.SubcategoryIn, db: Session = Depends(get_db)):
    sub = db.query(models.ServiceSubcategory).get(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Sub-service not found.")
    sub.name, sub.desc, sub.price, sub.img = payload.name, payload.desc, payload.price, payload.img
    sub.benefits = ",".join(payload.benefits)
    db.commit()
    db.refresh(sub)
    return schemas.SubcategoryOut(id=sub.id, name=sub.name, desc=sub.desc, benefits=payload.benefits, price=sub.price, img=sub.img)


@router.delete("/services/{slug}/subcategories/{sub_id}")
def delete_subcategory(slug: str, sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(models.ServiceSubcategory).get(sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Sub-service not found.")
    db.delete(sub)
    db.commit()
    return {"message": "Sub-service deleted."}


# ================= PAYMENTS =================
@router.get("/payments", response_model=list[schemas.PaymentAdminOut])
def list_payments(db: Session = Depends(get_db)):
    payments = db.query(models.Payment).options(joinedload(models.Payment.user)).order_by(desc(models.Payment.created_at)).all()
    return [
        schemas.PaymentAdminOut(
            id=p.id, method=p.method, amount=p.amount, transaction_id=p.transaction_id,
            screenshot_url=p.screenshot_url, status=p.status, created_at=p.created_at,
            user_name=p.user.full_name if p.user else "—",
        )
        for p in payments
    ]


@router.patch("/payments/{payment_id}", response_model=schemas.PaymentOut)
def update_payment(payment_id: int, payload: schemas.PaymentStatusIn, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")
    if payload.status not in ("pending", "verified", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status.")
    payment.status = payload.status
    if payload.status == "verified" and payment.invoice_id:
        invoice = db.query(models.Invoice).get(payment.invoice_id)
        if invoice:
            invoice.status = "paid"
    db.commit()
    db.refresh(payment)
    return payment


# ================= QUOTATIONS =================
@router.get("/quotations", response_model=list[schemas.QuotationAdminOut])
def list_quotations(db: Session = Depends(get_db)):
    quotations = db.query(models.Quotation).options(joinedload(models.Quotation.user)).order_by(desc(models.Quotation.created_at)).all()
    return [
        schemas.QuotationAdminOut(
            id=q.id, category=q.category, sub_service=q.sub_service, area_sqft=q.area_sqft,
            budget_range=q.budget_range, requirements=q.requirements, status=q.status,
            quoted_amount=q.quoted_amount, valid_until=q.valid_until, admin_notes=q.admin_notes,
            created_at=q.created_at, user_name=q.user.full_name if q.user else "—",
        )
        for q in quotations
    ]


@router.patch("/quotations/{quotation_id}", response_model=schemas.QuotationOut)
def update_quotation(quotation_id: int, payload: schemas.QuotationUpdateIn, db: Session = Depends(get_db)):
    q = db.query(models.Quotation).get(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found.")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(q, k, v)
    db.commit()
    db.refresh(q)
    return q


# ================= INVOICES =================
@router.get("/invoices", response_model=list[schemas.InvoiceAdminOut])
def list_invoices(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).options(joinedload(models.Invoice.items), joinedload(models.Invoice.user)).order_by(desc(models.Invoice.created_at)).all()
    return [
        schemas.InvoiceAdminOut(
            id=i.id, total=i.total, status=i.status, created_at=i.created_at,
            items=i.items, user_name=i.user.full_name if i.user else "—",
        )
        for i in invoices
    ]


@router.post("/invoices", response_model=schemas.InvoiceOut)
def create_invoice(payload: schemas.InvoiceCreateIn, db: Session = Depends(get_db)):
    user = db.query(models.User).get(payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found.")
    total = sum(item.qty * item.rate for item in payload.items)
    invoice = models.Invoice(user_id=user.id, total=total, status="unpaid")
    db.add(invoice)
    db.flush()
    for item in payload.items:
        db.add(models.InvoiceItem(invoice_id=invoice.id, description=item.description, qty=item.qty, rate=item.rate))
    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}", response_model=schemas.InvoiceOut)
def update_invoice(invoice_id: int, payload: schemas.InvoiceStatusIn, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).get(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if payload.status not in ("unpaid", "paid"):
        raise HTTPException(status_code=400, detail="Invalid status.")
    invoice.status = payload.status
    db.commit()
    db.refresh(invoice)
    return invoice


# ================= GALLERY =================
@router.get("/gallery", response_model=list[schemas.GalleryOut])
def list_gallery(db: Session = Depends(get_db)):
    return db.query(models.GalleryImage).order_by(desc(models.GalleryImage.created_at)).all()


@router.post("/gallery", response_model=schemas.GalleryOut)
def upload_gallery_image(
    category: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    url = save_upload(image, "gallery")
    img = models.GalleryImage(category=category, url=url)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.delete("/gallery/{image_id}")
def delete_gallery_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(models.GalleryImage).get(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")
    db.delete(img)
    db.commit()
    return {"message": "Image deleted."}
