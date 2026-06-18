"""
GA Parameter Explorer — Import Router
Handles GA results CSV and OHLCV price data uploads.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import ga_import_service, ohlcv_service

router = APIRouter(prefix="/api/import", tags=["import"])


# ---------------------------------------------------------------------------
# GA Results
# ---------------------------------------------------------------------------

@router.post("/ga-results", summary="Upload GA results CSV")
async def upload_ga_results(
    file: UploadFile = File(..., description="GA results CSV file"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a CSV file produced by the genetic-algorithm optimiser.

    Returns session metadata and the detected column list.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv files are accepted for GA results.",
        )
    try:
        content = await file.read()
        session = await ga_import_service.import_ga_csv(content, file.filename, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {exc}",
        )

    return {
        "session_id": session.id,
        "filename": session.filename,
        "columns": json.loads(session.columns),
        "row_count": session.row_count,
    }


# ---------------------------------------------------------------------------
# OHLCV Price Data
# ---------------------------------------------------------------------------

@router.post("/ohlcv", summary="Upload OHLCV price data CSV")
async def upload_ohlcv(
    file: UploadFile = File(..., description="OHLCV price data CSV (Date, Open, High, Low, Close required)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an OHLCV price data CSV.

    Required columns: Date, Open, High, Low, Close (case-insensitive).
    Volume is optional.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    ext = file.filename.lower().split(".")[-1]
    if ext not in ("csv",):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted for OHLCV data.")

    try:
        content = await file.read()
        session = await ohlcv_service.import_ohlcv_csv(content, file.filename, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OHLCV import failed: {exc}",
        )

    return {
        "session_id": session.id,
        "filename": session.filename,
        "row_count": session.row_count,
        "date_from": session.date_from,
        "date_to": session.date_to,
        "columns": json.loads(session.columns),
    }


# ---------------------------------------------------------------------------
# Status / Health Check
# ---------------------------------------------------------------------------

@router.get("/status", summary="Check import readiness")
async def get_status(db: AsyncSession = Depends(get_db)):
    """
    Returns the most recently imported GA session and OHLCV session.
    ``ready`` is True only when both are present.
    """
    try:
        ga = await ga_import_service.get_current_ga_session(db)
        ohlcv = await ohlcv_service.get_current_ohlcv_session(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "ga_session_id": ga.id if ga else None,
        "ga_filename": ga.filename if ga else None,
        "ga_row_count": ga.row_count if ga else 0,
        "ga_columns": json.loads(ga.columns) if ga else [],
        "ohlcv_session_id": ohlcv.id if ohlcv else None,
        "ohlcv_filename": ohlcv.filename if ohlcv else None,
        "ohlcv_row_count": ohlcv.row_count if ohlcv else 0,
        "ohlcv_date_from": ohlcv.date_from if ohlcv else None,
        "ohlcv_date_to": ohlcv.date_to if ohlcv else None,
        "ready": ga is not None and ohlcv is not None,
    }


@router.get("/ga-sessions", summary="List all GA sessions")
async def list_ga_sessions(db: AsyncSession = Depends(get_db)):
    """Return a summary list of all imported GA sessions."""
    from sqlalchemy import select
    from app.models.models import GASession
    result = await db.execute(select(GASession).order_by(GASession.id.desc()))
    sessions = result.scalars().all()
    return {
        "sessions": [
            {
                "id": s.id,
                "filename": s.filename,
                "row_count": s.row_count,
                "columns": json.loads(s.columns),
                "created_at": str(s.created_at),
            }
            for s in sessions
        ]
    }


@router.get("/ohlcv-sessions", summary="List all OHLCV sessions")
async def list_ohlcv_sessions(db: AsyncSession = Depends(get_db)):
    """Return a summary list of all imported OHLCV sessions."""
    sessions = await ohlcv_service.list_ohlcv_sessions(db)
    return {
        "sessions": [
            {
                "id": s.id,
                "filename": s.filename,
                "row_count": s.row_count,
                "date_from": s.date_from,
                "date_to": s.date_to,
                "created_at": str(s.created_at),
            }
            for s in sessions
        ]
    }
