import { apiClient } from './client';
import type { GASession, OHLCVSession, ImportStatus } from '../types';

export async function uploadGAResults(file: File): Promise<GASession> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<GASession>('/import/ga-results', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadOHLCV(file: File): Promise<OHLCVSession> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<OHLCVSession>('/import/ohlcv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getImportStatus(): Promise<ImportStatus> {
  const { data } = await apiClient.get<ImportStatus>('/import/status');
  return data;
}
