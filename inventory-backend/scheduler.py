"""
Background scheduler: checks inventory levels at set intervals
and auto-creates alerts for low/out-of-stock products.
"""
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models

logger = logging.getLogger("scheduler")


def check_inventory_levels():
    """
    Runs on a schedule.
    Scans all products and raises alerts for any that are low or out of stock.
    """
    db: Session = SessionLocal()
    try:
        products = db.query(models.Product).all()
        alerted = 0

        for product in products:
            if product.status in (
                models.StockStatus.low_stock,
                models.StockStatus.out_of_stock,
            ):
                # Don't duplicate open alerts
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
                        "Out of stock — reorder immediately. [auto-scan]"
                        if severity == models.AlertSeverity.critical
                        else f"Stock below threshold ({product.quantity}/{product.threshold}). [auto-scan]"
                    )
                    alert = models.Alert(
                        product_id=product.id,
                        severity=severity,
                        message=msg,
                    )
                    db.add(alert)
                    alerted += 1

        db.commit()
        logger.info(
            "[%s] Inventory scan complete — %d product(s) scanned, %d new alert(s) raised.",
            datetime.utcnow().strftime("%H:%M:%S"),
            len(products),
            alerted,
        )
    except Exception as exc:
        logger.error("Scheduler error: %s", exc)
        db.rollback()
    finally:
        db.close()


def start_scheduler(interval_minutes: int = 5) -> BackgroundScheduler:
    """Start the APScheduler background job and return the scheduler instance."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        check_inventory_levels,
        trigger="interval",
        minutes=interval_minutes,
        id="inventory_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — inventory scan every %d minute(s).", interval_minutes)
    return scheduler
