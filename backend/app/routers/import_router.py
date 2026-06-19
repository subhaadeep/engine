from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.models.models import GASession, OHLCVSession
from app.services.import_service import process_ga_csv, process_ohlcv_csv
from app.schemas.schemas import ImportStatusResponse, SessionListItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])

STALE_DAYS = 7

async def _purge_old_sessions(db: AsyncSession):
    """Delete GA and OHLCV sessions older than STALE_DAYS."""
    cutoff = datetime.utcnow() - timedelta(days=STALE_DAYS)
    await db.execute(delete(GASession).where(GASession.created_at < cutoff))
    await db.execute(delete(OHLCVSession).where(OHLCVSession.created_at < cutoff))
    await db.commit()


@router.get("/status", response_model=ImportStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db)):
    await _purge_old_sessions(db)
    ga = (await db.execute(select(GASession).order_by(GASession.created_at.desc()).limit(1))).scalar_one_or_none()
    ohlcv = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.created_at.desc()).limit(1))).scalar_one_or_none()
    return ImportStatusResponse(
        ga_session_id=ga.id if ga else None,
        ga_filename=ga.filename if ga else None,
        ohlcv_session_id=ohlcv.id if ohlcv else None,
        ohlcv_filename=ohlcv.filename if ohlcv else None,
        ready=bool(ga and ohlcv),
    )


@router.get("/sessions/ga", response_model=list[SessionListItem])
async def list_ga_sessions(db: AsyncSession = Depends(get_db)):
    await _purge_old_sessions(db)
    rows = (await db.execute(select(GASession).order_by(GASession.created_at.desc()).limit(20))).scalars().all()
    return [
        SessionListItem(
            id=r.id,
            filename=r.filename,
            row_count=r.row_count,
            created_at=r.created_at.isoformat(),
            expires_at=(r.created_at + timedelta(days=STALE_DAYS)).isoformat(),
        )
        for r in rows
    ]


@router.get("/sessions/ohlcv", response_model=list[SessionListItem])
async def list_ohlcv_sessions(db: AsyncSession = Depends(get_db)):
    await _purge_old_sessions(db)
    rows = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.created_at.desc()).limit(20))).scalars().all()
    return [
        SessionListItem(
            id=r.id,
            filename=r.filename,
            row_count=r.row_count,
            created_at=r.created_at.isoformat(),
            expires_at=(r.created_at + timedelta(days=STALE_DAYS)).isoformat(),
        )
        for r in rows
    ]


@router.post("/select/ga")
async def select_ga_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(GASession, session_id)
    if not row:
        raise HTTPException(404, "GA session not found or expired")
    return {"session_id": row.id, "filename": row.filename, "row_count": row.row_count, "columns": row.columns}


@router.post("/select/ohlcv")
async def select_ohlcv_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(OHLCVSession, session_id)
    if not row:
        raise HTTPException(404, "OHLCV session not found or expired")
    return {"session_id": row.id, "filename": row.filename, "row_count": row.row_count}


@router.post("/ga")
async def upload_ga(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(400, "Only CSV/TXT files accepted")
    content = await file.read()
    result = await process_ga_csv(content, file.filename, db)
    return result


@router.post("/ohlcv")
async def upload_ohlcv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(400, "Only CSV/TXT files accepted")
    content = await file.read()
    result = await process_ohlcv_csv(content, file.filename, db)
    return result
