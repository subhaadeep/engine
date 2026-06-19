"""
Monte Carlo Router — /api/montecarlo/...

Endpoints
---------
POST /api/montecarlo/run                   Run bootstrap simulation
GET  /api/montecarlo/results/{run_id}      Fetch full results
GET  /api/montecarlo/runs/{backtest_id}    List runs for a backtest
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import MCResultsResponse, MCRunRequest
from app.services import montecarlo_service

router = APIRouter(prefix="/api/montecarlo", tags=["montecarlo"])


# ── Run simulation ─────────────────────────────────────────────────────────

@router.post("/run", summary="Run Monte Carlo simulation")
async def run_montecarlo(
    req: MCRunRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Bootstrap Monte Carlo simulation.

    For each simulation path, per-trade returns are resampled with replacement
    and the equity curve is computed from `initial_balance`.

    Returns `run_id` — use GET /results/{run_id} to fetch full stats.
    """
    try:
        mc_run = await montecarlo_service.run_monte_carlo(
            backtest_id     = req.backtest_id,
            n_simulations   = req.n_simulations,
            initial_balance = req.initial_balance,
            db              = db,
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"Monte Carlo failed: {exc}")

    return {
        "run_id":       mc_run.id,
        "backtest_id":  mc_run.backtest_id,
        "n_simulations": mc_run.n_simulations,
    }


# ── Fetch results ──────────────────────────────────────────────────────────

@router.get("/results/{run_id}", response_model=MCResultsResponse,
            summary="Get Monte Carlo results")
async def get_mc_results(run_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await montecarlo_service.get_results(run_id, db)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    except Exception as exc:
        raise HTTPException(500, str(exc))


# ── List runs for a backtest ───────────────────────────────────────────────

@router.get("/runs/{backtest_id}", summary="List MC runs for a backtest")
async def list_mc_runs(backtest_id: int, db: AsyncSession = Depends(get_db)):
    try:
        runs = await montecarlo_service.list_mc_runs(backtest_id, db)
    except Exception as exc:
        raise HTTPException(500, str(exc))
    return [
        {
            "run_id":          r.id,
            "backtest_id":     r.backtest_id,
            "n_simulations":   r.n_simulations,
            "initial_balance": r.initial_balance,
        }
        for r in runs
    ]
