"""
OHLCV / OHLC Data Import Service

Accepts CSV files with:
  - OHLCV : timestamp, open, high, low, close, volume
  - OHLC  : timestamp, open, high, low, close  (volume optional)

Timestamp column auto-detection:
  - Unix milliseconds  (e.g. 1577916000000)
  - Unix seconds       (e.g. 1577916000)
  - Datetime string    (e.g. "2020-01-02 00:00:00", "2020-01-02T00:00:00")
  - Date only          (e.g. "2020-01-02")

Files are saved to disk; only metadata is stored in the database.
Data is NEVER auto-deleted — it persists until manually removed.
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

# Required price columns (case-insensitive)
_REQUIRED_PRICE = {"open", "high", "low", "close"}

# Possible timestamp column names (case-insensitive)
_TIMESTAMP_NAMES = {
    "timestamp", "time", "date", "datetime", "open time",
    "open_time", "date_time", "ts", "t",
}

# Canonical rename map
_CANON = {
    "open":      "Open",
    "high":      "High",
    "low":       "Low",
    "close":     "Close",
    "volume":    "Volume",
    "adj close": "Adj_Close",
    "adj_close": "Adj_Close",
}


def _detect_timestamp_col(df: pd.DataFrame) -> Optional[str]:
    """Return the first column whose lower-stripped name is a known timestamp alias."""
    for col in df.columns:
        if col.strip().lower() in _TIMESTAMP_NAMES:
            return col
    # Fallback: first column if it looks like a date or large integer
    first = df.columns[0]
    sample = df[first].dropna().iloc[0] if not df[first].dropna().empty else None
    if sample is not None:
        try:
            v = float(sample)
            # Unix ms range: 1_000_000_000_000 – 9_999_999_999_999
            if 1e12 <= v <= 9.9e12:
                return first
            # Unix seconds range: 1_000_000_000 – 9_999_999_999
            if 1e9 <= v <= 9.9e9:
                return first
        except (TypeError, ValueError):
            pass
        # Try parsing as date string
        try:
            pd.to_datetime(str(sample))
            return first
        except Exception:
            pass
    return None


def _parse_timestamp_series(series: pd.Series) -> pd.Series:
    """
    Convert a timestamp series to datetime64[ns].
    Handles unix-ms, unix-s, and any string format pandas can parse.
    """
    sample = series.dropna().iloc[0] if not series.dropna().empty else None
    if sample is None:
        return pd.to_datetime(series, errors="coerce")

    try:
        v = float(sample)
        if 1e12 <= v <= 9.9e12:          # unix milliseconds
            return pd.to_datetime(series, unit="ms", errors="coerce")
        if 1e9 <= v <= 9.9e9:            # unix seconds
            return pd.to_datetime(series, unit="s", errors="coerce")
    except (TypeError, ValueError):
        pass

    # String / mixed — let pandas infer
    return pd.to_datetime(series, infer_datetime_format=True, errors="coerce")


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to canonical names."""
    rename = {}
    for col in df.columns:
        k = col.strip().lower()
        if k in _CANON:
            rename[col] = _CANON[k]
    if rename:
        df = df.rename(columns=rename)
    return df


# ───────────────────────────────────────────────────────────────────────────────
async def import_ohlcv_csv(
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> OHLCVSession:
    """
    Validate, normalise, and persist an OHLCV/OHLC CSV.
    Saves the normalised file to disk; stores only metadata in DB.
    """
    # --- Parse --------------------------------------------------------------
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as exc:
        raise ValueError(f"Cannot parse CSV '{filename}': {exc}") from exc

    if df.empty:
        raise ValueError("CSV contains no data rows.")

    df.columns = [str(c).strip() for c in df.columns]

    # --- Detect & parse timestamp ------------------------------------------
    ts_col = _detect_timestamp_col(df)
    if ts_col is None:
        raise ValueError(
            "No timestamp column found.  Expected one of: "
            + str(sorted(_TIMESTAMP_NAMES))
            + f"\nFound columns: {list(df.columns)}"
        )

    df["Date"] = _parse_timestamp_series(df[ts_col])
    if ts_col != "Date":
        df = df.drop(columns=[ts_col])

    bad = df["Date"].isna().sum()
    if bad:
        raise ValueError(f"{bad} rows have unparseable timestamps — check your date format.")

    # --- Validate OHLC columns ---------------------------------------------
    df = _normalise(df)
    present_lower = {c.lower() for c in df.columns}
    missing = _REQUIRED_PRICE - present_lower
    if missing:
        raise ValueError(
            f"Missing required price columns: {sorted(missing)}.  Found: {list(df.columns)}"
        )

    # Sort by date
    df = df.sort_values("Date").reset_index(drop=True)

    date_from = str(df["Date"].iloc[0].date())
    date_to   = str(df["Date"].iloc[-1].date())
    has_volume = "Volume" in df.columns
    columns_list = df.columns.tolist()

    # --- Create session record ---------------------------------------------
    session = OHLCVSession(
        filename  = filename,
        row_count = len(df),
        date_from = date_from,
        date_to   = date_to,
        columns   = json.dumps(columns_list),
        file_path = "",  # filled after flush
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    # --- Save to disk -------------------------------------------------------
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    file_path = os.path.join(settings.DATA_DIR, f"ohlcv_{session.id}.csv")
    df.to_csv(file_path, index=False)

    session.file_path = file_path
    db.add(session)
    await db.flush()

    return session


# ───────────────────────────────────────────────────────────────────────────────
# Data access
# ───────────────────────────────────────────────────────────────────────────────

async def get_ohlcv_session(session_id: int, db: AsyncSession) -> Optional[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).where(OHLCVSession.id == session_id))
    return result.scalars().first()


async def get_ohlcv_data(session_id: int, db: AsyncSession) -> pd.DataFrame:
    session = await get_ohlcv_session(session_id, db)
    if session is None:
        raise ValueError(f"OHLCV session {session_id} not found.")
    if not session.file_path or not os.path.exists(session.file_path):
        raise ValueError(f"Data file missing for session {session_id}: {session.file_path}")
    df = pd.read_csv(session.file_path, parse_dates=["Date"])
    return df.sort_values("Date").reset_index(drop=True)


async def get_current_ohlcv_session(db: AsyncSession) -> Optional[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(1))
    return result.scalars().first()


async def list_ohlcv_sessions(db: AsyncSession) -> list[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()))
    return list(result.scalars().all())
