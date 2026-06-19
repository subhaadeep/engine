"""
Filter Router — /api/filter/...

Endpoints
---------
GET  /api/filter/columns?session_id=N   Column min/max ranges
POST /api/filter/apply                  Filter + rank GA rows
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import FilterConfig, FilterResponse
from app.services import filter_service

router = APIRouter(prefix="/api/filter", tags=["filter"])


@router.get("/columns", summary="Column ranges for a GA session")
async def get_columns(session_id: int, db: AsyncSession = Depends(get_db)):
    try:
        ranges = await filter_service.get_column_ranges(session_id, db)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return {"session_id": session_id, "columns": [r.model_dump() for r in ranges]}


@router.post("/apply", response_model=FilterResponse,
             summary="Filter and rank GA rows")
async def apply_filters(config: FilterConfig, db: AsyncSession = Depends(get_db)):
    try:
        total, rows = await filter_service.apply_filters(config.session_id, config, db)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"Filter error: {exc}")
    return FilterResponse(total_matching=total, results=rows)
