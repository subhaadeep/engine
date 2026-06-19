import React, { useEffect, useRef } from 'react';
import { Box, Typography, Grid, alpha } from '@mui/material';
import Plotly from 'plotly.js-dist-min';
import type { MCResults } from '../../types';

interface Props { results: MCResults; }

const ACCENT = '#6366F1';
const DANGER = '#EF4444';

const DistributionHistogram: React.FC<Props> = ({ results }) => {
  const balanceRef = useRef<HTMLDivElement>(null);

  const commonLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(10,14,26,0.5)',
    height: 260,
    margin: { t: 20, r: 15, b: 50, l: 55 },
    font: { family: 'Inter, sans-serif' },
    xaxis: {
      gridcolor: alpha('#2D3748', 0.4),
      color: '#64748B',
      tickfont: { color: '#64748B', size: 10 },
    },
    yaxis: {
      gridcolor: alpha('#2D3748', 0.4),
      color: '#64748B',
      tickfont: { color: '#64748B', size: 10 },
      title: { text: 'Count', font: { color: '#64748B', size: 11 } },
    },
  };

  const commonConfig: Partial<Plotly.Config> = { displayModeBar: false, responsive: true };

  useEffect(() => {
    if (!balanceRef.current || !results?.balance_histogram) return;
    const { bin_edges, counts } = results.balance_histogram;
    const meanVal = results.mean_final_balance ?? 0;

    const trace: Plotly.Data = {
      x: bin_edges,
      y: counts,
      type: 'bar',
      marker: {
        color: bin_edges.map((b) => b >= meanVal ? alpha(ACCENT, 0.7) : alpha(DANGER, 0.5)),
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha('#2D3748', 0.5)}`, backgroundColor: alpha('#111827', 0.7), p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
            Final Balance Distribution
          </Typography>
          <Box ref={balanceRef} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default DistributionHistogram;
