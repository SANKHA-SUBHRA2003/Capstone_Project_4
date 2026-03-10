"""
Router: /alerts
View and resolve stock level alerts.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=schemas.AlertListOut)
def list_alerts(
    severity:  str | None = Query(None),
    resolved:  bool       = Query(False),
    db:        Session    = Depends(get_db),
):
    query = (
        db.query(models.Alert)
        .options(joinedload(models.Alert.product))
        .filter(models.Alert.resolved == resolved)
    )
    if severity:
        query = query.filter(models.Alert.severity == severity)

    items = query.order_by(models.Alert.created_at.desc()).all()

    # Attach product info into response
    result = []
    for a in items:
        d = schemas.AlertOut.model_validate(a)
        d.product_sku  = a.product.sku  if a.product else None
        d.product_name = a.product.name if a.product else None
        result.append(d)

    return {"total": len(result), "items": result}


@router.get("/{alert_id}", response_model=schemas.AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(models.Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/resolve", response_model=schemas.AlertOut)
def resolve_alert(
    alert_id: int,
    payload:  schemas.AlertResolvePayload,
    db:       Session = Depends(get_db),
):
    alert = db.get(models.Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.resolved    = payload.resolved
    alert.resolved_at = datetime.utcnow() if payload.resolved else None
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(models.Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
