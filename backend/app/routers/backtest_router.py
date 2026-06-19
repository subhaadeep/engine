"""
Backtest Router — /api/backtest/...

Endpoints
---------
POST /api/backtest/upload-strategy           Upload .py strategy file
GET  /api/backtest/strategies                List all strategies
GET  /api/backtest/strategies/{id}/source    Get strategy source code
POST /api/backtest/run                       Run a backtest
GET  /api/backtest/trades/{backtest_id}      Paginated trades
GET  /api/backtest/list                      Recent backtests
GET  /api/backtest/{backtest_id}             Single backtest details
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import (
    BacktestListItem,
    BacktestRunRequest,
    BacktestRunResponse,
    StrategyListItem,
    StrategyUploadResponse,
    TradesPageResponse,
    TradeResponse,
)
from app.services import backtest_service

# NOTE: prefix has NO leading /api/ here — main.py includes this router
# without any additional prefix, and the router itself owns /api/backtest.
router = APIRouter(prefix="/api/backtest", tags=["backtest"])


# ── Strategy management ────────────────────────────────────────────────────

@router.post("/upload-strategy", response_model=StrategyUploadResponse,
             summary="Upload a Python strategy file")
async def upload_strategy(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".py"):
        raise HTTPException(400, "Only .py strategy files are accepted.")
    try:
        content = await file.read()
        strategy = await backtest_service.upload_strategy(content, file.filename, db)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return StrategyUploadResponse(strategy_id=strategy.id, filename=strategy.filename)


@router.get("/strategies", response_model=list[StrategyListItem],
            summary="List all uploaded strategies")
async def list_strategies(db: AsyncSession = Depends(get_db)):
    try:
        strategies = await backtest_service.list_strategies(db)
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return [
        StrategyListItem(id=s.id, filename=s.filename, created_at=str(s.created_at))
        for s in strategies
    ]


@router.get("/strategies/{strategy_id}/source", summary="Get strategy source code")
async def get_strategy_source(strategy_id: int, db: AsyncSession = Depends(get_db)):
    s = await backtest_service.get_strategy(strategy_id, db)
    if s is None:
        raise HTTPException(404, f"Strategy {strategy_id} not found.")
    return {"strategy_id": s.id, "filename": s.filename, "content": s.content}


# ── Backtest execution ─────────────────────────────────────────────────────

@router.post("/run", response_model=BacktestRunResponse, summary="Run a backtest")
async def run_backtest(
    req: BacktestRunRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        backtest = await backtest_service.run_backtest(
            ga_row_id        = req.ga_row_id,
            strategy_id      = req.strategy_id,
            ohlcv_session_id = req.ohlcv_session_id,
            db               = db,
        )
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return BacktestRunResponse(
        backtest_id = backtest.id,
        status      = backtest.status,
        error       = backtest.error_msg,
    )


# ── Trade access ───────────────────────────────────────────────────────────

@router.get("/trades/{backtest_id}", response_model=TradesPageResponse,
            summary="Paginated trades for a backtest")
async def get_trades(
    backtest_id: int,
    page: int = 1,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    if page < 1:
        raise HTTPException(400, "page must be >= 1")
    if not 1 <= limit <= 5000:
        raise HTTPException(400, "limit must be 1–5000")
    try:
        trades = await backtest_service.get_trades(backtest_id, page, limit, db)
        total  = await backtest_service.count_trades(backtest_id, db)
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return TradesPageResponse(
        trades=[
            TradeResponse(
                id          = t.id,
                backtest_id = t.backtest_id,
                trade_no    = t.trade_no,
                entry_date  = t.entry_date,
                exit_date   = t.exit_date,
                entry_price = t.entry_price,
                exit_price  = t.exit_price,
                direction   = t.direction,
                profit      = t.profit,
                balance     = t.balance,
            )
            for t in trades
        ],
        total=total, page=page, limit=limit,
    )


# ── Backtest listing ───────────────────────────────────────────────────────

@router.get("/list", response_model=list[BacktestListItem],
            summary="List recent backtests")
async def list_backtests(limit: int = 50, db: AsyncSession = Depends(get_db)):
    try:
        backtests = await backtest_service.list_backtests(db, limit=limit)
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return [
        BacktestListItem(
            id               = b.id,
            ga_row_id        = b.ga_row_id,
            strategy_id      = b.strategy_id,
            ohlcv_session_id = b.ohlcv_session_id,
            status           = b.status,
            trade_count      = b.trade_count,
            net_profit       = b.net_profit,
            created_at       = str(b.created_at),
            error_msg        = b.error_msg,
        )
        for b in backtests
    ]


@router.get("/{backtest_id}", summary="Get backtest details")
async def get_backtest(backtest_id: int, db: AsyncSession = Depends(get_db)):
    b = await backtest_service.get_backtest(backtest_id, db)
    if b is None:
        raise HTTPException(404, f"Backtest {backtest_id} not found.")
    return {
        "id": b.id, "ga_row_id": b.ga_row_id, "strategy_id": b.strategy_id,
        "ohlcv_session_id": b.ohlcv_session_id, "status": b.status,
        "trade_count": b.trade_count, "net_profit": b.net_profit,
        "error_msg": b.error_msg, "created_at": str(b.created_at),
    }
