import React, { useCallback } from 'react';
import { Box, Typography, Switch, TextField, alpha } from '@mui/material';
import type { ColumnRange, FilterRule } from '../../types';

interface FilterRowProps {
  columnRange: ColumnRange;
  rule: FilterRule;
  onChange: (rule: FilterRule) => void;
  style: React.CSSProperties;
}

const FilterRow: React.FC<FilterRowProps> = ({ columnRange, rule, onChange, style }) => {
  const handleToggle = useCallback(() => {
    onChange({ ...rule, enabled: !rule.enabled });
  }, [rule, onChange]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      onChange({ ...rule, min_val: val });
    },
    [rule, onChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      onChange({ ...rule, max_val: val });
    },
    [rule, onChange]
  );

  return (
    <Box
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 1.5,
        opacity: rule.enabled ? 1 : 0.45,
        transition: 'opacity 0.2s ease, background-color 0.2s ease',
        borderBottom: '1px solid rgba(45,55,72,0.3)',
        backgroundColor: rule.enabled ? alpha('#6366F1', 0.03) : 'transparent',
        '&:hover': {
          backgroundColor: alpha('#6366F1', 0.05),
        },
      }}
    >
      {/* Toggle */}
      <Switch
        size="small"
        checked={rule.enabled}
        onChange={handleToggle}
        sx={{ flexShrink: 0 }}
      />

      {/* Parameter Name */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '0.78rem',
            fontWeight: 500,
            color: rule.enabled ? '#F1F5F9' : '#64748B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}
          title={columnRange.name}
        >
          {columnRange.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
          {columnRange.dtype} · [{columnRange.min_val.toFixed(2)}, {columnRange.max_val.toFixed(2)}]
        </Typography>
      </Box>

      {/* Min Input */}
      <TextField
        type="number"
        size="small"
        value={rule.min_val ?? ''}
        onChange={handleMinChange}
        disabled={!rule.enabled}
        placeholder={`${columnRange.min_val}`}
        inputProps={{
          style: { fontSize: '0.78rem', padding: '4px 8px', textAlign: 'right' },
          step: 'any',
        }}
        sx={{
          width: 110,
          flexShrink: 0,
          pointerEvents: rule.enabled ? 'auto' : 'none',
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#0A0E1A', 0.6),
            '& input': { color: '#10B981' },
          },
        }}
        label="Min"
      />

      {/* Max Input */}
      <TextField
        type="number"
        size="small"
        value={rule.max_val ?? ''}
        onChange={handleMaxChange}
        disabled={!rule.enabled}
        placeholder={`${columnRange.max_val}`}
        inputProps={{
          style: { fontSize: '0.78rem', padding: '4px 8px', textAlign: 'right' },
          step: 'any',
        }}
        sx={{
          width: 110,
          flexShrink: 0,
          pointerEvents: rule.enabled ? 'auto' : 'none',
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#0A0E1A', 0.6),
            '& input': { color: '#EF4444' },
          },
        }}
        label="Max"
      />
    </Box>
  );
};

export default React.memo(FilterRow);
