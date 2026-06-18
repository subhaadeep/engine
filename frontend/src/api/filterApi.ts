import { apiClient } from './client';
import type { ColumnRange, FilterConfig, FilterResponse } from '../types';

export async function getColumnRanges(sessionId: number): Promise<ColumnRange[]> {
  const { data } = await apiClient.get<{ session_id: number; columns: ColumnRange[] }>(
    `/filter/columns?session_id=${sessionId}`
  );
  return data.columns;
}

export async function applyFilters(config: FilterConfig): Promise<FilterResponse> {
  const { data } = await apiClient.post<FilterResponse>('/filter/apply', config);
  return data;
}
