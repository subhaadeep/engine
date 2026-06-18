import { create } from 'zustand';
import type { Strategy, BacktestResult, Trade, FilterResultRow, BacktestRunRequest } from '../types';
import { uploadStrategy, listStrategies, runBacktest, getTrades, listBacktests } from '../api/backtestApi';

interface BacktestState {
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  selectedParameterRow: FilterResultRow | null;
  currentBacktest: BacktestResult | null;
  trades: Trade[];
  totalTrades: number;
  recentBacktests: any[];
  isRunning: boolean;
  isLoadingStrategies: boolean;
  isLoadingTrades: boolean;
  isLoadingHistory: boolean;
  error: string | null;

  setSelectedStrategy: (s: Strategy | null) => void;
  setSelectedParameterRow: (row: FilterResultRow | null) => void;
  uploadStrategy: (file: File) => Promise<void>;
  fetchStrategies: () => Promise<void>;
  /**
   * Run a backtest.
   * @param gaRowId  - the specific GA row ID (FilterResultRow.id)
   * @param ohlcvSessionId - OHLCVSession id
   */
  runBacktest: (gaRowId: number, ohlcvSessionId: number) => Promise<void>;
  fetchTrades: (backtestId: number, page?: number, limit?: number) => Promise<void>;
  fetchRecentBacktests: (limit?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useBacktestStore = create<BacktestState>((set, get) => ({
  strategies: [],
  selectedStrategy: null,
  selectedParameterRow: null,
  currentBacktest: null,
  trades: [],
  totalTrades: 0,
  recentBacktests: [],
  isRunning: false,
  isLoadingStrategies: false,
  isLoadingTrades: false,
  isLoadingHistory: false,
  error: null,

  setSelectedStrategy: (s) => set({ selectedStrategy: s }),
  setSelectedParameterRow: (row) => set({ selectedParameterRow: row }),

  uploadStrategy: async (file: File) => {
    set({ isLoadingStrategies: true, error: null });
    try {
      await uploadStrategy(file);
      // Refresh list after upload
      const strategies = await listStrategies();
      set({ strategies, isLoadingStrategies: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Upload failed',
        isLoadingStrategies: false,
      });
    }
  },

  fetchStrategies: async () => {
    set({ isLoadingStrategies: true, error: null });
    try {
      const strategies = await listStrategies();
      set({ strategies, isLoadingStrategies: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load strategies',
        isLoadingStrategies: false,
      });
    }
  },

  runBacktest: async (gaRowId: number, ohlcvSessionId: number) => {
    const { selectedStrategy } = get();
    if (!selectedStrategy) {
      set({ error: 'No strategy selected' });
      return;
    }

    const req: BacktestRunRequest = {
      ga_row_id: gaRowId,
      strategy_id: selectedStrategy.id,
      ohlcv_session_id: ohlcvSessionId,
    };

    set({ isRunning: true, error: null, currentBacktest: null, trades: [], totalTrades: 0 });
    try {
      const result = await runBacktest(req);
      set({ currentBacktest: result, isRunning: false });

      // Auto-fetch trades if successful
      if (result.status === 'done') {
        const { fetchTrades } = get();
        await fetchTrades(result.backtest_id);
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Backtest failed',
        isRunning: false,
      });
    }
  },

  fetchTrades: async (backtestId: number, page = 1, limit = 100) => {
    set({ isLoadingTrades: true });
    try {
      const response = await getTrades(backtestId, page, limit);
      set({
        trades: response.trades,
        totalTrades: response.total,
        isLoadingTrades: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch trades',
        isLoadingTrades: false,
      });
    }
  },

  fetchRecentBacktests: async (limit = 50) => {
    set({ isLoadingHistory: true });
    try {
      const data = await listBacktests(limit);
      set({ recentBacktests: data, isLoadingHistory: false });
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      currentBacktest: null,
      trades: [],
      totalTrades: 0,
      error: null,
    }),
}));
