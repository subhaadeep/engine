import { apiClient } from './client';
import type { GASession, OHLCVSession, ImportStatus } from '../types';

export async function uploadGAResults(file: File): Promise<GASession> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<GASession>('/import/ga-results', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadOHLCV(file: File): Promise<OHLCVSession> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<OHLCVSession>('/import/ohlcv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getImportStatus(): Promise<ImportStatus> {
  const { data } = await apiClient.get<ImportStatus>('/import/status');
  return data;
}
