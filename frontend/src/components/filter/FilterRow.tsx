import React from 'react';
import {
  Box, Typography, Slider, Switch, TextField, alpha, useMediaQuery, useTheme,
} from '@mui/material';
import type { ColumnRange, FilterRule } from '../../types';

interface FilterRowProps {
  column: ColumnRange;
  rule: FilterRule;
  onChange: (rule: FilterRule) => void;
}

const FilterRow: React.FC<FilterRowProps> = ({ column, rule, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isNumeric = column.dtype !== 'string';
  const minVal = column.min_val ?? 0;
  const maxVal = column.max_val ?? 1;
  const range: [number, number] = [rule.min_val ?? minVal, rule.max_val ?? maxVal];

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: `1px solid ${rule.enabled ? alpha('#6366F1', 0.3) : alpha('#2D3748', 0.5)}`,
        backgroundColor: rule.enabled ? alpha('#6366F1', 0.04) : alpha('#111827', 0.5),
        transition: 'all 0.2s',
        opacity: rule.enabled ? 1 : 0.6,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: rule.enabled && isNumeric ? 1.5 : 0 }}>
        <Typography
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            fontWeight: 600,
            color: rule.enabled ? '#F1F5F9' : '#64748B',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            mr: 1,
          }}
        >
          {column.name}
        </Typography>
        <Switch
          size="small"
          checked={rule.enabled}
          onChange={(e) => onChange({ ...rule, enabled: e.target.checked })}
          sx={{ flexShrink: 0 }}
        />
      </Box>

      {rule.enabled && isNumeric && (
        <Box>
          <Slider
            value={range}
            min={minVal}
            max={maxVal}
            step={(maxVal - minVal) / 100 || 0.01}
            onChange={(_, v) => {
              const [lo, hi] = v as number[];
              onChange({ ...rule, min_val: lo, max_val: hi });
            }}
            size="small"
            sx={{ color: '#6366F1', mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Min"
              type="number"
              value={rule.min_val ?? ''}
              onChange={(e) => onChange({ ...rule, min_val: Number(e.target.value) })}
              sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              size="small"
              label="Max"
              type="number"
              value={rule.max_val ?? ''}
              onChange={(e) => onChange({ ...rule, max_val: Number(e.target.value) })}
              sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FilterRow;
