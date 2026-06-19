import { apiClient } from './client';
import type { ColumnRange, FilterConfig, FilterResponse } from '../types';

export async function getFilterColumns(sessionId: string): Promise<ColumnRange[]> {
  const { data } = await apiClient.get<{ session_id: string; columns: ColumnRange[] }>(
    `/filter/columns?session_id=${sessionId}`
  );
  return data.columns;
}

export async function applyFilter(config: FilterConfig): Promise<FilterResponse> {
  const { data } = await apiClient.post<FilterResponse>('/filter/apply', config);
  return data;
}
