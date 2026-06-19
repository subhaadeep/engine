from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api.health import router as health_router
from app.routers.import_router import router as import_router
from app.routers.filter_router import router as filter_router
from app.routers.backtest_router import router as backtest_router
from app.routers.montecarlo_router import router as montecarlo_router

app = FastAPI(title="GA Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health
app.include_router(health_router, prefix="/api")

# All domain routers — each router file already carries its full prefix
# (e.g. prefix="/api/import") so we include them WITHOUT an extra prefix here.
app.include_router(import_router)
app.include_router(filter_router)
app.include_router(backtest_router)
app.include_router(montecarlo_router)

# Serve built frontend (production)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
