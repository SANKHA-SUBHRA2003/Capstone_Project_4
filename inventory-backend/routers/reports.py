"""
Router: /reports
Generate & download inventory reports (CSV / JSON) + audit log.
"""
import csv
import json
import io
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/reports", tags=["Reports"])

REPORTS_DIR = "reports_output"
os.makedirs(REPORTS_DIR, exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_rows(products: list[models.Product], period: str) -> list[dict]:
    return [
        {
            "SKU":          p.sku,
            "Product":      p.name,
            "Category":     p.category,
            "Quantity":     p.quantity,
            "Threshold":    p.threshold,
            "Unit Price":   f"${p.unit_price:.2f}",
            "Total Value":  f"${p.quantity * p.unit_price:.2f}",
            "Status":       p.status.value,
            "MoM Trend":    f"{'+' if p.mom_trend >= 0 else ''}{p.mom_trend}%",
            "Period":       period,
            "Generated At": datetime.utcnow().isoformat(),
        }
        for p in products
    ]


def _summary_block(products: list[models.Product], period: str) -> str:
    total      = len(products)
    in_stock   = sum(1 for p in products if p.status == models.StockStatus.in_stock)
    low_stock  = sum(1 for p in products if p.status == models.StockStatus.low_stock)
    out_stock  = sum(1 for p in products if p.status == models.StockStatus.out_of_stock)
    total_val  = sum(p.quantity * p.unit_price for p in products)
    categories = list({p.category for p in products})

    max_qty = max((p.quantity for p in products), default=1) or 1
    sorted_p = sorted(products, key=lambda x: x.quantity, reverse=True)[:8]
    bar_rows = [
        f"{p.sku:<12}|{'█' * round(p.quantity/max_qty*20)}{'░'*(20-round(p.quantity/max_qty*20))}| {p.quantity}"
        for p in sorted_p
    ]

    lines = [
        '"=== STOCKPULSE INVENTORY REPORT (API) ==="',
        f'"Period: {period}"',
        f'"Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}"',
        '""',
        '"── SUMMARY ──"',
        f'"Total SKUs","{total}"',
        f'"In Stock","{in_stock}"',
        f'"Low Stock","{low_stock}"',
        f'"Out of Stock","{out_stock}"',
        f'"Total Value","${total_val:,.2f}"',
        f'"Categories","{" | ".join(categories)}"',
        '""',
        '"── QUANTITY CHART (Top 8 SKUs) ──"',
        *[f'"{r}"' for r in bar_rows],
        '""',
        '"── INVENTORY DETAIL ──"',
    ]
    return "\n".join(lines)


# ── POST /reports/generate ────────────────────────────────────────────────────

@router.post("/generate")
def generate_report(
    payload: schemas.ReportGenerateRequest,
    db:      Session = Depends(get_db),
):
    """
    Generate and stream a CSV or JSON report back to the client.
    Also logs the generation to report_logs.
    """
    products = db.query(models.Product).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found in database")

    rows   = _build_rows(products, payload.period_label)
    fname  = f"StockPulse_{payload.period_label.replace(' ', '_')}_{payload.format}"

    if payload.format == "csv":
        summary = _summary_block(products, payload.period_label)
        buf = io.StringIO()
        buf.write(summary + "\n")
        writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        buf.seek(0)

        # Log it
        log = models.ReportLog(
            report_name=fname, period_label=payload.period_label,
            format=models.ReportFormat.csv, row_count=len(rows), triggered_by="manual",
        )
        db.add(log); db.commit()

        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{fname}.csv"'},
        )

    # JSON
    payload_json = {
        "reportMeta": {
            "title":       "StockPulse Inventory Report",
            "period":      payload.period_label,
            "generatedAt": datetime.utcnow().isoformat(),
            "totalSKUs":   len(rows),
            "summary": {
                "inStock":   sum(1 for p in products if p.status == models.StockStatus.in_stock),
                "lowStock":  sum(1 for p in products if p.status == models.StockStatus.low_stock),
                "outOfStock":sum(1 for p in products if p.status == models.StockStatus.out_of_stock),
                "totalValue":f"${sum(p.quantity*p.unit_price for p in products):,.2f}",
                "categoryBreakdown": [
                    {
                        "category": cat,
                        "count":    sum(1 for p in products if p.category == cat),
                        "totalQty": sum(p.quantity for p in products if p.category == cat),
                    }
                    for cat in {p.category for p in products}
                ],
            },
        },
        "items": rows,
    }

    log = models.ReportLog(
        report_name=fname, period_label=payload.period_label,
        format=models.ReportFormat.json, row_count=len(rows), triggered_by="manual",
    )
    db.add(log); db.commit()

    return JSONResponse(content=payload_json, headers={
        "Content-Disposition": f'attachment; filename="{fname}.json"'
    })


# ── GET /reports/logs ─────────────────────────────────────────────────────────

@router.get("/logs", response_model=schemas.ReportListOut)
def list_report_logs(
    limit: int = Query(20, ge=1, le=100),
    db:    Session = Depends(get_db),
):
    items = (
        db.query(models.ReportLog)
        .order_by(models.ReportLog.generated_at.desc())
        .limit(limit)
        .all()
    )
    return {"total": len(items), "items": items}
