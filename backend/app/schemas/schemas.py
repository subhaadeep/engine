from pydantic import BaseModel
from typing import Optional, List, Any


class ImportStatusResponse(BaseModel):
    ga_session_id: Optional[str] = None
    ga_filename: Optional[str] = None
    ohlcv_session_id: Optional[str] = None
    ohlcv_filename: Optional[str] = None
    ready: bool = False


class SessionListItem(BaseModel):
    id: str
    filename: str
    row_count: int
    created_at: str
    expires_at: str


class ColumnRange(BaseModel):
    name: str
    min: Optional[float] = None
    max: Optional[float] = None
    dtype: str = "float"


class FilterRequest(BaseModel):
    session_id: str
    filters: Optional[dict] = None
    top_n: Optional[int] = 100
    sort_by: Optional[str] = None
    sort_asc: Optional[bool] = False


class BacktestRunRequest(BaseModel):
    ga_row_id: str
    strategy_id: str
    ohlcv_session_id: str


class MCRunRequest(BaseModel):
    backtest_id: str
    n_sims: Optional[int] = 1000
    resample_size: Optional[int] = None


class MCResultsResponse(BaseModel):
    run_id: str
    backtest_id: str
    n_sims: int
    mean_final_balance: Optional[float] = None
    median_final_balance: Optional[float] = None
    std_final_balance: Optional[float] = None
    pct_profitable: Optional[float] = None
    var_95: Optional[float] = None
    cvar_95: Optional[float] = None
    balance_histogram: Optional[Any] = None
    equity_curves_sample: Optional[Any] = None
    created_at: Optional[str] = None
