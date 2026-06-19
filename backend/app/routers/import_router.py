"""
Import Router

- GA Results CSV : POST /import/ga-results
- OHLCV/OHLC CSV: POST /import/ohlcv
- Session listing: GET  /import/sessions/ga | /import/sessions/ohlcv
- Session select : POST /import/select/ga   | /import/select/ohlcv
- Status         : GET  /import/status

Data is NEVER deleted automatically — files live on disk until the user
deletes them or runs the cleanup script manually.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.database import get_db
from app.models.models import GASession, OHLCVSession
from app.services.ga_import_service import import_ga_csv
from app.services.ohlcv_service import import_ohlcv_csv
from app.schemas.schemas import ImportStatusResponse, SessionListItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])


# ───────────────────────────────────────────────────────────────────────────────
# Status
# ───────────────────────────────────────────────────────────────────────────────

@router.get("/status", response_model=ImportStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db)):
    ga    = (await db.execute(select(GASession).order_by(GASession.id.desc()).limit(1))).scalar_one_or_none()
    ohlcv = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(1))).scalar_one_or_none()
    return ImportStatusResponse(
        ga_session_id    = str(ga.id)    if ga    else None,
        ga_filename      = ga.filename   if ga    else None,
        ohlcv_session_id = str(ohlcv.id) if ohlcv else None,
        ohlcv_filename   = ohlcv.filename if ohlcv else None,
        ready            = bool(ga and ohlcv),
    )


# ───────────────────────────────────────────────────────────────────────────────
# Session listing (no auto-delete)
# ───────────────────────────────────────────────────────────────────────────────

@router.get("/sessions/ga", response_model=list[SessionListItem])
async def list_ga_sessions(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(GASession).order_by(GASession.id.desc()).limit(50))).scalars().all()
    return [
        SessionListItem(
            id         = str(r.id),
            filename   = r.filename,
            row_count  = r.row_count,
            created_at = r.created_at.isoformat() if r.created_at else "",
            expires_at = None,  # never expires
        )
        for r in rows
    ]


@router.get("/sessions/ohlcv", response_model=list[SessionListItem])
async def list_ohlcv_sessions(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(50))).scalars().all()
    return [
        SessionListItem(
            id         = str(r.id),
            filename   = r.filename,
            row_count  = r.row_count,
            created_at = r.created_at.isoformat() if r.created_at else "",
            expires_at = None,  # never expires
        )
        for r in rows
    ]


# ───────────────────────────────────────────────────────────────────────────────
# Select previous session
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/select/ga")
async def select_ga_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(GASession, int(session_id))
    if not row:
        raise HTTPException(404, "GA session not found")
    import json
    cols = json.loads(row.columns) if isinstance(row.columns, str) else row.columns
    return {"session_id": str(row.id), "filename": row.filename,
            "row_count": row.row_count, "columns": cols}


@router.post("/select/ohlcv")
async def select_ohlcv_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(OHLCVSession, int(session_id))
    if not row:
        raise HTTPException(404, "OHLCV session not found")
    return {"session_id": str(row.id), "filename": row.filename,
            "row_count": row.row_count, "date_from": row.date_from, "date_to": row.date_to}


# ───────────────────────────────────────────────────────────────────────────────
# Upload endpoints
# ───────────────────────────────────────────────────────────────────────────────

@router.post("/ga-results")
async def upload_ga(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload GA optimiser result CSV from local disk.
    Stores rows in DB; metadata only in session record.
    """
    if not (file.filename or "").lower().endswith((".csv", ".txt")):
        raise HTTPException(400, "Only .csv or .txt files are accepted")
    try:
        content = await file.read()
        session = await import_ga_csv(content, file.filename, db)
        await db.commit()
        await db.refresh(session)
        import json
        cols = json.loads(session.columns) if isinstance(session.columns, str) else session.columns
        return {
            "session_id": str(session.id),
            "filename":   session.filename,
            "row_count":  session.row_count,
            "columns":    cols,
        }
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.exception("GA upload failed")
        raise HTTPException(500, f"GA upload failed: {e}")


@router.post("/ohlcv")
async def upload_ohlcv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload OHLCV or OHLC (no volume) historical data CSV from local disk.

    Accepted timestamp formats:
      • Unix milliseconds : 1577916000000
      • Datetime string   : 2020-01-02 00:00:00  or  2020-01-02T00:00:00
      • Date only         : 2020-01-02

    Volume column is optional — file is accepted without it.
    """
    if not (file.filename or "").lower().endswith((".csv", ".txt")):
        raise HTTPException(400, "Only .csv or .txt files are accepted")
    try:
        content = await file.read()
        session = await import_ohlcv_csv(content, file.filename, db)
        await db.commit()
        await db.refresh(session)
        return {
            "session_id": str(session.id),
            "filename":   session.filename,
            "row_count":  session.row_count,
            "date_from":  session.date_from,
            "date_to":    session.date_to,
        }
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.exception("OHLCV upload failed")
        raise HTTPException(500, f"OHLCV upload failed: {e}")
