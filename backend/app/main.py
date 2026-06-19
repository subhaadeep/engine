from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.api.health import router as health_router

# Import all your existing routers here
try:
    from app.api.import_router import router as import_router
    from app.api.filter_router import router as filter_router
    from app.api.backtest_router import router as backtest_router
    from app.api.montecarlo_router import router as montecarlo_router
except ImportError:
    import_router = filter_router = backtest_router = montecarlo_router = None

app = FastAPI(title='GA Engine', version='1.0.0')

# CORS — allow localhost dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mount API routes
app.include_router(health_router, prefix='/api')
if import_router:    app.include_router(import_router,    prefix='/api/import')
if filter_router:    app.include_router(filter_router,    prefix='/api/filter')
if backtest_router:  app.include_router(backtest_router,  prefix='/api/backtest')
if montecarlo_router: app.include_router(montecarlo_router, prefix='/api/montecarlo')

# Serve built frontend (production mode)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist')
if os.path.exists(FRONTEND_DIST):
    app.mount('/assets', StaticFiles(directory=os.path.join(FRONTEND_DIST, 'assets')), name='assets')

    @app.get('/{full_path:path}', include_in_schema=False)
    def serve_frontend(full_path: str):
        index = os.path.join(FRONTEND_DIST, 'index.html')
        return FileResponse(index)
