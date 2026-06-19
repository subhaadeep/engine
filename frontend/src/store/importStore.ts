import { create } from 'zustand';
import { apiClient } from '../api/client';

interface GASession {
  session_id: string;
  filename: string;
  row_count: number;
  columns: string[];
}

interface OHLCVSession {
  session_id: string;
  filename: string;
  row_count: number;
  date_from?: string;
  date_to?: string;
}

interface ImportStatus {
  ga_session_id: string | null;
  ga_filename: string | null;
  ohlcv_session_id: string | null;
  ohlcv_filename: string | null;
  ready: boolean;
}

interface ImportStore {
  gaSession: GASession | null;
  ohlcvSession: OHLCVSession | null;
  importStatus: ImportStatus | null;
  isLoadingGA: boolean;
  isLoadingOHLCV: boolean;
  errorGA: string | null;
  errorOHLCV: string | null;
  uploadGA: (file: File) => Promise<void>;
  uploadOHLCV: (file: File) => Promise<void>;
  fetchStatus: () => Promise<void>;
  clearErrorGA: () => void;
  clearErrorOHLCV: () => void;
  setGASession: (s: any) => void;
  setOHLCVSession: (s: any) => void;
}

export const useImportStore = create<ImportStore>((set, get) => ({
  gaSession: null,
  ohlcvSession: null,
  importStatus: null,
  isLoadingGA: false,
  isLoadingOHLCV: false,
  errorGA: null,
  errorOHLCV: null,

  setGASession: (s) => set({ gaSession: s }),
  setOHLCVSession: (s) => set({ ohlcvSession: s }),

  fetchStatus: async () => {
    try {
      const res = await apiClient.get('/import/status');
      set({ importStatus: res.data });
      if (res.data.ga_session_id) {
        set({
          gaSession: {
            session_id: res.data.ga_session_id,
            filename: res.data.ga_filename,
            row_count: 0,
            columns: [],
          },
        });
      }
      if (res.data.ohlcv_session_id) {
        set({
          ohlcvSession: {
            session_id: res.data.ohlcv_session_id,
            filename: res.data.ohlcv_filename,
            row_count: 0,
          },
        });
      }
    } catch (e) { console.error('fetchStatus failed', e); }
  },

  uploadGA: async (file: File) => {
    set({ isLoadingGA: true, errorGA: null });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/import/ga', fd);
      set({ gaSession: res.data, isLoadingGA: false });
    } catch (e: any) {
      set({ errorGA: e?.response?.data?.detail ?? 'Upload failed', isLoadingGA: false });
    }
  },

  uploadOHLCV: async (file: File) => {
    set({ isLoadingOHLCV: true, errorOHLCV: null });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/import/ohlcv', fd);
      set({ ohlcvSession: res.data, isLoadingOHLCV: false });
    } catch (e: any) {
      set({ errorOHLCV: e?.response?.data?.detail ?? 'Upload failed', isLoadingOHLCV: false });
    }
  },

  clearErrorGA: () => set({ errorGA: null }),
  clearErrorOHLCV: () => set({ errorOHLCV: null }),
}));
