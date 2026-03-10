"""
Main FastAPI application entry point.
Includes: CORS, lifespan (scheduler + DB init), all routers, and dashboard KPI endpoint.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from config import settings
from scheduler import start_scheduler
import models, schemas
from routers import inventory, alerts, reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("main")


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables ready.")

    # Start background scheduler (scan every 5 minutes)
    scheduler = start_scheduler(interval_minutes=5)

    yield  # app is running

    # ── Shutdown ──
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="StockPulse API",
    description=(
        "FastAPI backend for the StockPulse Automated Inventory Alert & Reporting Tool.\n\n"
        "Features:\n"
        "- Inventory CRUD with automatic stock status calculation\n"
        "- Alert generation when items go low or out of stock\n"
        "- CSV / JSON report generation with summary charts\n"
        "- Background scheduler for automated inventory scans"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(inventory.router)
app.include_router(alerts.router)
app.include_router(reports.router)


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "app":     "StockPulse API",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# ── Dashboard KPI endpoint ────────────────────────────────────────────────────

@app.get("/dashboard/kpi", response_model=schemas.DashboardKPI, tags=["Dashboard"])
def dashboard_kpi(db: Session = Depends(get_db)):
    """
    Returns summary KPIs for the dashboard:
    - Total SKUs, in/low/out-of-stock counts, total inventory value
    - Full list of low-stock items for the alerts panel
    """
    products = db.query(models.Product).all()

    in_stock    = [p for p in products if p.status == models.StockStatus.in_stock]
    low_stock   = [p for p in products if p.status == models.StockStatus.low_stock]
    out_stock   = [p for p in products if p.status == models.StockStatus.out_of_stock]
    total_value = sum(p.quantity * p.unit_price for p in products)

    return {
        "total_skus":         len(products),
        "in_stock_count":     len(in_stock),
        "low_stock_count":    len(low_stock),
        "out_of_stock_count": len(out_stock),
        "total_inventory_value": round(total_value, 2),
        "low_stock_items":    low_stock + out_stock,
    }
