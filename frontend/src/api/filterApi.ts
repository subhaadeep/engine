import { apiClient } from './client';
import type { ColumnRange, FilterConfig, FilterResponse } from '../types';

export async function getColumnRanges(sessionId: number): Promise<ColumnRange[]> {
  const { data } = await apiClient.get<ColumnRange[]>(`/filter/column-ranges/${sessionId}`);
  return data;
}

export async function applyFilters(config: FilterConfig): Promise<FilterResponse> {
  const { data } = await apiClient.post<FilterResponse>('/filter/apply', config);
  return data;
}
