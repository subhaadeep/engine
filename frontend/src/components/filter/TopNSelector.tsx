import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useFilterStore } from '../../store/filterStore';

const PRESETS = [10, 20, 50, 100];

const TopNSelector: React.FC = () => {
  const { topN, setTopN, rankBy, setRankBy, rankOrder, setRankOrder, columnRanges } = useFilterStore();

  const handlePreset = (n: number) => setTopN(n);

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) setTopN(val);
  };

  const isCustom = !PRESETS.includes(topN);

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha('#1A2236', 0.9)} 0%, ${alpha('#111827', 0.8)} 100%)`,
        border: '1px solid rgba(45,55,72,0.5)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* Top N presets */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'block',
            mb: 1,
          }}
        >
          Top N Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {PRESETS.map((n) => (
            <Button
              key={n}
              variant={topN === n ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePreset(n)}
              sx={{
                minWidth: 44,
                px: 1.5,
                py: 0.5,
                fontSize: '0.8rem',
                fontWeight: 700,
                ...(topN === n
                  ? {}
                  : {
                      borderColor: 'rgba(45,55,72,0.7)',
                      color: '#94A3B8',
                      '&:hover': { borderColor: '#6366F1', color: '#818CF8' },
                    }),
              }}
            >
              {n}
            </Button>
          ))}
          {/* Custom input */}
          <TextField
            type="number"
            size="small"
            value={isCustom ? topN : ''}
            onChange={handleCustom}
            placeholder="Custom"
            inputProps={{ min: 1, max: 10000, style: { fontSize: '0.8rem', padding: '4px 8px', width: 60 } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderColor: isCustom ? '#6366F1' : 'rgba(45,55,72,0.7)',
                backgroundColor: isCustom ? alpha('#6366F1', 0.08) : 'transparent',
              },
            }}
          />
        </Box>
      </Box>

      {/* Rank By */}
      <Box sx={{ minWidth: 200 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'block',
            mb: 1,
          }}
        >
          Rank By
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Column</InputLabel>
          <Select
            value={rankBy}
            label="Column"
            onChange={(e) => setRankBy(e.target.value)}
            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
          >
            {columnRanges.map((col) => (
              <MenuItem key={col.name} value={col.name}>
                <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {col.name}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Sort Order */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'block',
            mb: 1,
          }}
        >
          Order
        </Typography>
        <ToggleButtonGroup
          value={rankOrder}
          exclusive
          onChange={(_, val) => { if (val) setRankOrder(val); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(45,55,72,0.7)',
              color: '#94A3B8',
              px: 1.5,
              py: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha('#6366F1', 0.15),
                color: '#818CF8',
                borderColor: alpha('#6366F1', 0.4),
              },
            },
          }}
        >
          <ToggleButton value="desc">
            <ArrowDownward sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>DESC</Typography>
          </ToggleButton>
          <ToggleButton value="asc">
            <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>ASC</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default TopNSelector;
