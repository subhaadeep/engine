import React, { useEffect, useRef } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import Plotly from 'plotly.js-dist-min';
import type { MCResults } from '../../types';

interface EquityCurveChartProps {
  results: MCResults;
}

const ACCENT = '#6366F1';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';
const WARNING = '#F59E0B';

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ results }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !results) return;

    const { x: packedX, y: packedY } = results.equity_curves_packed;
    const initialBalance = results.initial_balance;

    // The packed format uses null as curve separator
    // Split into individual curves
    const curves: { x: number[]; y: number[] }[] = [];
    let curX: number[] = [];
    let curY: number[] = [];

    for (let i = 0; i < packedX.length; i++) {
      if (packedX[i] === null || packedY[i] === null) {
        if (curX.length > 0) {
          curves.push({ x: [...curX], y: [...curY] });
          curX = [];
          curY = [];
        }
      } else {
        curX.push(packedX[i] as number);
        curY.push(packedY[i] as number);
      }
    }
    if (curX.length > 0) curves.push({ x: curX, y: curY });

    if (curves.length === 0) return;

    // Find median final value curve
    const finalVals = curves.map((c) => c.y[c.y.length - 1]);
    const sorted = [...finalVals].sort((a, b) => a - b);
    const medianFinal = sorted[Math.floor(sorted.length / 2)];
    const worstFinal = sorted[0];
    const bestFinal = sorted[sorted.length - 1];

    const medianIdx = finalVals.findIndex((v) => v === medianFinal);
    const worstIdx = finalVals.findIndex((v) => v === worstFinal);
    const bestIdx = finalVals.findIndex((v) => v === bestFinal);

    // Build traces: background curves (all others), then worst, best, median on top
    const specialIdx = new Set([medianIdx, worstIdx, bestIdx]);

    const bgTraces = curves
      .filter((_, i) => !specialIdx.has(i))
      .map((c) => ({
        x: c.x,
        y: c.y,
        type: 'scattergl' as const,
        mode: 'lines' as const,
        line: { color: alpha(ACCENT, 0.12), width: 1 },
        hoverinfo: 'none' as const,
        showlegend: false,
      }));

    const worstTrace = {
      x: curves[worstIdx]?.x ?? [],
      y: curves[worstIdx]?.y ?? [],
      type: 'scattergl' as const,
      mode: 'lines' as const,
      name: 'Worst Case',
      line: { color: DANGER, width: 1.5, dash: 'dot' as const },
      opacity: 0.7,
    };

    const bestTrace = {
      x: curves[bestIdx]?.x ?? [],
      y: curves[bestIdx]?.y ?? [],
      type: 'scattergl' as const,
      mode: 'lines' as const,
      name: 'Best Case',
      line: { color: SUCCESS, width: 1.5, dash: 'dot' as const },
      opacity: 0.7,
    };

    const medianTrace = {
      x: curves[medianIdx]?.x ?? [],
      y: curves[medianIdx]?.y ?? [],
      type: 'scattergl' as const,
      mode: 'lines' as const,
      name: 'Median',
      line: { color: ACCENT, width: 2.5 },
    };

    // Initial balance reference line
    const refLineLen = Math.max(...curves.map((c) => c.x[c.x.length - 1] ?? 0), 1);
    const refLine = {
      x: [0, refLineLen],
      y: [initialBalance, initialBalance],
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Initial Balance',
      line: { color: WARNING, width: 1, dash: 'dash' as const },
      opacity: 0.6,
    };

    const layout: Partial<Plotly.Layout> = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(10,14,26,0.5)',
      height: 400,
      margin: { t: 20, r: 20, b: 50, l: 70 },
      hovermode: false,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.02,
        font: { color: '#94A3B8', size: 11 },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: 'rgba(0,0,0,0)',
      },
      xaxis: {
        gridcolor: alpha('#2D3748', 0.4),
        color: '#64748B',
        tickfont: { color: '#64748B', size: 11 },
        title: { text: 'Trade #', font: { color: '#64748B', size: 12 } },
        zerolinecolor: alpha('#2D3748', 0.6),
      },
      yaxis: {
        gridcolor: alpha('#2D3748', 0.4),
        color: '#64748B',
        tickfont: { color: '#64748B', size: 11 },
        title: { text: 'Balance ($)', font: { color: '#64748B', size: 12 } },
        zerolinecolor: alpha('#2D3748', 0.6),
        tickformat: ',.0f',
      },
      font: { family: 'Inter, sans-serif' },
    };

    const config: Partial<Plotly.Config> = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
      responsive: true,
    };

    Plotly.newPlot(
      chartRef.current,
      [...bgTraces, worstTrace, bestTrace, refLine, medianTrace],
      layout,
      config
    );

    return () => {
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [results]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha('#2D3748', 0.5)}`,
        backgroundColor: alpha('#111827', 0.7),
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9' }}>
          Equity Curves — {results.n_simulations.toLocaleString()} Simulations
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[
            { label: 'Median', color: ACCENT },
            { label: 'Best', color: SUCCESS },
            { label: 'Worst', color: DANGER },
            { label: 'Initial', color: WARNING },
          ].map((l) => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 2, backgroundColor: l.color, borderRadius: 1 }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box ref={chartRef} />
    </Box>
  );
};

export default EquityCurveChart;
