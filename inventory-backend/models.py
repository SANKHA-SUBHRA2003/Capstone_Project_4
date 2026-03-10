"""
SQLAlchemy ORM Models
Tables: products, alerts, report_logs
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    Enum, Text, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class StockStatus(str, enum.Enum):
    in_stock    = "In Stock"
    low_stock   = "Low Stock"
    out_of_stock = "Out of Stock"

class AlertSeverity(str, enum.Enum):
    critical = "critical"
    warning  = "warning"
    info     = "info"

class ReportFormat(str, enum.Enum):
    csv  = "csv"
    json = "json"


# ── Products ──────────────────────────────────────────────────────────────────

class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    sku         = Column(String(20), unique=True, index=True, nullable=False)
    name        = Column(String(200), nullable=False)
    category    = Column(String(100), nullable=False)
    quantity    = Column(Integer, default=0, nullable=False)
    threshold   = Column(Integer, default=10, nullable=False)  # low-stock threshold
    unit_price  = Column(Float, nullable=False)
    status      = Column(
        Enum(StockStatus),
        default=StockStatus.in_stock,
        nullable=False
    )
    mom_trend   = Column(Float, default=0.0)   # month-over-month % change
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: one product → many alerts
    alerts = relationship("Alert", back_populates="product", cascade="all, delete-orphan")


# ── Alerts ────────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id          = Column(Integer, primary_key=True, index=True)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    severity    = Column(Enum(AlertSeverity), nullable=False)
    message     = Column(Text, nullable=False)
    resolved    = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    product = relationship("Product", back_populates="alerts")


# ── Report Logs ───────────────────────────────────────────────────────────────

class ReportLog(Base):
    __tablename__ = "report_logs"

    id           = Column(Integer, primary_key=True, index=True)
    report_name  = Column(String(200), nullable=False)
    period_label = Column(String(100), nullable=False)
    format       = Column(Enum(ReportFormat), nullable=False)
    row_count    = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.utcnow)
    triggered_by = Column(String(50), default="manual")   # "manual" | "scheduler"
