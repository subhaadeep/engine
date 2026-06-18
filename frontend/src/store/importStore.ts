import { create } from 'zustand';
import type { GASession, OHLCVSession, ImportStatus } from '../types';
import { uploadGAResults, uploadOHLCV, getImportStatus } from '../api/importApi';

interface ImportState {
  gaSession: GASession | null;
  ohlcvSession: OHLCVSession | null;
  importStatus: ImportStatus | null;
  isLoadingGA: boolean;
  isLoadingOHLCV: boolean;
  isLoadingStatus: boolean;
  errorGA: string | null;
  errorOHLCV: string | null;
  uploadGA: (file: File) => Promise<void>;
  uploadOHLCV: (file: File) => Promise<void>;
  fetchStatus: () => Promise<void>;
  clearErrorGA: () => void;
  clearErrorOHLCV: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  gaSession: null,
  ohlcvSession: null,
  importStatus: null,
  isLoadingGA: false,
  isLoadingOHLCV: false,
  isLoadingStatus: false,
  errorGA: null,
  errorOHLCV: null,

  uploadGA: async (file: File) => {
    set({ isLoadingGA: true, errorGA: null });
    try {
      const session = await uploadGAResults(file);
      set({ gaSession: session, isLoadingGA: false });
    } catch (err) {
      set({
        errorGA: err instanceof Error ? err.message : 'Upload failed',
        isLoadingGA: false,
      });
    }
  },

  uploadOHLCV: async (file: File) => {
    set({ isLoadingOHLCV: true, errorOHLCV: null });
    try {
      const session = await uploadOHLCV(file);
      set({ ohlcvSession: session, isLoadingOHLCV: false });
    } catch (err) {
      set({
        errorOHLCV: err instanceof Error ? err.message : 'Upload failed',
        isLoadingOHLCV: false,
      });
    }
  },

  fetchStatus: async () => {
    set({ isLoadingStatus: true });
    try {
      const status = await getImportStatus();
      set({ importStatus: status, isLoadingStatus: false });
    } catch {
      set({ isLoadingStatus: false });
    }
  },

  clearErrorGA: () => set({ errorGA: null }),
  clearErrorOHLCV: () => set({ errorOHLCV: null }),
}));
