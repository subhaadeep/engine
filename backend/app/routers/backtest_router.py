"""
GA Parameter Explorer — Backtest Router
Strategy management and backtest execution endpoints.
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

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


# ---------------------------------------------------------------------------
# Strategy management
# ---------------------------------------------------------------------------

@router.post(
    "/upload-strategy",
    response_model=StrategyUploadResponse,
    summary="Upload a Python strategy file",
)
async def upload_strategy(
    file: UploadFile = File(..., description="Python (.py) strategy file"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and store a Python strategy file.

    The file must define a class named ``Strategy`` with a
    ``generate_signals(self, ohlcv_df: pd.DataFrame) -> pd.DataFrame`` method.
    """
    if not file.filename or not file.filename.lower().endswith(".py"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .py strategy files are accepted.",
        )
    try:
        content = await file.read()
        strategy = await backtest_service.upload_strategy(content, file.filename, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return StrategyUploadResponse(strategy_id=strategy.id, filename=strategy.filename)


@router.get(
    "/strategies",
    response_model=list[StrategyListItem],
    summary="List all uploaded strategies",
)
async def list_strategies(db: AsyncSession = Depends(get_db)):
    """Return all stored strategy files ordered newest first."""
    try:
        strategies = await backtest_service.list_strategies(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return [
        StrategyListItem(
            id=s.id,
            filename=s.filename,
            created_at=str(s.created_at),
        )
        for s in strategies
    ]


@router.get("/strategies/{strategy_id}/source", summary="Get strategy source code")
async def get_strategy_source(strategy_id: int, db: AsyncSession = Depends(get_db)):
    """Return the full source code of a stored strategy."""
    strategy = await backtest_service.get_strategy(strategy_id, db)
    if strategy is None:
        raise HTTPException(status_code=404, detail=f"Strategy {strategy_id} not found.")
    return {"strategy_id": strategy.id, "filename": strategy.filename, "content": strategy.content}


# ---------------------------------------------------------------------------
# Backtest execution
# ---------------------------------------------------------------------------

@router.post(
    "/run",
    response_model=BacktestRunResponse,
    summary="Run a backtest",
)
async def run_backtest(
    req: BacktestRunRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute the full backtest pipeline for a single GA row.

    - Injects GA parameters into the strategy source.
    - Runs ``Strategy.generate_signals()`` in a restricted environment.
    - Converts signals to trades using the built-in execution engine.
    - Persists all trades to the database.

    Returns the backtest ID and status.  If the strategy raises an error,
    status will be 'error' and the error message will be included.
    """
    try:
        backtest = await backtest_service.run_backtest(
            ga_row_id=req.ga_row_id,
            strategy_id=req.strategy_id,
            ohlcv_session_id=req.ohlcv_session_id,
            db=db,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return BacktestRunResponse(
        backtest_id=backtest.id,
        status=backtest.status,
        error=backtest.error_msg,
    )


# ---------------------------------------------------------------------------
# Trade access
# ---------------------------------------------------------------------------

@router.get(
    "/trades/{backtest_id}",
    response_model=TradesPageResponse,
    summary="Get paginated trades for a backtest",
)
async def get_trades(
    backtest_id: int,
    page: int = 1,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """
    Return a paginated list of trades for the given backtest.

    Query Parameters
    ----------------
    page  : int  (default 1)
    limit : int  (default 100, max recommended 500)
    """
    if page < 1:
        raise HTTPException(status_code=400, detail="page must be >= 1")
    if limit < 1 or limit > 5000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 5000")

    try:
        trades = await backtest_service.get_trades(backtest_id, page, limit, db)
        total = await backtest_service.count_trades(backtest_id, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return TradesPageResponse(
        trades=[
            TradeResponse(
                id=t.id,
                backtest_id=t.backtest_id,
                trade_no=t.trade_no,
                entry_date=t.entry_date,
                exit_date=t.exit_date,
                entry_price=t.entry_price,
                exit_price=t.exit_price,
                direction=t.direction,
                profit=t.profit,
                balance=t.balance,
            )
            for t in trades
        ],
        total=total,
        page=page,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# Backtest listing
# ---------------------------------------------------------------------------

@router.get(
    "/list",
    response_model=list[BacktestListItem],
    summary="List recent backtests",
)
async def list_backtests(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Return the most recent backtests ordered newest first."""
    try:
        backtests = await backtest_service.list_backtests(db, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return [
        BacktestListItem(
            id=b.id,
            ga_row_id=b.ga_row_id,
            strategy_id=b.strategy_id,
            ohlcv_session_id=b.ohlcv_session_id,
            status=b.status,
            trade_count=b.trade_count,
            net_profit=b.net_profit,
            created_at=str(b.created_at),
            error_msg=b.error_msg,
        )
        for b in backtests
    ]


@router.get("/{backtest_id}", summary="Get backtest details")
async def get_backtest(backtest_id: int, db: AsyncSession = Depends(get_db)):
    """Return metadata for a single backtest."""
    b = await backtest_service.get_backtest(backtest_id, db)
    if b is None:
        raise HTTPException(status_code=404, detail=f"Backtest {backtest_id} not found.")
    return {
        "id": b.id,
        "ga_row_id": b.ga_row_id,
        "strategy_id": b.strategy_id,
        "ohlcv_session_id": b.ohlcv_session_id,
        "status": b.status,
        "trade_count": b.trade_count,
        "net_profit": b.net_profit,
        "error_msg": b.error_msg,
        "created_at": str(b.created_at),
    }
