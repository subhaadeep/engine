import { apiClient } from './client';
import type { Strategy, BacktestRequest, BacktestResult, TradesResponse } from '../types';

export async function uploadStrategy(file: File): Promise<Strategy> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<Strategy>('/backtest/strategy', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listStrategies(): Promise<Strategy[]> {
  const { data } = await apiClient.get<Strategy[]>('/backtest/strategies');
  return data;
}

export async function runBacktest(req: BacktestRequest): Promise<BacktestResult> {
  const { data } = await apiClient.post<BacktestResult>('/backtest/run', req);
  return data;
}

export async function getTrades(
  backtestId: number,
  page = 1,
  limit = 100
): Promise<TradesResponse> {
  const { data } = await apiClient.get<TradesResponse>(
    `/backtest/${backtestId}/trades?page=${page}&limit=${limit}`
  );
  return data;
}
