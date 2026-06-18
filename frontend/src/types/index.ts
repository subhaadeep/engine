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
  ready: boolean;
}

export interface ColumnRange {
  name: string;
  min_val: number;
  max_val: number;
  dtype: string;
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
  returned: number;
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

export interface Strategy {
  id: number;
  filename: string;
}

export interface BacktestRequest {
  ga_session_id: number;
  ohlcv_session_id: number;
  strategy_id: number;
  parameters: Record<string, number | string>;
}

export interface BacktestResult {
  backtest_id: number;
  status: string;
  error: string | null;
}

export interface MonteCarloRequest {
  backtest_id: number;
  n_simulations: number;
  initial_balance: number;
}

export interface MCRunResponse {
  run_id: number;
  status: string;
}

export interface MCResults {
  mean_return: number;
  median_return: number;
  max_return: number;
  min_return: number;
  avg_drawdown: number;
  worst_drawdown: number;
  risk_of_ruin: number;
  equity_curves_packed: { x: (number | null)[]; y: (number | null)[] };
  balance_histogram: { bins: number[]; counts: number[] };
  drawdown_histogram: { bins: number[]; counts: number[] };
  initial_balance: number;
  n_simulations: number;
}

export type NavPage = 'import' | 'filter' | 'explorer' | 'backtest' | 'montecarlo';
