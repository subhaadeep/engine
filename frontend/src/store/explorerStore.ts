import { create } from 'zustand';
import type { FilterResultRow } from '../types';

interface ExplorerState {
  selectedRow: FilterResultRow | null;
  setSelectedRow: (row: FilterResultRow | null) => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  selectedRow: null,
  setSelectedRow: (row) => set({ selectedRow: row }),
}));
