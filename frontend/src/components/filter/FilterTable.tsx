import React, { useMemo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  alpha,
} from '@mui/material';
import { Search, SelectAll, Deselect } from '@mui/icons-material';
import { useFilterStore } from '../../store/filterStore';
import FilterRow from './FilterRow';
import type { FilterRule } from '../../types';

const ROW_HEIGHT = 56;
const TABLE_HEIGHT = 420;

const FilterTable: React.FC = () => {
  const {
    columnRanges,
    filterRules,
    searchTerm,
    setFilterRule,
    setAllEnabled,
    setSearchTerm,
  } = useFilterStore();

  const filteredRanges = useMemo(() => {
    if (!searchTerm.trim()) return columnRanges;
    const lower = searchTerm.toLowerCase();
    return columnRanges.filter((r) => r.name.toLowerCase().includes(lower));
  }, [columnRanges, searchTerm]);

  const enabledCount = useMemo(
    () => Object.values(filterRules).filter((r) => r.enabled).length,
    [filterRules]
  );

  const handleRuleChange = useCallback(
    (column: string, rule: FilterRule) => {
      setFilterRule(column, rule);
    },
    [setFilterRule]
  );

  const renderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const range = filteredRanges[index];
      const rule = filterRules[range.name] ?? { enabled: false, min_val: null, max_val: null };
      return (
        <FilterRow
          key={range.name}
          columnRange={range}
          rule={rule}
          onChange={(r) => handleRuleChange(range.name, r)}
          style={style}
        />
      );
    },
    [filteredRanges, filterRules, handleRuleChange]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search parameters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 16, color: '#64748B' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 260 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SelectAll sx={{ fontSize: 16 }} />}
            onClick={() => setAllEnabled(true)}
            sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem' }}
          >
            Enable All
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Deselect sx={{ fontSize: 16 }} />}
            onClick={() => setAllEnabled(false)}
            sx={{
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              borderColor: 'rgba(45,55,72,0.7)',
              color: '#94A3B8',
              '&:hover': { borderColor: '#94A3B8' },
            }}
          >
            Disable All
          </Button>
        </Box>

        <Box sx={{ ml: 'auto' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
            <Box component="span" sx={{ color: '#818CF8', fontWeight: 700 }}>
              {enabledCount}
            </Box>
            {' '}/ {columnRanges.length} filters active
            {searchTerm && (
              <Box component="span" sx={{ color: '#64748B' }}>
                {' '}· {filteredRanges.length} shown
              </Box>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          gap: 1.5,
          borderRadius: '8px 8px 0 0',
          backgroundColor: alpha('#1A2236', 0.8),
          border: '1px solid rgba(45,55,72,0.5)',
          borderBottom: 'none',
        }}
      >
        <Box sx={{ width: 48, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Enable
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Parameter
          </Typography>
        </Box>
        <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Min Bound
          </Typography>
        </Box>
        <Box sx={{ width: 110, flexShrink: 0, textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Max Bound
          </Typography>
        </Box>
      </Box>

      {/* Virtualized List */}
      <Box
        sx={{
          border: '1px solid rgba(45,55,72,0.5)',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          backgroundColor: alpha('#111827', 0.7),
        }}
      >
        {filteredRanges.length === 0 ? (
          <Box
            sx={{
              height: TABLE_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Search sx={{ fontSize: 40, color: '#2D3748' }} />
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {searchTerm ? 'No parameters match your search' : 'No column ranges loaded'}
            </Typography>
          </Box>
        ) : (
          <FixedSizeList
            height={TABLE_HEIGHT}
            width="100%"
            itemSize={ROW_HEIGHT}
            itemCount={filteredRanges.length}
            overscanCount={10}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </Box>
    </Box>
  );
};

export default FilterTable;
