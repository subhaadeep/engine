"""
Import Router — /api/import/...

Endpoints
---------
POST /api/import/ga-results       Upload GA CSV from local disk
POST /api/import/ohlcv            Upload OHLCV or OHLC CSV from local disk
GET  /api/import/status           Current session IDs + ready flag
GET  /api/import/sessions/ga      List all GA sessions (no expiry)
GET  /api/import/sessions/ohlcv   List all OHLCV sessions (no expiry)
POST /api/import/select/ga        Activate a previous GA session
POST /api/import/select/ohlcv     Activate a previous OHLCV session

Data is NEVER auto-deleted.  Files stay on disk until manually removed.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import GASession, OHLCVSession
from app.services.ga_import_service import import_ga_csv
from app.services.ohlcv_service import import_ohlcv_csv
from app.schemas.schemas import ImportStatusResponse, SessionListItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/import", tags=["import"])


# ── helpers ────────────────────────────────────────────────────────────────

def _cols(session) -> list:
    c = session.columns
    return json.loads(c) if isinstance(c, str) else (c or [])


# ── status ─────────────────────────────────────────────────────────────────

@router.get("/status", response_model=ImportStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db)):
    ga    = (await db.execute(select(GASession).order_by(GASession.id.desc()).limit(1))).scalar_one_or_none()
    ohlcv = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(1))).scalar_one_or_none()
    return ImportStatusResponse(
        ga_session_id    = str(ga.id)     if ga    else None,
        ga_filename      = ga.filename    if ga    else None,
        ohlcv_session_id = str(ohlcv.id)  if ohlcv else None,
        ohlcv_filename   = ohlcv.filename if ohlcv else None,
        ready            = bool(ga and ohlcv),
    )


# ── session listing ────────────────────────────────────────────────────────

@router.get("/sessions/ga", response_model=list[SessionListItem])
async def list_ga_sessions(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(GASession).order_by(GASession.id.desc()).limit(100))).scalars().all()
    return [
        SessionListItem(
            id         = str(r.id),
            filename   = r.filename,
            row_count  = r.row_count,
            created_at = r.created_at.isoformat() if r.created_at else "",
            expires_at = None,
        )
        for r in rows
    ]


@router.get("/sessions/ohlcv", response_model=list[SessionListItem])
async def list_ohlcv_sessions(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(100))).scalars().all()
    return [
        SessionListItem(
            id         = str(r.id),
            filename   = r.filename,
            row_count  = r.row_count,
            created_at = r.created_at.isoformat() if r.created_at else "",
            expires_at = None,
        )
        for r in rows
    ]


# ── select previous session ────────────────────────────────────────────────

@router.post("/select/ga")
async def select_ga_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(GASession, int(session_id))
    if not row:
        raise HTTPException(404, "GA session not found")
    return {"session_id": str(row.id), "filename": row.filename,
            "row_count": row.row_count, "columns": _cols(row)}


@router.post("/select/ohlcv")
async def select_ohlcv_session(session_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(OHLCVSession, int(session_id))
    if not row:
        raise HTTPException(404, "OHLCV session not found")
    return {"session_id": str(row.id), "filename": row.filename,
            "row_count": row.row_count, "date_from": row.date_from, "date_to": row.date_to}


# ── upload: GA results CSV ─────────────────────────────────────────────────

@router.post("/ga-results")
async def upload_ga(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload GA optimiser result CSV from local disk.
    Rows are stored in the database; only metadata in the session record.
    File is NOT deleted after any time period.
    """
    if not (file.filename or "").lower().endswith((".csv", ".txt")):
        raise HTTPException(400, "Only .csv or .txt files are accepted")
    try:
        content = await file.read()
        session = await import_ga_csv(content, file.filename, db)
        await db.commit()
        await db.refresh(session)
        return {
            "session_id": str(session.id),
            "filename":   session.filename,
            "row_count":  session.row_count,
            "columns":    _cols(session),
        }
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except Exception as exc:
        logger.exception("GA upload error")
        raise HTTPException(500, f"Upload failed: {exc}")


# ── upload: OHLCV / OHLC CSV ───────────────────────────────────────────────

@router.post("/ohlcv")
async def upload_ohlcv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload OHLCV or OHLC historical price CSV from local disk.

    Accepted timestamp formats (auto-detected):
      • Unix milliseconds : 1577916000000
      • Unix seconds      : 1577916000
      • Datetime string   : 2020-01-02 00:00:00 / 2020-01-02T00:00:00
      • Date only         : 2020-01-02

    Volume column is OPTIONAL — OHLC files without it are fully supported.
    File is NOT deleted after any time period.
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
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except Exception as exc:
        logger.exception("OHLCV upload error")
        raise HTTPException(500, f"Upload failed: {exc}")
