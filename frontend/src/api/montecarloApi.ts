import { apiClient } from './client';
import type { MonteCarloRequest, MCRunResponse, MCResults } from '../types';

export async function runMonteCarlo(req: MonteCarloRequest): Promise<MCRunResponse> {
  const { data } = await apiClient.post<MCRunResponse>('/montecarlo/run', req);
  return data;
}

export async function getMCResults(runId: number): Promise<MCResults> {
  const { data } = await apiClient.get<MCResults>(`/montecarlo/results/${runId}`);
  return data;
}
