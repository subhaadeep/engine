"""
GA Parameter Explorer — FastAPI Application
============================================

Startup sequence
----------------
1. init_db()       → create all SQLite tables if they don't exist
2. warmup_numba()  → trigger JIT compilation of Monte Carlo kernels

All API endpoints are served on http://127.0.0.1:8765 by default.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import init_db
from app.routers import (
    backtest_router,
    filter_router,
    import_router,
    montecarlo_router,
)
from app.utils.numba_kernels import warmup_numba

logger = logging.getLogger("ga_explorer")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    logger.info("Initialising database …")
    await init_db()
    logger.info("Database ready.")

    logger.info("Warming up Numba JIT kernels …")
    try:
        warmup_numba()
        logger.info("Numba kernels compiled and cached.")
    except Exception as exc:  # noqa: BLE001
        # Not fatal — fall back to pure-NumPy path at runtime
        logger.warning("Numba warmup failed (%s). Will use NumPy fallback.", exc)

    logger.info("GA Parameter Explorer backend is ready.")
    yield
    logger.info("Shutting down …")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GA Parameter Explorer API",
    description=(
        "Backend for the GA Parameter Explorer trading platform.\n\n"
        "Provides import, filter, backtesting, and Monte Carlo simulation "
        "endpoints for exploring genetic-algorithm optimisation results."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS  — allow the Tauri/Electron front-end running on localhost
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler — turns unhandled exceptions into JSON 500s
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(import_router.router)
app.include_router(filter_router.router)
app.include_router(backtest_router.router)
app.include_router(montecarlo_router.router)


# ---------------------------------------------------------------------------
# Root / Health
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"], summary="API root")
async def root():
    return {
        "service": "GA Parameter Explorer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["health"], summary="Health check")
async def health():
    """Simple liveness probe — returns 200 OK when the server is up."""
    return {"status": "ok"}
