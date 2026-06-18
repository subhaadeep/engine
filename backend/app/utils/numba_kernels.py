"""
GA Parameter Explorer — Numba JIT Monte Carlo Kernels
All kernels are compiled with cache=True so the first run after startup
pays the compilation cost; subsequent calls use the cached bytecode.

parallel=True enables Numba's thread-level parallelism via TBB/OpenMP.
"""
from __future__ import annotations

import numpy as np

try:
    import numba as nb

    _NUMBA_AVAILABLE = True
except ImportError:  # pragma: no cover
    _NUMBA_AVAILABLE = False

# ---------------------------------------------------------------------------
# Numba-accelerated kernels
# ---------------------------------------------------------------------------

if _NUMBA_AVAILABLE:

    @nb.njit(parallel=True, cache=True)
    def monte_carlo_equity_curves(
        returns: np.ndarray,      # shape (n_trades,) — per-trade fractional returns
        n_sims: int,
        starting_equity: float,
    ) -> np.ndarray:
        """
        Bootstrap Monte Carlo simulation.

        Each simulation path randomly resamples (with replacement) from the
        empirical trade-return distribution and accumulates an equity curve.

        Returns
        -------
        np.ndarray  shape (n_sims, n_trades + 1)
            curves[i, 0] == starting_equity for all i.
        """
        n_trades = len(returns)
        curves = np.empty((n_sims, n_trades + 1), dtype=np.float64)

        for i in nb.prange(n_sims):
            curves[i, 0] = starting_equity
            equity = starting_equity
            for t in range(n_trades):
                # Bootstrap: sample with replacement
                idx = np.random.randint(0, n_trades)
                ret = returns[idx]
                equity = equity * (1.0 + ret)
                curves[i, t + 1] = equity

        return curves

    @nb.njit(cache=True)
    def compute_max_drawdown(equity_curve: np.ndarray) -> float:
        """
        Compute maximum drawdown fraction for a single equity curve.

        Returns a value in [0, 1] where 1.0 == 100% drawdown (total ruin).
        """
        peak = equity_curve[0]
        max_dd = 0.0
        for v in equity_curve:
            if v > peak:
                peak = v
            if peak > 0.0:
                dd = (peak - v) / peak
            else:
                dd = 0.0
            if dd > max_dd:
                max_dd = dd
        return max_dd

    @nb.njit(parallel=True, cache=True)
    def compute_all_drawdowns(curves: np.ndarray) -> np.ndarray:
        """
        Vectorised max-drawdown over all simulation paths.

        Parameters
        ----------
        curves : np.ndarray  shape (n_sims, n_steps)

        Returns
        -------
        np.ndarray  shape (n_sims,)  — one max-DD value per path.
        """
        n_sims = curves.shape[0]
        drawdowns = np.empty(n_sims, dtype=np.float64)
        for i in nb.prange(n_sims):
            drawdowns[i] = compute_max_drawdown(curves[i])
        return drawdowns

else:
    # Pure-NumPy fallback so the server can start without Numba installed
    def monte_carlo_equity_curves(  # type: ignore[misc]
        returns: np.ndarray,
        n_sims: int,
        starting_equity: float,
    ) -> np.ndarray:
        n_trades = len(returns)
        curves = np.empty((n_sims, n_trades + 1), dtype=np.float64)
        curves[:, 0] = starting_equity
        for i in range(n_sims):
            indices = np.random.randint(0, n_trades, size=n_trades)
            sampled = returns[indices]
            factors = 1.0 + sampled
            cum = np.cumprod(factors)
            curves[i, 1:] = starting_equity * cum
        return curves

    def compute_max_drawdown(equity_curve: np.ndarray) -> float:  # type: ignore[misc]
        if len(equity_curve) == 0:
            return 0.0
        roll_max = np.maximum.accumulate(equity_curve)
        with np.errstate(divide="ignore", invalid="ignore"):
            dd = np.where(roll_max > 0, (roll_max - equity_curve) / roll_max, 0.0)
        return float(np.max(dd))

    def compute_all_drawdowns(curves: np.ndarray) -> np.ndarray:  # type: ignore[misc]
        n_sims = curves.shape[0]
        drawdowns = np.empty(n_sims, dtype=np.float64)
        for i in range(n_sims):
            drawdowns[i] = compute_max_drawdown(curves[i])
        return drawdowns


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def pack_curves_for_plotly(curves: np.ndarray) -> dict:
    """
    Flatten an (n_sims × n_steps) array into a single Plotly-compatible
    x/y pair, using *None* separators so each path is drawn as a separate
    line without connecting segments.

    Returns
    -------
    {"x": [...], "y": [...]}
    """
    n_sims, n_days = curves.shape
    x_base = list(range(n_days))
    packed_x: list = []
    packed_y: list = []
    for i in range(n_sims):
        packed_x.extend(x_base)
        packed_x.append(None)
        packed_y.extend(curves[i].tolist())
        packed_y.append(None)
    return {"x": packed_x, "y": packed_y}


def compute_risk_of_ruin(
    final_balances: np.ndarray,
    initial_balance: float,
    ruin_threshold: float = 0.5,
) -> float:
    """
    Fraction of simulation paths that ended below
    ``ruin_threshold * initial_balance``.

    Parameters
    ----------
    ruin_threshold : float
        Default 0.5 → ruin == losing ≥ 50 % of initial capital.
    """
    ruin_count = int(np.sum(final_balances < ruin_threshold * initial_balance))
    return ruin_count / len(final_balances)


def build_histogram(data: np.ndarray, bins: int = 50) -> dict:
    """
    Convenience wrapper around np.histogram that returns JSON-safe dicts.

    Returns
    -------
    {"bin_edges": [...], "counts": [...]}
    """
    counts, edges = np.histogram(data, bins=bins)
    return {
        "bin_edges": edges.tolist(),
        "counts": counts.tolist(),
    }


def warmup_numba() -> None:
    """
    Force JIT compilation of all Numba kernels at application startup.
    Call this inside the FastAPI lifespan so the first real request is fast.
    """
    dummy_returns = np.array([0.01, -0.005, 0.008, -0.003, 0.012], dtype=np.float64)
    curves = monte_carlo_equity_curves(dummy_returns, n_sims=4, starting_equity=100.0)
    _ = compute_all_drawdowns(curves)
