import { create } from 'zustand';
import type { ColumnRange, FilterRule, FilterResultRow } from '../types';
import { getColumnRanges, applyFilters } from '../api/filterApi';

interface FilterState {
  columnRanges: ColumnRange[];
  filterRules: Record<string, FilterRule>;
  topN: number;
  rankBy: string;
  rankOrder: 'asc' | 'desc';
  filteredResults: FilterResultRow[];
  totalMatching: number;
  isLoadingRanges: boolean;
  isLoadingFilter: boolean;
  errorRanges: string | null;
  errorFilter: string | null;
  searchTerm: string;

  fetchColumnRanges: (sessionId: number) => Promise<void>;
  setFilterRule: (column: string, rule: FilterRule) => void;
  setAllEnabled: (enabled: boolean) => void;
  setTopN: (n: number) => void;
  setRankBy: (col: string) => void;
  setRankOrder: (order: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  applyFilters: (sessionId: number) => Promise<void>;
  clearResults: () => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  columnRanges: [],
  filterRules: {},
  topN: 20,
  rankBy: '',
  rankOrder: 'desc',
  filteredResults: [],
  totalMatching: 0,
  isLoadingRanges: false,
  isLoadingFilter: false,
  errorRanges: null,
  errorFilter: null,
  searchTerm: '',

  fetchColumnRanges: async (sessionId: number) => {
    set({ isLoadingRanges: true, errorRanges: null });
    try {
      const ranges = await getColumnRanges(sessionId);
      const rules: Record<string, FilterRule> = {};
      ranges.forEach((r) => {
        rules[r.name] = { enabled: false, min_val: r.min_val, max_val: r.max_val };
      });
      const defaultRankBy = ranges.length > 0 ? ranges[0].name : '';
      set({
        columnRanges: ranges,
        filterRules: rules,
        rankBy: get().rankBy || defaultRankBy,
        isLoadingRanges: false,
      });
    } catch (err) {
      set({
        errorRanges: err instanceof Error ? err.message : 'Failed to load column ranges',
        isLoadingRanges: false,
      });
    }
  },

  setFilterRule: (column: string, rule: FilterRule) => {
    set((state) => ({
      filterRules: { ...state.filterRules, [column]: rule },
    }));
  },

  setAllEnabled: (enabled: boolean) => {
    set((state) => {
      const updated: Record<string, FilterRule> = {};
      for (const key of Object.keys(state.filterRules)) {
        updated[key] = { ...state.filterRules[key], enabled };
      }
      return { filterRules: updated };
    });
  },

  setTopN: (n: number) => set({ topN: n }),
  setRankBy: (col: string) => set({ rankBy: col }),
  setRankOrder: (order: 'asc' | 'desc') => set({ rankOrder: order }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  applyFilters: async (sessionId: number) => {
    set({ isLoadingFilter: true, errorFilter: null });
    const { filterRules, topN, rankBy, rankOrder } = get();
    try {
      const response = await applyFilters({
        session_id: sessionId,
        columns: filterRules,
        top_n: topN,
        rank_by: rankBy,
        rank_order: rankOrder,
      });
      set({
        filteredResults: response.results,
        totalMatching: response.total_matching,
        isLoadingFilter: false,
      });
    } catch (err) {
      set({
        errorFilter: err instanceof Error ? err.message : 'Filter failed',
        isLoadingFilter: false,
      });
    }
  },

  clearResults: () => set({ filteredResults: [], totalMatching: 0 }),
}));
