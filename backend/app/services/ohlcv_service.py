"""
OHLCV / OHLC Import Service

Accepts CSV with OHLCV or OHLC (volume optional).
Auto-detects timestamp format:
  unix-ms  (1577916000000)
  unix-s   (1577916000)
  datetime ("2020-01-02 00:00:00")
  date     ("2020-01-02")

Data is NEVER auto-deleted.
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

_REQUIRED_PRICE  = {"open", "high", "low", "close"}
_TIMESTAMP_NAMES = {
    "timestamp", "time", "date", "datetime", "open time",
    "open_time", "date_time", "ts", "t",
}
_CANON = {
    "open":      "Open",
    "high":      "High",
    "low":       "Low",
    "close":     "Close",
    "volume":    "Volume",
    "adj close": "Adj_Close",
    "adj_close": "Adj_Close",
}


def _detect_ts_col(df: pd.DataFrame) -> Optional[str]:
    for col in df.columns:
        if col.strip().lower() in _TIMESTAMP_NAMES:
            return col
    # Fallback: first column — check if it looks like a timestamp
    first = df.columns[0]
    sample = df[first].dropna().iloc[0] if not df[first].dropna().empty else None
    if sample is not None:
        try:
            v = float(sample)
            if 1e9 <= v <= 9.9e12:   # unix-s or unix-ms range
                return first
        except (TypeError, ValueError):
            pass
        try:
            pd.to_datetime(str(sample))
            return first
        except Exception:
            pass
    return None


def _parse_ts(series: pd.Series) -> pd.Series:
    sample = series.dropna().iloc[0] if not series.dropna().empty else None
    if sample is not None:
        try:
            v = float(sample)
            if 1e12 <= v <= 9.9e12:
                return pd.to_datetime(series, unit="ms", errors="coerce")
            if 1e9 <= v <= 9.9e9:
                return pd.to_datetime(series, unit="s", errors="coerce")
        except (TypeError, ValueError):
            pass
    return pd.to_datetime(series, infer_datetime_format=True, errors="coerce")


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    rename = {col: _CANON[col.strip().lower()]
              for col in df.columns
              if col.strip().lower() in _CANON}
    return df.rename(columns=rename) if rename else df


async def import_ohlcv_csv(
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> OHLCVSession:
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as exc:
        raise ValueError(f"Cannot parse CSV '{filename}': {exc}") from exc

    if df.empty:
        raise ValueError("CSV contains no data rows.")

    df.columns = [str(c).strip() for c in df.columns]

    ts_col = _detect_ts_col(df)
    if ts_col is None:
        raise ValueError(
            "No timestamp column detected. Expected one of: "
            + str(sorted(_TIMESTAMP_NAMES))
            + f"  Found: {list(df.columns)}"
        )

    df["Date"] = _parse_ts(df[ts_col])
    if ts_col != "Date":
        df = df.drop(columns=[ts_col])

    bad = df["Date"].isna().sum()
    if bad:
        raise ValueError(f"{bad} rows have unparseable timestamps.")

    df = _normalise(df)
    present_lower = {c.lower() for c in df.columns}
    missing = _REQUIRED_PRICE - present_lower
    if missing:
        raise ValueError(
            f"Missing required price columns: {sorted(missing)}.  "
            f"Found: {list(df.columns)}"
        )

    df = df.sort_values("Date").reset_index(drop=True)
    date_from    = str(df["Date"].iloc[0].date())
    date_to      = str(df["Date"].iloc[-1].date())
    columns_list = df.columns.tolist()

    session = OHLCVSession(
        filename  = filename,
        row_count = len(df),
        date_from = date_from,
        date_to   = date_to,
        columns   = json.dumps(columns_list),
        file_path = "",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    os.makedirs(settings.DATA_DIR, exist_ok=True)
    file_path = os.path.join(settings.DATA_DIR, f"ohlcv_{session.id}.csv")
    df.to_csv(file_path, index=False)
    session.file_path = file_path
    db.add(session)
    await db.flush()
    return session


async def get_ohlcv_session(session_id: int, db: AsyncSession) -> Optional[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).where(OHLCVSession.id == session_id))
    return result.scalars().first()


async def get_ohlcv_data(session_id: int, db: AsyncSession) -> pd.DataFrame:
    session = await get_ohlcv_session(session_id, db)
    if session is None:
        raise ValueError(f"OHLCV session {session_id} not found.")
    if not session.file_path or not os.path.exists(session.file_path):
        raise ValueError(f"Data file missing: {session.file_path}")
    df = pd.read_csv(session.file_path, parse_dates=["Date"])
    return df.sort_values("Date").reset_index(drop=True)


async def get_current_ohlcv_session(db: AsyncSession) -> Optional[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()).limit(1))
    return result.scalars().first()


async def list_ohlcv_sessions(db: AsyncSession) -> list[OHLCVSession]:
    result = await db.execute(select(OHLCVSession).order_by(OHLCVSession.id.desc()))
    return list(result.scalars().all())
