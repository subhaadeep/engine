import { create } from 'zustand';
import type { Strategy, BacktestResult, Trade, FilterResultRow } from '../types';
import { uploadStrategy, listStrategies, runBacktest, getTrades } from '../api/backtestApi';

interface BacktestState {
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  selectedParameterRow: FilterResultRow | null;
  currentBacktest: BacktestResult | null;
  trades: Trade[];
  totalTrades: number;
  isRunning: boolean;
  isLoadingStrategies: boolean;
  isLoadingTrades: boolean;
  error: string | null;

  setSelectedStrategy: (s: Strategy | null) => void;
  setSelectedParameterRow: (row: FilterResultRow | null) => void;
  uploadStrategy: (file: File) => Promise<void>;
  fetchStrategies: () => Promise<void>;
  runBacktest: (gaSessionId: number, ohlcvSessionId: number) => Promise<void>;
  fetchTrades: (backtestId: number, page?: number, limit?: number) => Promise<void>;
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
  isRunning: false,
  isLoadingStrategies: false,
  isLoadingTrades: false,
  error: null,

  setSelectedStrategy: (s) => set({ selectedStrategy: s }),
  setSelectedParameterRow: (row) => set({ selectedParameterRow: row }),

  uploadStrategy: async (file: File) => {
    try {
      const strategy = await uploadStrategy(file);
      set((state) => ({
        strategies: [...state.strategies, strategy],
        selectedStrategy: strategy,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Upload failed' });
    }
  },

  fetchStrategies: async () => {
    set({ isLoadingStrategies: true });
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

  runBacktest: async (gaSessionId: number, ohlcvSessionId: number) => {
    const { selectedStrategy, selectedParameterRow } = get();
    if (!selectedStrategy || !selectedParameterRow) {
      set({ error: 'Please select a strategy and parameter set' });
      return;
    }
    set({ isRunning: true, error: null, currentBacktest: null, trades: [] });
    try {
      const result = await runBacktest({
        ga_session_id: gaSessionId,
        ohlcv_session_id: ohlcvSessionId,
        strategy_id: selectedStrategy.id,
        parameters: selectedParameterRow.data as Record<string, number | string>,
      });
      set({ currentBacktest: result, isRunning: false });
      if (result.backtest_id) {
        await get().fetchTrades(result.backtest_id);
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
        error: err instanceof Error ? err.message : 'Failed to load trades',
        isLoadingTrades: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      currentBacktest: null,
      trades: [],
      totalTrades: 0,
      error: null,
      isRunning: false,
    }),
}));
