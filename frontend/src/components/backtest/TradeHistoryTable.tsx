import React, { useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  alpha,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import type { Trade } from '../../types';
import Plotly from 'plotly.js-dist-min';

interface TradeHistoryTableProps {
  trades: Trade[];
  totalTrades: number;
}

function formatDate(d: string): string {
  return d ? new Date(d).toLocaleDateString() : '—';
}

function formatPrice(n: number): string {
  return n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) ?? '—';
}

function formatProfit(n: number): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COLS = [
  { key: 'trade_no', label: '#', width: 50 },
  { key: 'entry_date', label: 'Entry Date', width: 100 },
  { key: 'exit_date', label: 'Exit Date', width: 100 },
  { key: 'direction', label: 'Direction', width: 90 },
  { key: 'entry_price', label: 'Entry', width: 110 },
  { key: 'exit_price', label: 'Exit', width: 110 },
  { key: 'profit', label: 'Profit', width: 100 },
  { key: 'balance', label: 'Balance', width: 110 },
];

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades, totalTrades }) => {
  const sparklineRef = useRef<HTMLDivElement>(null);

  const balanceData = useMemo(() => trades.map((t) => t.balance), [trades]);
  const profitData = useMemo(() => trades.map((t) => t.profit), [trades]);

  const totalProfit = useMemo(() => profitData.reduce((s, v) => s + v, 0), [profitData]);
  const winCount = useMemo(() => profitData.filter((p) => p > 0).length, [profitData]);
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  // Sparkline
  useEffect(() => {
    if (!sparklineRef.current || balanceData.length === 0) return;
    const color = totalProfit >= 0 ? '#10B981' : '#EF4444';
    Plotly.newPlot(
      sparklineRef.current,
      [
        {
          x: balanceData.map((_, i) => i),
          y: balanceData,
          type: 'scatter',
          mode: 'lines',
          line: { color, width: 2, shape: 'spline' },
          fill: 'tozeroy',
          fillcolor: `${color}18`,
        },
      ],
      {
        height: 80,
        margin: { t: 0, r: 0, b: 0, l: 0 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: { visible: false },
        showlegend: false,
      },
      { displayModeBar: false, responsive: true }
    );
    return () => {
      if (sparklineRef.current) Plotly.purge(sparklineRef.current);
    };
  }, [balanceData, totalProfit]);

  const handleExportCSV = () => {
    const headers = COLS.map((c) => c.label).join(',');
    const rows = trades.map((t) =>
      [t.trade_no, t.entry_date, t.exit_date, t.direction, t.entry_price, t.exit_price, t.profit, t.balance].join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header + Summary */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#F1F5F9' }}>
            Trade History
          </Typography>
          <Chip label={`${totalTrades} trades`} size="small" color="primary" />
          <Chip
            label={`W/R: ${winRate.toFixed(1)}%`}
            size="small"
            color={winRate >= 50 ? 'success' : 'warning'}
          />
          <Chip
            label={`P/L: ${formatProfit(totalProfit)}`}
            size="small"
            color={totalProfit >= 0 ? 'success' : 'error'}
          />
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download sx={{ fontSize: 16 }} />}
          onClick={handleExportCSV}
          sx={{ fontSize: '0.75rem' }}
          disabled={trades.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Sparkline equity curve */}
      {balanceData.length > 0 && (
        <Box
          sx={{
            borderRadius: 1.5,
            overflow: 'hidden',
            border: `1px solid ${alpha('#2D3748', 0.5)}`,
            backgroundColor: alpha('#111827', 0.5),
          }}
        >
          <Box ref={sparklineRef} />
        </Box>
      )}

      {/* Table */}
      <Box
        sx={{
          border: `1px solid ${alpha('#2D3748', 0.5)}`,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: alpha('#111827', 0.7),
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1,
            backgroundColor: alpha('#1A2236', 0.9),
            borderBottom: `1px solid ${alpha('#2D3748', 0.5)}`,
          }}
        >
          {COLS.map((col) => (
            <Box key={col.key} sx={{ width: col.width, flexShrink: 0, px: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {col.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Table Rows */}
        <Box
          sx={{
            maxHeight: 420,
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' },
          }}
        >
          {trades.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                No trades to display
              </Typography>
            </Box>
          ) : (
            trades.map((trade, idx) => (
              <Box
                key={trade.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.75,
                  borderBottom: `1px solid ${alpha('#2D3748', 0.25)}`,
                  backgroundColor: idx % 2 === 0 ? 'transparent' : alpha('#1A2236', 0.3),
                  '&:hover': { backgroundColor: alpha('#6366F1', 0.05) },
                  transition: 'background-color 0.15s',
                }}
              >
                {/* # */}
                <Box sx={{ width: 50, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                    {trade.trade_no}
                  </Typography>
                </Box>
                {/* Entry Date */}
                <Box sx={{ width: 100, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {formatDate(trade.entry_date)}
                  </Typography>
                </Box>
                {/* Exit Date */}
                <Box sx={{ width: 100, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {formatDate(trade.exit_date)}
                  </Typography>
                </Box>
                {/* Direction */}
                <Box sx={{ width: 90, flexShrink: 0, px: 0.5 }}>
                  <Chip
                    label={trade.direction?.toUpperCase() ?? '—'}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor:
                        trade.direction === 'long'
                          ? alpha('#6366F1', 0.15)
                          : alpha('#F59E0B', 0.15),
                      color: trade.direction === 'long' ? '#818CF8' : '#F59E0B',
                      border: `1px solid ${trade.direction === 'long' ? alpha('#6366F1', 0.3) : alpha('#F59E0B', 0.3)}`,
                    }}
                  />
                </Box>
                {/* Entry Price */}
                <Box sx={{ width: 110, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#F1F5F9', fontFamily: 'monospace' }}>
                    {formatPrice(trade.entry_price)}
                  </Typography>
                </Box>
                {/* Exit Price */}
                <Box sx={{ width: 110, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#F1F5F9', fontFamily: 'monospace' }}>
                    {formatPrice(trade.exit_price)}
                  </Typography>
                </Box>
                {/* Profit */}
                <Box sx={{ width: 100, flexShrink: 0, px: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: trade.profit >= 0 ? '#10B981' : '#EF4444',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatProfit(trade.profit)}
                  </Typography>
                </Box>
                {/* Balance */}
                <Box sx={{ width: 110, flexShrink: 0, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                    {formatPrice(trade.balance)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TradeHistoryTable;
