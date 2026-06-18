import { create } from 'zustand';
import type { MonteCarloRequest, MCRunResponse, MCResults } from '../types';
import { runMonteCarlo, getMCResults, listMCRuns } from '../api/montecarloApi';

interface MonteCarloState {
  currentRunId: number | null;
  results: MCResults | null;
  mcRuns: any[];
  isRunning: boolean;
  isLoadingResults: boolean;
  isLoadingRuns: boolean;
  nSimulations: number;
  initialBalance: number;
  error: string | null;

  setNSimulations: (n: number) => void;
  setInitialBalance: (b: number) => void;
  runSimulation: (backtestId: number) => Promise<void>;
  fetchResults: (runId: number) => Promise<void>;
  fetchRuns: (backtestId: number) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export const useMonteCarloStore = create<MonteCarloState>((set, get) => ({
  currentRunId: null,
  results: null,
  mcRuns: [],
  isRunning: false,
  isLoadingResults: false,
  isLoadingRuns: false,
  nSimulations: 1000,
  initialBalance: 100000,
  error: null,

  setNSimulations: (n) => set({ nSimulations: n }),
  setInitialBalance: (b) => set({ initialBalance: b }),

  runSimulation: async (backtestId: number) => {
    const { nSimulations, initialBalance } = get();
    const req: MonteCarloRequest = {
      backtest_id: backtestId,
      n_simulations: nSimulations,
      initial_balance: initialBalance,
    };

    set({ isRunning: true, error: null, results: null });
    try {
      const runResp: MCRunResponse = await runMonteCarlo(req);
      set({ currentRunId: runResp.run_id, isRunning: false });
      // Auto-fetch results
      await get().fetchResults(runResp.run_id);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Monte Carlo failed',
        isRunning: false,
      });
    }
  },

  fetchResults: async (runId: number) => {
    set({ isLoadingResults: true, error: null });
    try {
      const results = await getMCResults(runId);
      set({ results, isLoadingResults: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch MC results',
        isLoadingResults: false,
      });
    }
  },

  fetchRuns: async (backtestId: number) => {
    set({ isLoadingRuns: true });
    try {
      const data = await listMCRuns(backtestId);
      set({ mcRuns: data ?? [], isLoadingRuns: false });
    } catch {
      set({ isLoadingRuns: false });
    }
  },

  clearResults: () => set({ results: null, currentRunId: null }),
  clearError: () => set({ error: null }),
}));
