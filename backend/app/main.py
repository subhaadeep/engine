"""
GA Engine Backend  —  v1.0.3

Startup order
  1. init_db()         – create all SQLite tables
  2. Register routers  – import_router, filter_router,
                          backtest_router, montecarlo_router
  3. /api/version      – always returns {"version": APP_VERSION, ...}

All routers live in app/routers/*.py and own their own /api/... prefix.
main.py includes them with NO extra prefix (avoids double-prefix bug).
"""
from __future__ import annotations

import os
import platform
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# ───────────────────────────────────────────────────────────────────────────────
APP_VERSION = "1.0.3"
# ───────────────────────────────────────────────────────────────────────────────


# ── DB startup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import init_db
    await init_db()
    print(f"\n  GA Engine v{APP_VERSION} started  ✔")
    print(f"  DB      : {os.path.abspath('./trading.db')}")
    print(f"  Data dir: {os.path.abspath('./data')}")
    print(f"  Docs    : http://127.0.0.1:8765/docs\n")
    yield


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GA Engine",
    version=APP_VERSION,
    description="Genetic Algorithm parameter explorer + backtest + Monte Carlo engine",
    lifespan=lifespan,
)


# ── CORS ─────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Version endpoint (always works — no DB needed) ──────────────────────────

@app.get("/api/version", tags=["system"])
def version():
    return {
        "version":    APP_VERSION,
        "python":     sys.version,
        "platform":   platform.system(),
        "db_path":    os.path.abspath("./trading.db"),
        "data_dir":   os.path.abspath("./data"),
    }


# ── Health ──────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["system"])
def health():
    return {"status": "ok", "version": APP_VERSION}


# ── Domain routers ────────────────────────────────────────────────────────────────
# Each router in app/routers/ defines its OWN full prefix (e.g. /api/import).
# We include them here with NO additional prefix — prevents double-prefix.

from app.routers.import_router    import router as import_router     # noqa: E402
from app.routers.filter_router    import router as filter_router     # noqa: E402
from app.routers.backtest_router  import router as backtest_router   # noqa: E402
from app.routers.montecarlo_router import router as montecarlo_router  # noqa: E402

app.include_router(import_router)
app.include_router(filter_router)
app.include_router(backtest_router)
app.include_router(montecarlo_router)


# ── Serve built frontend (production) ──────────────────────────────────────────

FRONTEND_DIST = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "dist"
)
if os.path.isdir(FRONTEND_DIST):
    _assets = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        _idx = os.path.join(FRONTEND_DIST, "index.html")
        return FileResponse(_idx)
