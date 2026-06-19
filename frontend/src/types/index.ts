// ── Import ────────────────────────────────────────────────────────────────
export interface GASession {
  session_id: string;
  filename: string;
  columns: string[];
  row_count: number;
}

export interface OHLCVSession {
  session_id: string;
  filename: string;
  row_count: number;
  date_from?: string | null;
  date_to?: string | null;
}

export interface ImportStatus {
  ga_session_id: string | null;
  ga_filename: string | null;
  ohlcv_session_id: string | null;
  ohlcv_filename: string | null;
  ready: boolean;
}

// ── Filter ────────────────────────────────────────────────────────────────
export interface ColumnRange {
  name: string;
  min_val: number | null;
  max_val: number | null;
  dtype: string;
}

export interface FilterRule {
  enabled: boolean;
  min_val: number | null;
  max_val: number | null;
}

export interface FilterConfig {
  session_id: string;
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
  id: string;
  filename: string;
  created_at?: string;
}

export interface BacktestRunRequest {
  ga_row_id: string;
  strategy_id: string;
  ohlcv_session_id: string;
}

export interface BacktestResult {
  backtest_id: string;
  status: string;
  error: string | null;
}

export interface Trade {
  id: number;
  backtest_id: string;
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
  id: string;
  ga_row_id: string;
  strategy_id: string;
  ohlcv_session_id: string;
  status: string;
  trade_count: number;
  net_profit: number | null;
  created_at: string;
  error_msg: string | null;
}

// ── Monte Carlo ───────────────────────────────────────────────────────────
export interface MonteCarloRequest {
  backtest_id: string;
  n_simulations: number;
  initial_balance: number;
}

export interface MCRunResponse {
  run_id: string;
  status: string;
}

export interface MCResults {
  run_id: string;
  backtest_id: string;
  n_sims: number;
  mean_final_balance: number | null;
  median_final_balance: number | null;
  std_final_balance: number | null;
  pct_profitable: number | null;
  var_95: number | null;
  cvar_95: number | null;
  balance_histogram: {
    bin_edges: number[];
    counts: number[];
  } | null;
  equity_curves_sample: number[][] | null;
  created_at: string | null;
}

export type NavPage = 'import' | 'filter' | 'explorer' | 'backtest' | 'montecarlo';
