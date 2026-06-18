import { apiClient } from './client';
import type { Strategy, BacktestRunRequest, BacktestResult, TradesResponse } from '../types';

export async function uploadStrategy(file: File): Promise<Strategy> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ strategy_id: number; filename: string }>(
    '/backtest/upload-strategy',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return { id: data.strategy_id, filename: data.filename };
}

export async function listStrategies(): Promise<Strategy[]> {
  const { data } = await apiClient.get<Array<{ id: number; filename: string; created_at: string }>>(
    '/backtest/strategies'
  );
  return data.map((s) => ({ id: s.id, filename: s.filename, created_at: s.created_at }));
}

export async function getStrategySource(strategyId: number): Promise<{ strategy_id: number; filename: string; content: string }> {
  const { data } = await apiClient.get(`/backtest/strategies/${strategyId}/source`);
  return data;
}

export async function runBacktest(req: BacktestRunRequest): Promise<BacktestResult> {
  const { data } = await apiClient.post<BacktestResult>('/backtest/run', req);
  return data;
}

export async function getTrades(
  backtestId: number,
  page = 1,
  limit = 100
): Promise<TradesResponse> {
  const { data } = await apiClient.get<TradesResponse>(
    `/backtest/trades/${backtestId}?page=${page}&limit=${limit}`
  );
  return data;
}

export async function getBacktest(backtestId: number) {
  const { data } = await apiClient.get(`/backtest/${backtestId}`);
  return data;
}

export async function listBacktests(limit = 50) {
  const { data } = await apiClient.get(`/backtest/list?limit=${limit}`);
  return data;
}
