"""
Pydantic Schemas (request/response validation)
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ── Stock Status ──────────────────────────────────────────────────────────────

class StockStatusEnum(str):
    in_stock     = "In Stock"
    low_stock    = "Low Stock"
    out_of_stock = "Out of Stock"


# ── Product Schemas ───────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    sku:        str  = Field(..., min_length=1, max_length=20,  example="SKU-1001")
    name:       str  = Field(..., min_length=1, max_length=200, example="Sony WH-1000XM5")
    category:   str  = Field(..., min_length=1, max_length=100, example="Electronics")
    quantity:   int  = Field(..., ge=0,          example=48)
    threshold:  int  = Field(..., gt=0,          example=20)
    unit_price: float = Field(..., gt=0,         example=349.99)
    mom_trend:  float = Field(0.0,               example=2.1)

    @field_validator("unit_price")
    @classmethod
    def price_max_decimal(cls, v):
        return round(v, 2)


class ProductCreate(ProductBase):
    """Used when creating a new product (POST /inventory)."""
    pass


class ProductUpdate(BaseModel):
    """All fields optional for partial updates (PATCH /inventory/{id})."""
    name:       Optional[str]   = None
    category:   Optional[str]   = None
    quantity:   Optional[int]   = Field(None, ge=0)
    threshold:  Optional[int]   = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, gt=0)
    mom_trend:  Optional[float] = None

    @field_validator("unit_price", mode="before")
    @classmethod
    def price_round(cls, v):
        return round(v, 2) if v is not None else v


class ProductOut(ProductBase):
    id:         int
    status:     str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    total:    int
    page:     int
    per_page: int
    items:    List[ProductOut]


# ── Alert Schemas ─────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id:          int
    product_id:  int
    severity:    str
    message:     str
    resolved:    bool
    created_at:  datetime
    resolved_at: Optional[datetime] = None

    # Joined product info for convenience
    product_sku:  Optional[str] = None
    product_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AlertResolvePayload(BaseModel):
    resolved: bool = True


class AlertListOut(BaseModel):
    total:    int
    items:    List[AlertOut]


# ── Stock Update (quantity adjustment) ────────────────────────────────────────

class StockAdjustment(BaseModel):
    """Adjust quantity for a product (e.g., after receiving new stock)."""
    product_id: int = Field(..., gt=0)
    quantity:   int = Field(..., ge=0, description="New absolute quantity (not a delta)")
    note:       Optional[str] = Field(None, max_length=255)


# ── Report Schemas ────────────────────────────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    period_label: str   = Field(..., example="August 2025")
    format:       str   = Field("csv", pattern="^(csv|json)$")
    date_from:    Optional[str] = Field(None, example="2025-08-01")
    date_to:      Optional[str] = Field(None, example="2025-08-31")


class ReportLogOut(BaseModel):
    id:           int
    report_name:  str
    period_label: str
    format:       str
    row_count:    int
    generated_at: datetime
    triggered_by: str

    model_config = {"from_attributes": True}


class ReportListOut(BaseModel):
    total: int
    items: List[ReportLogOut]


# ── KPI / Dashboard ───────────────────────────────────────────────────────────

class DashboardKPI(BaseModel):
    total_skus:        int
    in_stock_count:    int
    low_stock_count:   int
    out_of_stock_count:int
    total_inventory_value: float
    low_stock_items:   List[ProductOut]
