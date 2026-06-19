import { apiClient } from './client';
import type { MonteCarloRequest, MCRunResponse, MCResults } from '../types';

export async function runMonteCarlo(req: MonteCarloRequest): Promise<MCRunResponse> {
  const { data } = await apiClient.post<MCRunResponse>('/montecarlo/run', req);
  return data;
}

export async function getMCResults(runId: string): Promise<MCResults> {
  const { data } = await apiClient.get<MCResults>(`/montecarlo/results/${runId}`);
  return data;
}

export async function listMCRuns(backtestId: string | number): Promise<MCResults[]> {
  const { data } = await apiClient.get<MCResults[]>(`/montecarlo/runs/${backtestId}`);
  return data;
}
