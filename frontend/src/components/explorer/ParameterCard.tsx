import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Collapse,
  Grid,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  ExpandLess,
  EmojiEvents,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useExplorerStore } from '../../store/explorerStore';
import { useBacktestStore } from '../../store/backtestStore';
import type { FilterResultRow } from '../../types';

interface ParameterCardProps {
  row: FilterResultRow;
  index: number;
}

const KEY_METRICS = ['NetProfit', 'net_profit', 'Drawdown', 'max_drawdown', 'WinRate', 'win_rate', 'ProfitFactor', 'profit_factor'];

function formatValue(val: number | string): string {
  if (typeof val === 'number') {
    if (Math.abs(val) > 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(2);
    return val.toFixed(2);
  }
  return String(val);
}

function getMetricColor(key: string, val: number | string): string {
  const lk = key.toLowerCase();
  if (lk.includes('profit') || lk.includes('return')) {
    return typeof val === 'number' && val < 0 ? '#EF4444' : '#10B981';
  }
  if (lk.includes('drawdown')) return '#F59E0B';
  if (lk.includes('win')) return '#6366F1';
  return '#94A3B8';
}

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

const ParameterCard: React.FC<ParameterCardProps> = ({ row, index }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { setSelectedRow } = useExplorerStore();
  const { setSelectedParameterRow } = useBacktestStore();

  const metricKeys = Object.keys(row.data).filter((k) =>
    KEY_METRICS.some((m) => k.toLowerCase() === m.toLowerCase())
  );

  const otherKeys = Object.keys(row.data).filter(
    (k) => !metricKeys.some((m) => m.toLowerCase() === k.toLowerCase())
  );

  const handleRunBacktest = () => {
    setSelectedRow(row);
    setSelectedParameterRow(row);
    navigate('/backtest');
  };

  const rankColor = RANK_COLORS[row.rank - 1] || '#6366F1';
  const rankLabel = RANK_LABELS[row.rank - 1] || `#${row.rank}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <Box
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha('#1A2236', 0.95)} 0%, ${alpha('#111827', 0.9)} 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha('#2D3748', 0.7)}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha('#6366F1', 0.4),
            boxShadow: `0 8px 32px ${alpha('#000', 0.5)}, 0 0 0 1px ${alpha('#6366F1', 0.1)}`,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha('#2D3748', 0.4)}`,
            background: `linear-gradient(90deg, ${alpha(rankColor, 0.08)} 0%, transparent 60%)`,
          }}
        >
          {/* Rank badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${rankColor}22, ${rankColor}44)`,
                border: `1px solid ${rankColor}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {row.rank <= 3 ? (
                <EmojiEvents sx={{ fontSize: 18, color: rankColor }} />
              ) : (
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: rankColor }}>
                  #{row.rank}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: alpha(rankColor, 0.8),
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {rankLabel} Place
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                Rank #{row.rank}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Key Metrics */}
        <Box sx={{ px: 2.5, py: 2 }}>
          {metricKeys.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              {metricKeys.map((key) => {
                const val = row.data[key];
                const color = getMetricColor(key, val);
                return (
                  <Chip
                    key={key}
                    label={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Typography component="span" sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                          {key.replace(/_/g, ' ')}:
                        </Typography>
                        <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 700, color }}>
                          {formatValue(val)}
                        </Typography>
                      </Box>
                    }
                    size="small"
                    sx={{
                      height: 24,
                      backgroundColor: alpha(color, 0.1),
                      border: `1px solid ${alpha(color, 0.25)}`,
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              {Object.entries(row.data).slice(0, 4).map(([key, val]) => (
                <Chip
                  key={key}
                  label={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Typography component="span" sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                        {key}:
                      </Typography>
                      <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#F1F5F9' }}>
                        {formatValue(val)}
                      </Typography>
                    </Box>
                  }
                  size="small"
                  sx={{ height: 24, backgroundColor: alpha('#2D3748', 0.6), border: `1px solid ${alpha('#2D3748', 0.8)}` }}
                />
              ))}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
              onClick={handleRunBacktest}
              sx={{ flex: 1, py: 0.75, fontSize: '0.78rem' }}
            >
              Run Backtest
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
              onClick={() => setExpanded(!expanded)}
              sx={{ px: 1.5, py: 0.75, fontSize: '0.78rem', minWidth: 'auto' }}
            >
              Details
            </Button>
          </Box>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderTop: `1px solid ${alpha('#2D3748', 0.4)}`,
              backgroundColor: alpha('#0A0E1A', 0.4),
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                display: 'block',
                mb: 1.5,
              }}
            >
              All Parameters ({Object.keys(row.data).length})
            </Typography>
            <Grid container spacing={1}>
              {[...metricKeys, ...otherKeys].map((key) => (
                <Grid item xs={6} key={key}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.4,
                      px: 0.5,
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: alpha('#2D3748', 0.3) },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: '#64748B',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '55%',
                      }}
                      title={key}
                    >
                      {key}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: getMetricColor(key, row.data[key]),
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatValue(row.data[key])}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Box>
    </motion.div>
  );
};

export default ParameterCard;
