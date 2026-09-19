from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models, schemas

router = APIRouter(prefix="/services", tags=["services"])


def _subcategory_out(s: models.ServiceSubcategory) -> schemas.SubcategoryOut:
    return schemas.SubcategoryOut(
        id=s.id, name=s.name, desc=s.desc,
        benefits=[b.strip() for b in (s.benefits or "").split(",") if b.strip()],
        price=s.price, img=s.img,
    )


def _category_out(c: models.ServiceCategory) -> schemas.CategoryOut:
    return schemas.CategoryOut(
        id=c.id, slug=c.slug, title=c.title, tagline=c.tagline, intro=c.intro, hero=c.hero,
        subcategories=[_subcategory_out(s) for s in c.subcategories],
    )


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(models.ServiceCategory).options(joinedload(models.ServiceCategory.subcategories)).all()
    return [_category_out(c) for c in cats]


@router.get("/{slug}")
def get_category(slug: str, db: Session = Depends(get_db)):
    cat = db.query(models.ServiceCategory).filter(models.ServiceCategory.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Service category not found.")
    out = _category_out(cat)
    # Frontend category-render.js expects {title, tagline, hero, intro, subcategories:[{name,desc,benefits,price,img,gallery}]}
    return {
        "title": out.title,
        "tagline": out.tagline,
        "hero": out.hero,
        "intro": out.intro,
        "subcategories": [
            {"name": s.name, "desc": s.desc, "benefits": s.benefits, "price": s.price, "img": s.img, "gallery": []}
            for s in out.subcategories
        ],
    }
