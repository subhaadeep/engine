import { apiClient } from './client';
import type {
  Strategy, BacktestRunRequest, BacktestResult,
  TradesResponse, BacktestListItem,
} from '../types';

export async function uploadStrategy(file: File): Promise<Strategy> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<Strategy>('/backtest/upload-strategy', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listStrategies(): Promise<Strategy[]> {
  const { data } = await apiClient.get<Strategy[]>('/backtest/strategies');
  return data;
}

export async function runBacktest(req: BacktestRunRequest): Promise<BacktestResult> {
  const { data } = await apiClient.post<BacktestResult>('/backtest/run', req);
  return data;
}

export async function getBacktestTrades(
  backtestId: string | number,
  page = 1,
  limit = 100
): Promise<TradesResponse> {
  const { data } = await apiClient.get<TradesResponse>(
    `/backtest/trades/${backtestId}?page=${page}&limit=${limit}`
  );
  return data;
}

export async function listBacktests(): Promise<BacktestListItem[]> {
  const { data } = await apiClient.get<BacktestListItem[]>('/backtest/list');
  return data;
}

export async function getStrategySource(strategyId: string | number): Promise<{ source: string }> {
  const { data } = await apiClient.get<{ source: string }>(`/backtest/strategy/${strategyId}/source`);
  return data;
}
