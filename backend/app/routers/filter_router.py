"""
GA Parameter Explorer — Filter Router
Column-range inspection and parameter-space filtering endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import FilterConfig, FilterResponse, FilterResultRow
from app.services import filter_service

router = APIRouter(prefix="/api/filter", tags=["filter"])


# ---------------------------------------------------------------------------
# Column metadata
# ---------------------------------------------------------------------------

@router.get("/columns", summary="Get column min/max ranges for a GA session")
async def get_columns(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Return per-column min/max statistics for the specified GA session.

    Non-numeric columns are returned with dtype='string' and null min/max.

    Query Parameters
    ----------------
    session_id : int
        ID of the GA session to inspect.
    """
    try:
        ranges = await filter_service.get_column_ranges(session_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "session_id": session_id,
        "columns": [r.model_dump() for r in ranges],
    }


# ---------------------------------------------------------------------------
# Apply filters
# ---------------------------------------------------------------------------

@router.post("/apply", summary="Filter and rank GA rows", response_model=FilterResponse)
async def apply_filters(
    config: FilterConfig,
    db: AsyncSession = Depends(get_db),
):
    """
    Apply column-range filters to a GA session's rows and return the top-N
    ranked results.

    Request Body
    ------------
    - **session_id**: Which GA session to filter.
    - **columns**: Dict mapping column name → FilterRule {enabled, min_val, max_val}.
    - **rank_by**: Column name to sort by (empty = preserve original order).
    - **rank_order**: "desc" (default) or "asc".
    - **top_n**: Maximum number of results to return (1–10000, default 50).

    Response
    --------
    - **total_matching**: Count of rows that pass the filters.
    - **results**: Top-N rows with rank, DB id, and full parameter dict.
    """
    try:
        total, rows = await filter_service.apply_filters(config.session_id, config, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Filter error: {exc}")

    return FilterResponse(total_matching=total, results=rows)
