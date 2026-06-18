"""
GA Parameter Explorer — Filter Service

Loads all GA rows for a session into a pandas DataFrame in memory, then
applies column-range filters and sorts/paginates the results efficiently.
"""
from __future__ import annotations

import json
from typing import Optional

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import GARow, GASession
from app.schemas.schemas import ColumnRange, FilterConfig, FilterResultRow
from app.services import ga_import_service


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _load_session_dataframe(
    session_id: int, db: AsyncSession
) -> tuple[GASession, pd.DataFrame, list[int]]:
    """
    Load all rows for a GA session into a DataFrame.

    Returns
    -------
    (session, df, row_ids)
        ``row_ids[i]`` is the DB primary key for ``df.iloc[i]``.
    """
    session = await ga_import_service.get_ga_session(session_id, db)
    if session is None:
        raise ValueError(f"GA session {session_id} not found.")

    rows: list[GARow] = await ga_import_service.get_all_ga_rows(session_id, db)
    if not rows:
        return session, pd.DataFrame(), []

    records = []
    row_ids = []
    for r in rows:
        parsed = json.loads(r.data)
        records.append(parsed)
        row_ids.append(r.id)

    df = pd.DataFrame(records)
    # Coerce numeric columns
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except (ValueError, TypeError):
            pass

    return session, df, row_ids


# ---------------------------------------------------------------------------
# Column ranges
# ---------------------------------------------------------------------------

async def get_column_ranges(
    session_id: int, db: AsyncSession
) -> list[ColumnRange]:
    """
    Compute min/max for every column in the given GA session.

    Returns
    -------
    list[ColumnRange]
        One entry per column.  Non-numeric columns have min_val=None / max_val=None.
    """
    _, df, _ = await _load_session_dataframe(session_id, db)
    if df.empty:
        return []

    result: list[ColumnRange] = []
    for col in df.columns:
        series = df[col]
        if pd.api.types.is_numeric_dtype(series):
            result.append(
                ColumnRange(
                    name=col,
                    min_val=float(series.min()),
                    max_val=float(series.max()),
                    dtype="numeric",
                )
            )
        else:
            result.append(
                ColumnRange(
                    name=col,
                    min_val=None,
                    max_val=None,
                    dtype="string",
                )
            )
    return result


# ---------------------------------------------------------------------------
# Apply filters
# ---------------------------------------------------------------------------

async def apply_filters(
    session_id: int,
    filter_config: FilterConfig,
    db: AsyncSession,
) -> tuple[int, list[FilterResultRow]]:
    """
    Filter, sort, and paginate GA rows.

    Parameters
    ----------
    session_id : int
    filter_config : FilterConfig
        Contains per-column rules, sort column/direction, and top_n limit.
    db : AsyncSession

    Returns
    -------
    (total_matching, top_n_rows)
        total_matching — how many rows pass the filter (before top_n).
        top_n_rows     — ranked result list up to filter_config.top_n.
    """
    _, df, row_ids = await _load_session_dataframe(session_id, db)

    if df.empty:
        return 0, []

    # Attach DB IDs as a column so they survive filtering
    df["_db_id"] = row_ids

    # --- Apply column filters ---------------------------------------------
    mask = pd.Series([True] * len(df), index=df.index)
    for col_name, rule in filter_config.columns.items():
        if not rule.enabled:
            continue
        if col_name not in df.columns:
            continue
        series = df[col_name]
        if not pd.api.types.is_numeric_dtype(series):
            continue
        if rule.min_val is not None:
            mask &= series >= rule.min_val
        if rule.max_val is not None:
            mask &= series <= rule.max_val

    filtered_df = df[mask].copy()
    total_matching = len(filtered_df)

    if total_matching == 0:
        return 0, []

    # --- Sort -------------------------------------------------------------
    rank_by = filter_config.rank_by
    ascending = filter_config.rank_order == "asc"

    if rank_by and rank_by in filtered_df.columns:
        filtered_df = filtered_df.sort_values(by=rank_by, ascending=ascending)
    else:
        # Default: preserve original order
        filtered_df = filtered_df.reset_index(drop=True)

    # --- Top-N slice + rank assignment -----------------------------------
    top_df = filtered_df.head(filter_config.top_n).reset_index(drop=True)

    result_rows: list[FilterResultRow] = []
    non_meta_cols = [c for c in top_df.columns if c != "_db_id"]
    for rank_idx, (_, row) in enumerate(top_df.iterrows(), start=1):
        row_data: dict = {}
        for col in non_meta_cols:
            val = row[col]
            if hasattr(val, "item"):
                val = val.item()
            row_data[col] = val
        result_rows.append(
            FilterResultRow(
                id=int(row["_db_id"]),
                rank=rank_idx,
                data=row_data,
            )
        )

    return total_matching, result_rows
