"""
GA Parameter Explorer — Pydantic Request / Response Schemas
These are NOT SQLModel tables — they are pure Pydantic models used for
API request validation and response serialisation.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------

class ImportStatusResponse(BaseModel):
    ga_session_id: Optional[int]
    ga_filename: Optional[str]
    ga_row_count: int
    ga_columns: List[str]
    ohlcv_session_id: Optional[int]
    ohlcv_filename: Optional[str]
    ohlcv_row_count: int
    ready: bool


class GAUploadResponse(BaseModel):
    session_id: int
    filename: str
    columns: List[str]
    row_count: int


class OHLCVUploadResponse(BaseModel):
    session_id: int
    filename: str
    row_count: int
    date_from: Optional[str]
    date_to: Optional[str]


# ---------------------------------------------------------------------------
# Filter
# ---------------------------------------------------------------------------

class ColumnRange(BaseModel):
    name: str
    min_val: Optional[float]
    max_val: Optional[float]
    dtype: str  # 'numeric' | 'string'


class FilterRule(BaseModel):
    enabled: bool = True
    min_val: Optional[float] = None
    max_val: Optional[float] = None


class FilterConfig(BaseModel):
    session_id: int
    columns: Dict[str, FilterRule] = Field(default_factory=dict)
    top_n: int = Field(default=50, ge=1, le=10000)
    rank_by: str = ""
    rank_order: str = Field(default="desc", pattern="^(asc|desc)$")


class FilterResultRow(BaseModel):
    id: int
    rank: int
    data: Dict[str, Any]


class FilterResponse(BaseModel):
    total_matching: int
    results: List[FilterResultRow]


# ---------------------------------------------------------------------------
# Strategy / Backtest
# ---------------------------------------------------------------------------

class StrategyUploadResponse(BaseModel):
    strategy_id: int
    filename: str


class StrategyListItem(BaseModel):
    id: int
    filename: str
    created_at: str


class BacktestRunRequest(BaseModel):
    ga_row_id: int
    strategy_id: int
    ohlcv_session_id: int


class BacktestRunResponse(BaseModel):
    backtest_id: int
    status: str
    error: Optional[str]


class TradeResponse(BaseModel):
    id: int
    backtest_id: int
    trade_no: int
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    direction: str
    profit: float
    balance: float


class TradesPageResponse(BaseModel):
    trades: List[TradeResponse]
    total: int
    page: int
    limit: int


class BacktestListItem(BaseModel):
    id: int
    ga_row_id: int
    strategy_id: int
    ohlcv_session_id: int
    status: str
    trade_count: int
    net_profit: Optional[float]
    created_at: str
    error_msg: Optional[str]


# ---------------------------------------------------------------------------
# Monte Carlo
# ---------------------------------------------------------------------------

class MCRunRequest(BaseModel):
    backtest_id: int
    n_simulations: int = Field(default=1000, ge=100, le=50000)
    initial_balance: float = Field(default=100000.0, gt=0)


class PackedCurves(BaseModel):
    x: List[Optional[int]]
    y: List[Optional[float]]


class BalanceHistogram(BaseModel):
    bin_edges: List[float]
    counts: List[int]


class MCResultsResponse(BaseModel):
    run_id: int
    backtest_id: int
    n_simulations: int
    initial_balance: float
    mean_final_balance: float
    median_final_balance: float
    max_final_balance: float
    min_final_balance: float
    mean_return_pct: float
    median_return_pct: float
    avg_drawdown: float
    worst_drawdown: float
    risk_of_ruin: float
    equity_curves_packed: Dict[str, Any]   # {x: [...], y: [...]} with None separators
    balance_histogram: Dict[str, Any]      # {bin_edges: [...], counts: [...]}
    drawdown_histogram: Dict[str, Any]     # {bin_edges: [...], counts: [...]}
