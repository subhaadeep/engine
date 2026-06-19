from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel


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


class ColumnRangeSchema(BaseModel):
    name:     str
    min_val:  Optional[float] = None
    max_val:  Optional[float] = None
    dtype:    str = "float64"


class FilterRuleSchema(BaseModel):
    enabled:  bool = False
    min_val:  Optional[float] = None
    max_val:  Optional[float] = None


class FilterConfigSchema(BaseModel):
    session_id: str
    columns:    dict[str, FilterRuleSchema] = {}
    top_n:      int = 100
    rank_by:    str = ""
    rank_order: str = "desc"


class FilterResultRowSchema(BaseModel):
    id:   int
    rank: int
    data: dict


class FilterResponseSchema(BaseModel):
    results:        List[FilterResultRowSchema]
    total_matching: int


class BacktestRunRequestSchema(BaseModel):
    ga_row_id:        int
    strategy_id:      int
    ohlcv_session_id: int


class BacktestResultSchema(BaseModel):
    backtest_id: int
    status:      str
    error:       Optional[str] = None


class TradeSchema(BaseModel):
    id:           int
    backtest_id:  int
    trade_no:     int
    entry_date:   str
    exit_date:    str
    entry_price:  float
    exit_price:   float
    direction:    str
    profit:       float
    balance:      float


class TradesResponseSchema(BaseModel):
    trades: List[TradeSchema]
    total:  int
    page:   int
    limit:  int


class MonteCarloRequestSchema(BaseModel):
    backtest_id:     int
    n_simulations:   int = 1000
    initial_balance: float = 10000.0


class MCRunResponseSchema(BaseModel):
    run_id: str
    status: str


class MCResultsSchema(BaseModel):
    run_id:               str
    backtest_id:          int
    n_sims:               int
    mean_final_balance:   Optional[float] = None
    median_final_balance: Optional[float] = None
    std_final_balance:    Optional[float] = None
    pct_profitable:       Optional[float] = None
    var_95:               Optional[float] = None
    cvar_95:              Optional[float] = None
    balance_histogram:    Optional[dict]  = None
    equity_curves_sample: Optional[list]  = None
    created_at:           Optional[str]   = None


class StrategySchema(BaseModel):
    id:         int
    filename:   str
    created_at: Optional[str] = None
