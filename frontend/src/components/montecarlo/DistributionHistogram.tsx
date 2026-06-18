import React, { useEffect, useRef } from 'react';
import { Box, Typography, Grid, alpha } from '@mui/material';
import Plotly from 'plotly.js-dist-min';
import type { MCResults } from '../../types';

interface DistributionHistogramProps {
  results: MCResults;
}

const ACCENT = '#6366F1';
const DANGER = '#EF4444';

const DistributionHistogram: React.FC<DistributionHistogramProps> = ({ results }) => {
  const balanceRef = useRef<HTMLDivElement>(null);
  const drawdownRef = useRef<HTMLDivElement>(null);

  const commonLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(10,14,26,0.5)',
    height: 260,
    margin: { t: 20, r: 15, b: 50, l: 55 },
    legend: { font: { color: '#94A3B8', size: 10 }, bgcolor: 'rgba(0,0,0,0)' },
    font: { family: 'Inter, sans-serif' },
    xaxis: {
      gridcolor: alpha('#2D3748', 0.4),
      color: '#64748B',
      tickfont: { color: '#64748B', size: 10 },
      zerolinecolor: alpha('#2D3748', 0.6),
    },
    yaxis: {
      gridcolor: alpha('#2D3748', 0.4),
      color: '#64748B',
      tickfont: { color: '#64748B', size: 10 },
      title: { text: 'Count', font: { color: '#64748B', size: 11 } },
    },
  };

  const commonConfig: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true,
  };

  // Balance Distribution
  useEffect(() => {
    if (!balanceRef.current || !results) return;

    const { bins, counts } = results.balance_histogram;
    const meanVal = results.mean_return * results.initial_balance / 100 + results.initial_balance;

    const trace: Plotly.Data = {
      x: bins,
      y: counts,
      type: 'bar',
      marker: {
        color: bins.map((b) => (b >= results.initial_balance ? alpha(ACCENT, 0.7) : alpha(DANGER, 0.5))),
        line: { color: 'transparent', width: 0 },
      },
      name: 'Final Balance',
    };

    const meanLine: Plotly.Data = {
      x: [meanVal, meanVal],
      y: [0, Math.max(...counts) * 1.1],
      type: 'scatter',
      mode: 'lines',
      name: 'Mean',
      line: { color: '#F59E0B', width: 2, dash: 'dash' },
    };

    const layout: Partial<Plotly.Layout> = {
      ...commonLayout,
      bargap: 0.05,
      xaxis: {
        ...commonLayout.xaxis,
        title: { text: 'Final Balance ($)', font: { color: '#64748B', size: 11 } },
        tickformat: ',.0f',
      },
    };

    Plotly.newPlot(balanceRef.current, [trace, meanLine], layout, commonConfig);
    return () => { if (balanceRef.current) Plotly.purge(balanceRef.current); };
  }, [results]);

  // Drawdown Distribution
  useEffect(() => {
    if (!drawdownRef.current || !results) return;

    const { bins, counts } = results.drawdown_histogram;
    const meanDD = results.avg_drawdown;

    const trace: Plotly.Data = {
      x: bins,
      y: counts,
      type: 'bar',
      marker: {
        color: bins.map((b) => {
          const opacity = 0.3 + (Math.abs(b) / (Math.max(...bins.map(Math.abs)) || 1)) * 0.5;
          return `rgba(239,68,68,${opacity})`;
        }),
        line: { color: 'transparent', width: 0 },
      },
      name: 'Max Drawdown',
    };

    const meanLine: Plotly.Data = {
      x: [meanDD, meanDD],
      y: [0, Math.max(...counts) * 1.1],
      type: 'scatter',
      mode: 'lines',
      name: 'Avg DD',
      line: { color: '#F59E0B', width: 2, dash: 'dash' },
    };

    const layout: Partial<Plotly.Layout> = {
      ...commonLayout,
      bargap: 0.05,
      xaxis: {
        ...commonLayout.xaxis,
        title: { text: 'Max Drawdown (%)', font: { color: '#64748B', size: 11 } },
        tickformat: '.1f',
      },
    };

    Plotly.newPlot(drawdownRef.current, [trace, meanLine], layout, commonConfig);
    return () => { if (drawdownRef.current) Plotly.purge(drawdownRef.current); };
  }, [results]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha('#2D3748', 0.5)}`,
            backgroundColor: alpha('#111827', 0.7),
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
            Final Balance Distribution
          </Typography>
          <Box ref={balanceRef} />
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha('#2D3748', 0.5)}`,
            backgroundColor: alpha('#111827', 0.7),
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
            Max Drawdown Distribution
          </Typography>
          <Box ref={drawdownRef} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default DistributionHistogram;
