"""
Router: /inventory
CRUD endpoints for Product management with automatic status recalculation.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def compute_status(qty: int, threshold: int) -> models.StockStatus:
    """Derive stock status from quantity and threshold."""
    if qty == 0:
        return models.StockStatus.out_of_stock
    if qty <= threshold:
        return models.StockStatus.low_stock
    return models.StockStatus.in_stock


def _make_alert_if_needed(db: Session, product: models.Product):
    """Auto-create an alert when a product becomes low or out of stock."""
    if product.status in (models.StockStatus.low_stock, models.StockStatus.out_of_stock):
        # Check if an unresolved alert already exists
        existing = (
            db.query(models.Alert)
            .filter(
                models.Alert.product_id == product.id,
                models.Alert.resolved == False,
            )
            .first()
        )
        if not existing:
            severity = (
                models.AlertSeverity.critical
                if product.status == models.StockStatus.out_of_stock
                else models.AlertSeverity.warning
            )
            msg = (
                "Out of stock — reorder immediately."
                if severity == models.AlertSeverity.critical
                else f"Stock below threshold ({product.quantity}/{product.threshold})."
            )
            alert = models.Alert(
                product_id=product.id,
                severity=severity,
                message=msg,
            )
            db.add(alert)


# ── GET /inventory ────────────────────────────────────────────────────────────

@router.get("/", response_model=schemas.ProductListOut)
def list_products(
    page:     int            = Query(1, ge=1),
    per_page: int            = Query(20, ge=1, le=100),
    search:   Optional[str]  = Query(None),
    category: Optional[str]  = Query(None),
    status:   Optional[str]  = Query(None),
    db:       Session        = Depends(get_db),
):
    query = db.query(models.Product)

    if search:
        like = f"%{search}%"
        query = query.filter(
            models.Product.name.ilike(like) | models.Product.sku.ilike(like)
        )
    if category:
        query = query.filter(models.Product.category == category)
    if status:
        query = query.filter(models.Product.status == status)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {"total": total, "page": page, "per_page": per_page, "items": items}


# ── GET /inventory/{id} ───────────────────────────────────────────────────────

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ── POST /inventory ───────────────────────────────────────────────────────────

@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check duplicate SKU
    if db.query(models.Product).filter(models.Product.sku == payload.sku).first():
        raise HTTPException(status_code=409, detail=f"SKU '{payload.sku}' already exists")

    product = models.Product(
        **payload.model_dump(),
        status=compute_status(payload.quantity, payload.threshold),
    )
    db.add(product)
    db.flush()
    _make_alert_if_needed(db, product)
    db.commit()
    db.refresh(product)
    return product


# ── PATCH /inventory/{id} ─────────────────────────────────────────────────────

@router.patch("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    # Recalculate status
    product.status = compute_status(product.quantity, product.threshold)
    product.updated_at = datetime.utcnow()
    _make_alert_if_needed(db, product)
    db.commit()
    db.refresh(product)
    return product


# ── POST /inventory/adjust-stock ─────────────────────────────────────────────

@router.post("/adjust-stock", response_model=schemas.ProductOut)
def adjust_stock(payload: schemas.StockAdjustment, db: Session = Depends(get_db)):
    """Set absolute quantity for a product (used when receiving stock)."""
    product = db.get(models.Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.quantity   = payload.quantity
    product.status     = compute_status(payload.quantity, product.threshold)
    product.updated_at = datetime.utcnow()
    _make_alert_if_needed(db, product)
    db.commit()
    db.refresh(product)
    return product


# ── DELETE /inventory/{id} ────────────────────────────────────────────────────

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
