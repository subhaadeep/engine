"""
GA Parameter Explorer — Monte Carlo Simulation Service

Loads per-trade returns from the database, runs the Numba bootstrap
simulation, computes statistics, and persists the packed results as JSON.
"""
from __future__ import annotations

import json
from typing import Optional

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import MCRun, Trade
from app.schemas.schemas import MCResultsResponse
from app.services import backtest_service
from app.utils.numba_kernels import (
    build_histogram,
    compute_all_drawdowns,
    compute_risk_of_ruin,
    monte_carlo_equity_curves,
    pack_curves_for_plotly,
)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

async def run_monte_carlo(
    backtest_id: int,
    n_simulations: int,
    initial_balance: float,
    db: AsyncSession,
) -> MCRun:
    """
    Execute Monte Carlo simulation for a completed backtest.

    Steps
    -----
    1. Load all Trade records for the backtest.
    2. Convert to fractional per-trade returns.
    3. Call Numba kernel to produce equity-curve matrix.
    4. Compute summary statistics.
    5. Pack curves for Plotly, build histograms.
    6. Serialise to JSON and persist an MCRun record.

    Raises
    ------
    ValueError
        If the backtest has no trades.
    """
    # 1. Load trades
    trades: list[Trade] = await backtest_service.get_all_trades(backtest_id, db)
    if not trades:
        raise ValueError(
            f"Backtest {backtest_id} has no trades — cannot run Monte Carlo."
        )

    # 2. Compute per-trade fractional returns
    #    return_i = profit_i / balance_before_i
    #    We reconstruct balance_before from the running balance column.
    returns_list: list[float] = []
    prev_balance = initial_balance
    for t in trades:
        if prev_balance != 0:
            ret = t.profit / prev_balance
        else:
            ret = 0.0
        returns_list.append(ret)
        prev_balance = t.balance

    returns_arr = np.array(returns_list, dtype=np.float64)

    # 3. Run Numba MC kernel
    curves = monte_carlo_equity_curves(returns_arr, n_sims=n_simulations, starting_equity=initial_balance)
    # curves.shape == (n_simulations, n_trades + 1)

    # 4. Statistics on final balances
    final_balances = curves[:, -1]
    mean_final = float(np.mean(final_balances))
    median_final = float(np.median(final_balances))
    max_final = float(np.max(final_balances))
    min_final = float(np.min(final_balances))

    mean_ret_pct = (mean_final - initial_balance) / initial_balance * 100.0
    median_ret_pct = (median_final - initial_balance) / initial_balance * 100.0

    # 5. Drawdowns
    drawdowns = compute_all_drawdowns(curves)
    avg_dd = float(np.mean(drawdowns))
    worst_dd = float(np.max(drawdowns))

    # 6. Risk of ruin (lose ≥ 50%)
    ror = compute_risk_of_ruin(final_balances, initial_balance, ruin_threshold=0.5)

    # 7. Pack equity curves for Plotly (sub-sample to max 500 curves to keep JSON small)
    max_curves_in_response = min(n_simulations, 500)
    packed = pack_curves_for_plotly(curves[:max_curves_in_response])

    # 8. Histograms
    balance_hist = build_histogram(final_balances, bins=50)
    dd_hist = build_histogram(drawdowns * 100.0, bins=50)  # as percentages

    # 9. Assemble results dict
    results = {
        "mean_final_balance": mean_final,
        "median_final_balance": median_final,
        "max_final_balance": max_final,
        "min_final_balance": min_final,
        "mean_return_pct": mean_ret_pct,
        "median_return_pct": median_ret_pct,
        "avg_drawdown": avg_dd,
        "worst_drawdown": worst_dd,
        "risk_of_ruin": ror,
        "equity_curves_packed": packed,
        "balance_histogram": balance_hist,
        "drawdown_histogram": dd_hist,
    }

    # 10. Persist MCRun
    mc_run = MCRun(
        backtest_id=backtest_id,
        n_simulations=n_simulations,
        initial_balance=initial_balance,
        results_json=json.dumps(results),
    )
    db.add(mc_run)
    await db.flush()
    await db.refresh(mc_run)

    return mc_run


# ---------------------------------------------------------------------------
# Retrieve
# ---------------------------------------------------------------------------

async def get_results(run_id: int, db: AsyncSession) -> MCResultsResponse:
    """Fetch a stored MCRun and deserialise it into the response schema."""
    result = await db.execute(select(MCRun).where(MCRun.id == run_id))
    mc_run: Optional[MCRun] = result.scalars().first()

    if mc_run is None:
        raise ValueError(f"MCRun {run_id} not found.")

    data = json.loads(mc_run.results_json)

    return MCResultsResponse(
        run_id=mc_run.id,
        backtest_id=mc_run.backtest_id,
        n_simulations=mc_run.n_simulations,
        initial_balance=mc_run.initial_balance,
        mean_final_balance=data["mean_final_balance"],
        median_final_balance=data["median_final_balance"],
        max_final_balance=data["max_final_balance"],
        min_final_balance=data["min_final_balance"],
        mean_return_pct=data["mean_return_pct"],
        median_return_pct=data["median_return_pct"],
        avg_drawdown=data["avg_drawdown"],
        worst_drawdown=data["worst_drawdown"],
        risk_of_ruin=data["risk_of_ruin"],
        equity_curves_packed=data["equity_curves_packed"],
        balance_histogram=data["balance_histogram"],
        drawdown_histogram=data["drawdown_histogram"],
    )


async def list_mc_runs(backtest_id: int, db: AsyncSession) -> list[MCRun]:
    """Return all MC runs for a backtest ordered newest first."""
    result = await db.execute(
        select(MCRun)
        .where(MCRun.backtest_id == backtest_id)
        .order_by(MCRun.id.desc())
    )
    return list(result.scalars().all())
