import { apiClient } from './client';
import type { MonteCarloRequest, MCRunResponse, MCResults } from '../types';

export async function runMonteCarlo(req: MonteCarloRequest): Promise<MCRunResponse> {
  const { data } = await apiClient.post<{ run_id: number; backtest_id: number; n_simulations: number }>(
    '/montecarlo/run',
    req
  );
  return { run_id: data.run_id, status: 'done' };
}

export async function getMCResults(runId: number): Promise<MCResults> {
  const { data } = await apiClient.get<MCResults>(`/montecarlo/results/${runId}`);
  return data;
}

export async function listMCRuns(backtestId: number) {
  const { data } = await apiClient.get(`/montecarlo/runs/${backtestId}`);
  return data;
}
