# StockPulse — Inventory Alert & Reporting Tool

> An automated inventory management dashboard with real-time stock alerts, report generation, and a FastAPI backend connected to MySQL.

---

## Project Structure

```
SELF PROJECTS/
├── inventory-dashboard/   ← React frontend (Vite)
└── inventory-backend/     ← Python FastAPI backend
```

---

## Frontend Stack (`inventory-dashboard`)

| Library              | Version | Why It's Used                                                                       |
| -------------------- | ------- | ----------------------------------------------------------------------------------- |
| **React**            | 18      | UI component model — state, hooks, and component composition                        |
| **Vite**             | 7       | Blazing-fast dev server and build tool, replaces Create React App                   |
| **React Router DOM** | 6       | Client-side routing between Dashboard, Inventory, Alerts, Reports, Analytics pages  |
| **Framer Motion**    | —       | Page transitions, animated counters, modal animations, hover effects                |
| **Recharts**         | —       | Chart library built on D3 — AreaChart, BarChart, PieChart, RadarChart, ScatterChart |
| **Lucide React**     | —       | Clean, consistent icon set (Trash, Bell, Download, etc.)                            |
| **CSS Variables**    | —       | Design token system for the entire dark-purple theme                                |

### Why these choices?

- **Vite over CRA** — 10–20× faster HMR, no Webpack bloat. Essential for a smooth dev experience.
- **Recharts** — The most React-native chart library. Composable D3-based charts with zero configuration needed for responsive layouts.
- **Framer Motion** — Declarative animation API that pairs with React state cleanly; enables the glassmorphism feel without heavy CSS keyframe work.
- **No CSS framework (no Tailwind)** — Full control over the dark theme using CSS custom properties (`var(--purple-500)` etc.). Easier to maintain a bespoke aesthetic.

---

## Backend Stack (`inventory-backend`)

| Library               | Version | Why It's Used                                                                           |
| --------------------- | ------- | --------------------------------------------------------------------------------------- |
| **FastAPI**           | 0.115   | High-performance ASGI framework; auto-generates OpenAPI docs at `/docs`                 |
| **Uvicorn**           | 0.32    | ASGI server to run FastAPI — supports hot reload in development                         |
| **SQLAlchemy**        | 2.0     | ORM for MySQL — defines `Product`, `Alert`, `ReportLog` models as Python classes        |
| **PyMySQL**           | 1.1     | Pure-Python MySQL driver (no C extension needed, easy to install on Windows)            |
| **Pydantic v2**       | 2.10    | Data validation on all request/response bodies — field types, bounds, custom validators |
| **Pydantic-Settings** | 2.7     | Loads `.env` file variables into a typed `Settings` class                               |
| **APScheduler**       | 3.10    | Background scheduler — scans inventory every 5 min and auto-creates alerts              |
| **Cryptography**      | 43      | Required by PyMySQL for SSL/auth plugin support                                         |
| **Alembic**           | 1.14    | Database migration tool (for future schema changes without dropping tables)             |
| **python-dotenv**     | 1.0     | Loads `.env` credentials at startup                                                     |

### Why these choices?

- **FastAPI over Django/Flask** — Auto-generates interactive Swagger docs, natively async, and Pydantic is built-in. Perfect for a JSON API.
- **SQLAlchemy 2.0** — Modern ORM with the new `DeclarativeBase` style; relationships and cascades are declarative and readable.
- **Pydantic v2** — Faster than v1, `model_dump()` replaces `.dict()`, `field_validator` is explicit and type-safe.
- **APScheduler** — Lightweight in-process scheduler; no external message broker (Redis/Celery) needed for a 5-minute scan job.
- **PyMySQL** — Zero-dependency, pure Python. Works out of the box on Windows without needing MySQL client libraries.

---

## Database: MySQL

| Choice                | Reason                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **MySQL** (via XAMPP) | Relational structure suits inventory (products ↔ alerts FK relationship); XAMPP is the easiest single-installer setup on Windows |
| **3 tables**          | `products`, `alerts`, `report_logs`                                                                                              |
| **Auto-status**       | Backend computes `In Stock / Low Stock / Out of Stock` from `quantity` vs `threshold` on every write                             |
| **Auto-alerts**       | On every stock update, if quantity ≤ threshold a new unresolved alert is created automatically                                   |

---

## Key Features & How They're Built

| Feature                  | Implementation                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Login with email display | `AuthContext` (React Context) — extracts display name from email before `@`                                   |
| Live KPI cards           | `GET /dashboard/kpi` → Dashboard fetches on mount, skeleton shimmer while loading                             |
| Inventory CRUD           | `GET/POST/PATCH/DELETE /inventory/` — delete from UI updates MySQL immediately                                |
| Add Product modal        | `POST /inventory/` with Pydantic validation (duplicate SKU → 409 error)                                       |
| Auto-alert creation      | Backend `_make_alert_if_needed()` runs on every inventory write                                               |
| Restock & resolve        | Alerts page fetches full product → PATCH `/inventory/{id}` → if qty > threshold, PATCH `/alerts/{id}/resolve` |
| Report download          | `POST /reports/generate` streams CSV (with ASCII bar charts) or JSON from MySQL directly to browser           |
| Report history           | Every generation logged to `report_logs` table, shown on Reports page                                         |
| Auto-scanner             | APScheduler runs `check_inventory_levels()` every 5 minutes in the background                                 |
| Calendar date picker     | Custom `CalendarPicker` component — no external date library needed                                           |

---

## Running the Project

### Backend

```powershell
cd inventory-backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend

```powershell
cd inventory-dashboard
npm run dev
# App: http://localhost:5173
```

### First-time Setup

```powershell
# 1. Start MySQL (XAMPP Control Panel → Start MySQL)
# 2. Create database:
#    Open XAMPP Shell → mysql -u root → CREATE DATABASE stockpulse;
# 3. Install Python deps:
pip install -r requirements.txt
# 4. Seed the database (12 products + alerts):
python seed.py
# 5. Start backend then frontend as above
```

---

## API Quick Reference

| Method | Endpoint               | Description                                        |
| ------ | ---------------------- | -------------------------------------------------- |
| GET    | `/dashboard/kpi`       | KPI summary for dashboard                          |
| GET    | `/inventory/`          | Paginated list (search, filter by status/category) |
| POST   | `/inventory/`          | Create product (validates SKU uniqueness)          |
| PATCH  | `/inventory/{id}`      | Partial update (auto-recalculates status)          |
| DELETE | `/inventory/{id}`      | Remove product + cascade-delete its alerts         |
| GET    | `/alerts/`             | List active/resolved alerts                        |
| PATCH  | `/alerts/{id}/resolve` | Mark alert resolved                                |
| POST   | `/reports/generate`    | Stream CSV or JSON report                          |
| GET    | `/reports/logs`        | Report generation history                          |
