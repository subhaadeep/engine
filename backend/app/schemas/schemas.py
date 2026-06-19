from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# ── Import ──────────────────────────────────────────────────────────────────

class ImportStatusResponse(BaseModel):
    ga_session_id:    Optional[str] = None
    ga_filename:      Optional[str] = None
    ohlcv_session_id: Optional[str] = None
    ohlcv_filename:   Optional[str] = None
    ready:            bool = False


class SessionListItem(BaseModel):
    id:         str
    filename:   str
    row_count:  int
    created_at: str
    expires_at: Optional[str] = None   # None = never expires


# ── Filter ──────────────────────────────────────────────────────────────────

class ColumnRange(BaseModel):
    name:    str
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    dtype:   str = "float64"


class FilterRule(BaseModel):
    enabled: bool = False
    min_val: Optional[float] = None
    max_val: Optional[float] = None


class FilterConfig(BaseModel):
    session_id: int
    columns:    Dict[str, FilterRule] = {}
    top_n:      int = 100
    rank_by:    str = ""
    rank_order: str = "desc"


class FilterResultRow(BaseModel):
    id:   int
    rank: int
    data: Dict[str, Any]


class FilterResponse(BaseModel):
    total_matching: int
    results:        List[FilterResultRow]


# ── Strategy ────────────────────────────────────────────────────────────────

class StrategyUploadResponse(BaseModel):
    strategy_id: int
    filename:    str


class StrategyListItem(BaseModel):
    id:         int
    filename:   str
    created_at: Optional[str] = None


# ── Backtest ────────────────────────────────────────────────────────────────

class BacktestRunRequest(BaseModel):
    ga_row_id:        int
    strategy_id:      int
    ohlcv_session_id: int


class BacktestRunResponse(BaseModel):
    backtest_id: int
    status:      str
    error:       Optional[str] = None


class TradeResponse(BaseModel):
    id:          int
    backtest_id: int
    trade_no:    int
    entry_date:  str
    exit_date:   str
    entry_price: float
    exit_price:  float
    direction:   str
    profit:      float
    balance:     float


class TradesPageResponse(BaseModel):
    trades: List[TradeResponse]
    total:  int
    page:   int
    limit:  int


class BacktestListItem(BaseModel):
    id:               int
    ga_row_id:        Optional[int]   = None
    strategy_id:      Optional[int]   = None
    ohlcv_session_id: Optional[int]   = None
    status:           str
    trade_count:      Optional[int]   = None
    net_profit:       Optional[float] = None
    created_at:       Optional[str]   = None
    error_msg:        Optional[str]   = None


# ── Monte Carlo ─────────────────────────────────────────────────────────────

class MCRunRequest(BaseModel):
    backtest_id:     int
    n_simulations:   int   = 1000
    initial_balance: float = 10000.0


class MCResultsResponse(BaseModel):
    run_id:               int
    backtest_id:          int
    n_simulations:        int
    mean_final_balance:   Optional[float] = None
    median_final_balance: Optional[float] = None
    std_final_balance:    Optional[float] = None
    pct_profitable:       Optional[float] = None
    var_95:               Optional[float] = None
    cvar_95:              Optional[float] = None
    balance_histogram:    Optional[Dict]  = None
    equity_curves_sample: Optional[List]  = None
    initial_balance:      Optional[float] = None
    created_at:           Optional[str]   = None
