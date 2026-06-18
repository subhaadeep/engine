"""
GA Parameter Explorer — Monte Carlo Router
Bootstrap simulation endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import MCResultsResponse, MCRunRequest
from app.services import montecarlo_service

router = APIRouter(prefix="/api/montecarlo", tags=["montecarlo"])


# ---------------------------------------------------------------------------
# Run simulation
# ---------------------------------------------------------------------------

@router.post("/run", summary="Run Monte Carlo simulation for a backtest")
async def run_montecarlo(
    req: MCRunRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a Monte Carlo bootstrap simulation.

    For each of ``n_simulations`` paths, the per-trade return sequence is
    randomly resampled (with replacement) and the equity curve is computed.

    Parameters
    ----------
    backtest_id    : int    — ID of a completed backtest with trades.
    n_simulations  : int    — Number of simulation paths (100–50000).
    initial_balance: float  — Starting balance for all paths.

    Returns
    -------
    run_id : int — use to fetch results via GET /results/{run_id}.
    """
    try:
        mc_run = await montecarlo_service.run_monte_carlo(
            backtest_id=req.backtest_id,
            n_simulations=req.n_simulations,
            initial_balance=req.initial_balance,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monte Carlo simulation failed: {exc}",
        )

    return {"run_id": mc_run.id, "backtest_id": mc_run.backtest_id, "n_simulations": mc_run.n_simulations}


# ---------------------------------------------------------------------------
# Retrieve results
# ---------------------------------------------------------------------------

@router.get(
    "/results/{run_id}",
    response_model=MCResultsResponse,
    summary="Get Monte Carlo results",
)
async def get_results(
    run_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Return the full results for a Monte Carlo run.

    Includes
    --------
    - Summary statistics (mean/median/max/min final balance, return %).
    - Average and worst max-drawdown across all paths.
    - Risk of ruin (fraction ending below 50% of initial balance).
    - Equity curves packed for Plotly (x/y with None separators, ≤500 paths).
    - Final-balance histogram (50 bins).
    - Max-drawdown histogram (50 bins, in percent).
    """
    try:
        results = await montecarlo_service.get_results(run_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return results


# ---------------------------------------------------------------------------
# List runs for a backtest
# ---------------------------------------------------------------------------

@router.get("/runs/{backtest_id}", summary="List all MC runs for a backtest")
async def list_mc_runs(backtest_id: int, db: AsyncSession = Depends(get_db)):
    """Return all Monte Carlo runs for a given backtest, ordered newest first."""
    try:
        runs = await montecarlo_service.list_mc_runs(backtest_id, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "backtest_id": backtest_id,
        "runs": [
            {
                "run_id": r.id,
                "n_simulations": r.n_simulations,
                "initial_balance": r.initial_balance,
                "created_at": str(r.created_at),
            }
            for r in runs
        ],
    }
