// ── Import ────────────────────────────────────────────────────────────────
export interface GASession {
  id: number;
  filename: string;
  columns: string[];
  row_count: number;
}

export interface OHLCVSession {
  id: number;
  filename: string;
  row_count: number;
  date_from: string | null;
  date_to: string | null;
}

export interface ImportStatus {
  ga_session_id: number | null;
  ga_filename: string | null;
  ga_row_count: number;
  ga_columns: string[];
  ohlcv_session_id: number | null;
  ohlcv_filename: string | null;
  ohlcv_row_count: number;
  ohlcv_date_from?: string | null;
  ohlcv_date_to?: string | null;
  ready: boolean;
}

// ── Filter ────────────────────────────────────────────────────────────────
export interface ColumnRange {
  name: string;
  min_val: number | null;
  max_val: number | null;
  dtype: string; // 'numeric' | 'string'
}

export interface FilterRule {
  enabled: boolean;
  min_val: number | null;
  max_val: number | null;
}

export interface FilterConfig {
  session_id: number;
  columns: Record<string, FilterRule>;
  top_n: number;
  rank_by: string;
  rank_order: 'asc' | 'desc';
}

export interface FilterResultRow {
  id: number;
  rank: number;
  data: Record<string, number | string>;
}

export interface FilterResponse {
  results: FilterResultRow[];
  total_matching: number;
}

// ── Strategy / Backtest ───────────────────────────────────────────────────
export interface Strategy {
  id: number;
  filename: string;
  created_at?: string;
}

/**
 * Payload sent to POST /api/backtest/run
 * Matches backend BacktestRunRequest schema exactly.
 */
export interface BacktestRunRequest {
  ga_row_id: number;        // ID of the specific GARow to use
  strategy_id: number;      // ID of the uploaded Strategy
  ohlcv_session_id: number; // ID of the OHLCVSession
}

/** @deprecated use BacktestRunRequest */
export type BacktestRequest = BacktestRunRequest;

export interface BacktestResult {
  backtest_id: number;
  status: string;
  error: string | null;
}

export interface Trade {
  id: number;
  backtest_id: number;
  trade_no: number;
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  direction: 'long' | 'short';
  profit: number;
  balance: number;
}

export interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  limit: number;
}

export interface BacktestListItem {
  id: number;
  ga_row_id: number;
  strategy_id: number;
  ohlcv_session_id: number;
  status: string;
  trade_count: number;
  net_profit: number | null;
  created_at: string;
  error_msg: string | null;
}

// ── Monte Carlo ───────────────────────────────────────────────────────────
export interface MonteCarloRequest {
  backtest_id: number;
  n_simulations: number;
  initial_balance: number;
}

export interface MCRunResponse {
  run_id: number;
  status: string;
}

/**
 * Matches backend MCResultsResponse schema exactly.
 */
export interface MCResults {
  run_id: number;
  backtest_id: number;
  n_simulations: number;
  initial_balance: number;
  mean_final_balance: number;
  median_final_balance: number;
  max_final_balance: number;
  min_final_balance: number;
  mean_return_pct: number;
  median_return_pct: number;
  avg_drawdown: number;
  worst_drawdown: number;
  risk_of_ruin: number;
  equity_curves_packed: { x: (number | null)[]; y: (number | null)[] };
  balance_histogram: { bin_edges: number[]; counts: number[] };
  drawdown_histogram: { bin_edges: number[]; counts: number[] };
}

export type NavPage = 'import' | 'filter' | 'explorer' | 'backtest' | 'montecarlo';
