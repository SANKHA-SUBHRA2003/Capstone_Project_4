"""
Seed script: populate the database with mock inventory data for testing.
Run once: python seed.py
"""
from database import SessionLocal, engine, Base
import models

# Create all tables
Base.metadata.create_all(bind=engine)

SEED_PRODUCTS = [
    {"sku": "SKU-1001", "name": "Sony WH-1000XM5 Headphones",        "category": "Electronics",   "quantity": 48,  "threshold": 20, "unit_price": 349.99, "mom_trend":  2.1},
    {"sku": "SKU-1002", "name": "Nike Air Max 270",                   "category": "Clothing",      "quantity": 14,  "threshold": 25, "unit_price": 129.99, "mom_trend": -5.3},
    {"sku": "SKU-1003", "name": "Instant Pot Duo 7-in-1",             "category": "Home & Garden", "quantity": 0,   "threshold": 10, "unit_price":  89.99, "mom_trend":-12.0},
    {"sku": "SKU-1004", "name": "Kindle Paperwhite (16GB)",           "category": "Electronics",   "quantity": 122, "threshold": 30, "unit_price": 159.99, "mom_trend":  8.4},
    {"sku": "SKU-1005", "name": "Adidas Ultraboost 23",               "category": "Clothing",      "quantity": 8,   "threshold": 20, "unit_price": 179.99, "mom_trend": -7.1},
    {"sku": "SKU-1006", "name": "LEGO Star Wars Millennium Falcon",   "category": "Toys",          "quantity": 35,  "threshold": 15, "unit_price": 849.99, "mom_trend":  1.5},
    {"sku": "SKU-1007", "name": "Yoga Mat (TPE, 6mm)",               "category": "Sports",        "quantity": 5,   "threshold": 20, "unit_price":  49.99, "mom_trend": -3.8},
    {"sku": "SKU-1008", "name": "Harry Potter Box Set",               "category": "Books",         "quantity": 210, "threshold": 50, "unit_price":  79.99, "mom_trend":  4.2},
    {"sku": "SKU-1009", "name": "iPhone 15 Pro Case",                 "category": "Electronics",   "quantity": 0,   "threshold": 40, "unit_price":  39.99, "mom_trend":-15.2},
    {"sku": "SKU-1010", "name": "Garden Hose 50ft",                   "category": "Home & Garden", "quantity": 74,  "threshold": 20, "unit_price":  59.99, "mom_trend":  0.9},
    {"sku": "SKU-1011", "name": "Resistance Band Set",               "category": "Sports",        "quantity": 18,  "threshold": 30, "unit_price":  34.99, "mom_trend": -2.4},
    {"sku": "SKU-1012", "name": "Atomic Habits – James Clear",       "category": "Books",         "quantity": 320, "threshold": 80, "unit_price":  14.99, "mom_trend":  6.0},
]


def compute_status(qty, threshold):
    if qty == 0:
        return models.StockStatus.out_of_stock
    if qty <= threshold:
        return models.StockStatus.low_stock
    return models.StockStatus.in_stock


def seed():
    db = SessionLocal()
    try:
        existing = db.query(models.Product).count()
        if existing > 0:
            print(f"Database already has {existing} product(s). Skipping seed.")
            return

        for p in SEED_PRODUCTS:
            product = models.Product(
                **p,
                status=compute_status(p["quantity"], p["threshold"]),
            )
            db.add(product)
        db.flush()

        # Generate alerts for low/out-of-stock seed items
        products = db.query(models.Product).all()
        for product in products:
            if product.status in (models.StockStatus.low_stock, models.StockStatus.out_of_stock):
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
                db.add(models.Alert(product_id=product.id, severity=severity, message=msg))

        db.commit()
        print(f"✅ Seeded {len(SEED_PRODUCTS)} products and auto-generated alerts.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
