"""
GA Parameter Explorer — GA Results Import Service

Handles CSV ingestion for genetic-algorithm result files.  Rows are stored
individually as JSON strings so the schema remains flexible regardless of
how many parameter columns the user's GA produced.
"""
from __future__ import annotations

import io
import json
from typing import Optional

import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import GARow, GASession


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------

async def import_ga_csv(
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> GASession:
    """
    Parse a GA results CSV and persist every row to the database.

    Steps
    -----
    1. Parse CSV with pandas (auto-detects dtypes).
    2. Create a GASession record with column metadata.
    3. Bulk-insert all rows as JSON strings for flexible schema support.

    Parameters
    ----------
    file_content : bytes
        Raw bytes of the uploaded CSV file.
    filename : str
        Original filename (stored for display purposes).
    db : AsyncSession
        Active database session (caller owns transaction).

    Returns
    -------
    GASession with its newly assigned ``id``.
    """
    # --- Parse CSV ---------------------------------------------------------
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as exc:
        raise ValueError(f"Could not parse CSV file '{filename}': {exc}") from exc

    if df.empty:
        raise ValueError("Uploaded CSV file contains no data rows.")

    # Clean up column names
    df.columns = [str(c).strip() for c in df.columns]

    # Try to coerce object columns to numeric where possible
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except (ValueError, TypeError):
            pass  # Keep as string

    columns_list = df.columns.tolist()

    # --- Create session record --------------------------------------------
    session = GASession(
        filename=filename,
        columns=json.dumps(columns_list),
        row_count=len(df),
    )
    db.add(session)
    await db.flush()          # Populate session.id
    await db.refresh(session)

    # --- Bulk-insert rows -------------------------------------------------
    # Convert each row to a JSON string and batch-insert in chunks of 2000
    # to avoid hitting SQLite parameter limits on very large files.
    CHUNK = 2000
    rows_to_insert = []
    for _, row in df.iterrows():
        row_data = {}
        for col in columns_list:
            val = row[col]
            # Convert numpy scalars to Python native types for JSON
            if hasattr(val, "item"):
                val = val.item()
            row_data[col] = val
        rows_to_insert.append(
            GARow(session_id=session.id, data=json.dumps(row_data))
        )
        if len(rows_to_insert) >= CHUNK:
            db.add_all(rows_to_insert)
            await db.flush()
            rows_to_insert = []

    if rows_to_insert:
        db.add_all(rows_to_insert)
        await db.flush()

    return session


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

async def get_current_ga_session(db: AsyncSession) -> Optional[GASession]:
    """Return the most recently created GA session, or None."""
    result = await db.execute(
        select(GASession).order_by(GASession.id.desc()).limit(1)
    )
    return result.scalars().first()


async def get_ga_session(session_id: int, db: AsyncSession) -> Optional[GASession]:
    """Return a specific GA session by id."""
    result = await db.execute(select(GASession).where(GASession.id == session_id))
    return result.scalars().first()


async def get_ga_row(row_id: int, db: AsyncSession) -> Optional[GARow]:
    """Return a single GA row by its primary key."""
    result = await db.execute(select(GARow).where(GARow.id == row_id))
    return result.scalars().first()


async def get_all_ga_rows(session_id: int, db: AsyncSession) -> list[GARow]:
    """Return all rows belonging to a GA session (ordered by id)."""
    result = await db.execute(
        select(GARow).where(GARow.session_id == session_id).order_by(GARow.id)
    )
    return list(result.scalars().all())


async def count_ga_rows(session_id: int, db: AsyncSession) -> int:
    """Count rows in a session without loading them all."""
    result = await db.execute(
        select(func.count()).where(GARow.session_id == session_id)
    )
    return result.scalar_one()
