"""
GA Parameter Explorer — OHLCV Data Import Service

OHLCV CSV files are validated then saved to disk (./data/ohlcv_{id}.csv).
Only metadata is stored in the database; the full DataFrame is reloaded
from disk on demand, which avoids storing large binary blobs in SQLite.
"""
from __future__ import annotations

import io
import json
import os
from typing import Optional

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import OHLCVSession

# Columns we require (case-insensitive match)
_REQUIRED_COLUMNS = {"date", "open", "high", "low", "close"}
_CANONICAL_MAP = {
    "date": "Date",
    "open": "Open",
    "high": "High",
    "low": "Low",
    "close": "Close",
    "volume": "Volume",
    "adj close": "Adj Close",
    "adj_close": "Adj Close",
}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to canonical OHLCV names (case-insensitive)."""
    rename = {}
    for col in df.columns:
        lower = col.strip().lower()
        if lower in _CANONICAL_MAP:
            rename[col] = _CANONICAL_MAP[lower]
    if rename:
        df = df.rename(columns=rename)
    return df


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------

async def import_ohlcv_csv(
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> OHLCVSession:
    """
    Validate and persist an OHLCV CSV file.

    The file is saved to ``{DATA_DIR}/ohlcv_{session_id}.csv`` after the
    session record is flushed (so we have the PK available for the path).

    Parameters
    ----------
    file_content : bytes
        Raw bytes of the uploaded CSV.
    filename : str
        Original filename.
    db : AsyncSession
        Active async DB session.

    Returns
    -------
    OHLCVSession with id, row counts, and date range populated.
    """
    # --- Parse ------------------------------------------------------------
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as exc:
        raise ValueError(f"Cannot parse OHLCV CSV '{filename}': {exc}") from exc

    if df.empty:
        raise ValueError("OHLCV CSV file contains no data rows.")

    df = _normalise_columns(df)

    # --- Validate required columns ----------------------------------------
    present_lower = {c.lower() for c in df.columns}
    missing = _REQUIRED_COLUMNS - present_lower
    if missing:
        raise ValueError(
            f"OHLCV CSV missing required columns: {sorted(missing)}. "
            f"Found: {list(df.columns)}"
        )

    # Parse date column
    df["Date"] = pd.to_datetime(df["Date"], infer_datetime_format=True)
    df = df.sort_values("Date").reset_index(drop=True)

    date_from = str(df["Date"].iloc[0].date())
    date_to = str(df["Date"].iloc[-1].date())
    columns_list = df.columns.tolist()

    # --- Create session record (without file_path yet) --------------------
    session = OHLCVSession(
        filename=filename,
        row_count=len(df),
        date_from=date_from,
        date_to=date_to,
        columns=json.dumps(columns_list),
        file_path="",   # filled in below
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    # --- Persist CSV to disk ----------------------------------------------
    file_path = os.path.join(settings.DATA_DIR, f"ohlcv_{session.id}.csv")
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    df.to_csv(file_path, index=False)

    # Update path in DB
    session.file_path = file_path
    db.add(session)
    await db.flush()

    return session


# ---------------------------------------------------------------------------
# Data access
# ---------------------------------------------------------------------------

async def get_current_ohlcv_session(db: AsyncSession) -> Optional[OHLCVSession]:
    """Return the most recently imported OHLCV session, or None."""
    result = await db.execute(
        select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(1)
    )
    return result.scalars().first()


async def get_ohlcv_session(session_id: int, db: AsyncSession) -> Optional[OHLCVSession]:
    """Fetch one OHLCV session by primary key."""
    result = await db.execute(
        select(OHLCVSession).where(OHLCVSession.id == session_id)
    )
    return result.scalars().first()


async def get_ohlcv_data(session_id: int, db: AsyncSession) -> pd.DataFrame:
    """
    Load the OHLCV DataFrame for a session from disk.

    Raises
    ------
    ValueError
        If the session doesn't exist or the file is missing.
    """
    session = await get_ohlcv_session(session_id, db)
    if session is None:
        raise ValueError(f"OHLCV session {session_id} not found.")
    if not session.file_path or not os.path.exists(session.file_path):
        raise ValueError(
            f"OHLCV data file not found on disk for session {session_id}. "
            f"Expected path: {session.file_path}"
        )

    df = pd.read_csv(session.file_path, parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    return df


async def list_ohlcv_sessions(db: AsyncSession) -> list[OHLCVSession]:
    """Return all OHLCV sessions ordered newest first."""
    result = await db.execute(
        select(OHLCVSession).order_by(OHLCVSession.id.desc())
    )
    return list(result.scalars().all())
