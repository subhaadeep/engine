import { create } from 'zustand';
import type { MCResults } from '../types';
import { runMonteCarlo, getMCResults } from '../api/montecarloApi';

interface MonteCarloState {
  currentRunId: number | null;
  results: MCResults | null;
  isRunning: boolean;
  nSimulations: number;
  initialBalance: number;
  error: string | null;

  setNSimulations: (n: number) => void;
  setInitialBalance: (b: number) => void;
  runMonteCarlo: (backtestId: number) => Promise<void>;
  fetchResults: (runId: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useMonteCarloStore = create<MonteCarloState>((set, get) => ({
  currentRunId: null,
  results: null,
  isRunning: false,
  nSimulations: 1000,
  initialBalance: 10000,
  error: null,

  setNSimulations: (n: number) => set({ nSimulations: n }),
  setInitialBalance: (b: number) => set({ initialBalance: b }),

  runMonteCarlo: async (backtestId: number) => {
    const { nSimulations, initialBalance } = get();
    set({ isRunning: true, error: null, results: null });
    try {
      const response = await runMonteCarlo({
        backtest_id: backtestId,
        n_simulations: nSimulations,
        initial_balance: initialBalance,
      });
      set({ currentRunId: response.run_id });
      // Poll or directly fetch results
      await get().fetchResults(response.run_id);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Monte Carlo failed',
        isRunning: false,
      });
    }
  },

  fetchResults: async (runId: number) => {
    try {
      const results = await getMCResults(runId);
      set({ results, isRunning: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch results',
        isRunning: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({ currentRunId: null, results: null, isRunning: false, error: null }),
}));
