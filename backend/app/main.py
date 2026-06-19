"""
GA Engine Backend  —  v1.0.4
"""
from __future__ import annotations

import os
import platform
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

APP_VERSION = "1.0.4"


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import init_db
    await init_db()
    print(f"\n  GA Engine v{APP_VERSION} ready  ✔")
    print(f"  DB      : {os.path.abspath('./trading.db')}")
    print(f"  Data    : {os.path.abspath('./data')}")
    print(f"  Docs    : http://127.0.0.1:8765/docs\n")
    yield


app = FastAPI(
    title="GA Engine",
    version=APP_VERSION,
    description="Genetic Algorithm parameter explorer + backtest + Monte Carlo",
    lifespan=lifespan,
)

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


# ── System endpoints ──────────────────────────────────────────────────────────

@app.get("/api/version", tags=["system"])
def version():
    return {
        "version":  APP_VERSION,
        "python":   sys.version,
        "platform": platform.system(),
        "db_path":  os.path.abspath("./trading.db"),
        "data_dir": os.path.abspath("./data"),
    }


@app.get("/api/health", tags=["system"])
def health():
    return {"status": "ok", "version": APP_VERSION}


# ── Domain routers ────────────────────────────────────────────────────────────────
# Routers own their full prefix (e.g. /api/import).
# Include with NO extra prefix here — prevents double-prefix.

from app.routers.import_router     import router as import_router      # noqa: E402
from app.routers.filter_router     import router as filter_router      # noqa: E402
from app.routers.backtest_router   import router as backtest_router    # noqa: E402
from app.routers.montecarlo_router import router as montecarlo_router  # noqa: E402

app.include_router(import_router)
app.include_router(filter_router)
app.include_router(backtest_router)
app.include_router(montecarlo_router)


# ── Serve built frontend (production only) ──────────────────────────────────

FRONTEND_DIST = os.path.join(
    os.path.dirname(__file__), "..", "..", "frontend", "dist"
)
if os.path.isdir(FRONTEND_DIST):
    _assets = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
